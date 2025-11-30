import { useEffect, useState, useContext, useRef } from "react";
import { fetchMe, fetchUserBio, updateUserProfile, updateUserBio, fetchUser, deleteConnection, submitReport } from "../utils/api";
import { useNavigate, useParams } from "react-router-dom";
import { DEFAULT_PROFILE_PIC_URL } from "../utils/constants";
import { NotifContext } from "../context/NotifContext";
import { OnlineIndicator } from "../components/OnlineIndicator";
import { CITIES } from "../utils/cities";

interface UserProfile {
  id: number;
  email: string;
  username: string;
  bio?: string | null;
  profilePic?: string | null;
  lastSeen?: string | null;
  connection?: {
    id: number;
    status: string;
    requesterId: number;
  };
}

interface UserBio {
  interest1: string;
  interest2: string;
  interest3: string;
  music: string;
  hobby: string;
  maxDistance?: number;
  prefInterest?: string;
  prefMusic?: string;
  prefHobby?: string;
}

const EMPTY_BIO: UserBio = {
  interest1: "",
  interest2: "",
  interest3: "",
  music: "",
  hobby: "",
  maxDistance: 50,
  prefInterest: "",
  prefMusic: "",
  prefHobby: "",
};

const Profile = () => {
  const { id } = useParams();
  const { onlineUsers, currentUser } = useContext(NotifContext);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bio, setBio] = useState<UserBio>(EMPTY_BIO);
  const [basicForm, setBasicForm] = useState({ username: "", bio: "", profilePic: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bioForm, setBioForm] = useState({
    interest1: "",
    interest2: "",
    interest3: "",
    music: "",
    hobby: "",
    maxDistance: 50,
    prefInterest: "",
    prefMusic: "",
    prefHobby: "",
  });
  const [loading, setLoading] = useState(true);
  const [savingBasic, setSavingBasic] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("fake_profile");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const navigate = useNavigate();
  const isMe = !id;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (isMe) {
      Promise.all([fetchMe(token), fetchUserBio(token)])
        .then(([me, meBio]) => {
          if (me?.error) {
            setError(me.error);
            navigate("/login");
            return;
          }
          setUser(me);
          setBasicForm({
            username: me.username || "",
            bio: me.bio || "",
            profilePic: me.profilePic || DEFAULT_PROFILE_PIC_URL,
          });
          if (meBio) {
            setBio(meBio);
            setBioForm({
              interest1: meBio.interest1 || "",
              interest2: meBio.interest2 || "",
              interest3: meBio.interest3 || "",
              music: meBio.music || "",
              hobby: meBio.hobby || "",
              maxDistance: meBio.maxDistance || 50,
              prefInterest: meBio.prefInterest || "",
              prefMusic: meBio.prefMusic || "",
              prefHobby: meBio.prefHobby || "",
            });
          }

          // Auto-request location if not set
          if (!me.latitude || !me.longitude) {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                async (position) => {
                  const { latitude, longitude } = position.coords;
                  await updateUserProfile(token, { latitude, longitude });
                  setUser(prev => prev ? { ...prev, latitude, longitude } : null);
                  setMessage("Location automatically set!");
                },
                (error) => {
                  console.log("Location permission denied or unavailable:", error);
                  // Don't show error, just let user set it manually
                }
              );
            }
          }
        })
        .finally(() => setLoading(false));
    } else {
      Promise.all([fetchUser(token, id), fetchUserBio(token, id)])
        .then(([user, userBio]) => {
          if (user?.error) {
            setError(user.error);
            setLoading(false);
            return;
          }
          if (!user) {
            setError("User not found");
            setLoading(false);
            return;
          }
          setUser(user);
          if (userBio && !userBio.error) {
            setBio(userBio);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching user:", err);
          setError("Failed to load user profile");
          setLoading(false);
        });
    }
  }, [navigate, isMe, id]);

  const handleBasicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const token = localStorage.getItem("token");
    if (!token) return;
    setSavingBasic(true);
    const response = await updateUserProfile(token, {
      username: basicForm.username,
      bio: basicForm.bio,
      profilePic: basicForm.profilePic || null,
    });
    setSavingBasic(false);
    if (response?.error) {
      setError(response.error);
    } else {
      setUser(response);
      setMessage("Profile saved successfully!");
    }
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setBioForm(prev => ({
      ...prev,
      [name]: (type === "number" || type === "range") ? parseInt(value, 10) : value,
    }));
  };

  const handleBioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const token = localStorage.getItem("token");
    if (!token) return;
    setSavingBio(true);
    try {
      const response = await updateUserBio(token, bioForm);
      if (response?.error) {
        setError(response.error);
      } else {
        setBio(response);
        setMessage("Interests updated!");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save interests.");
    } finally {
      setSavingBio(false);
    }
  };

  const handleLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const token = localStorage.getItem("token");
        if (!token) return;
        await updateUserProfile(token, { latitude, longitude });
        setUser(prev => prev ? { ...prev, latitude, longitude } : null);
        setMessage("Location updated! Refreshing...");
        // Reload to update profile completion
        setTimeout(() => window.location.reload(), 1000);
      },
      (err) => {
        setError("Unable to retrieve your location.");
        console.error(err);
      }
    );
  };

  const handleCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityName = e.target.value;
    const city = CITIES.find(c => c.name === cityName);
    const token = localStorage.getItem("token");
    if (!token) return;

    if (city) {
      if (city.name === "Use GPS") {
        handleLocation(); // This will handle setting location via GPS
      } else if (city.lat !== null && city.lon !== null) {
        await updateUserProfile(token, { latitude: city.lat, longitude: city.lon });
        setUser(prev => prev ? { ...prev, latitude: city.lat, longitude: city.lon } : null);
        setMessage("Location updated! Refreshing...");
        // Reload to update profile completion
        setTimeout(() => window.location.reload(), 1000);
      }
    }
  };

  const handleDisconnect = async () => {
    if (!user?.connection?.id) return;
    if (!window.confirm("Are you sure you want to disconnect?")) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setDisconnecting(true);
    try {
      await deleteConnection(token, user.connection.id);
      navigate("/connections"); // Redirect to connections page after disconnect
    } catch (err) {
      setError("Failed to disconnect.");
      setDisconnecting(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setSubmittingReport(true);
    try {
      await submitReport(token, {
        reportedId: user.id,
        reason: reportReason,
        details: reportDetails
      });
      setShowReportModal(false);
      setMessage("User reported successfully.");
      setReportDetails("");
      setReportReason("fake_profile");
    } catch (err) {
      console.error(err);
      setError("Failed to submit report.");
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) return <div className="page-surface"><div className="card">Loading profile…</div></div>;
  if (error) return <div className="page-surface"><div className="card"><p className="form-feedback form-feedback--error">{error}</p></div></div>;
  if (!user) return <div className="page-surface"><div className="card">Unable to load profile.</div></div>;

  const interestChips = [bio.interest1, bio.interest2, bio.interest3, bio.music, bio.hobby].filter(Boolean);
  const isOnline = !isMe && onlineUsers.includes(user.id);

  const getProfileSrc = (u: UserProfile | null, formPic?: string) => {
    const pic = formPic !== undefined ? formPic : u?.profilePic;
    if (pic && pic !== DEFAULT_PROFILE_PIC_URL && !pic.includes("ui-avatars.com")) return pic;

    // Generate default avatar based on username
    const name = u?.username || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
  };

  const currentProfilePic = isMe ? basicForm.profilePic : user?.profilePic;
  const isDefaultImage = !currentProfilePic || currentProfilePic === DEFAULT_PROFILE_PIC_URL || currentProfilePic.includes("ui-avatars.com");

  // Safe city calculation
  const userLat = (user as any)?.latitude;
  const userLon = (user as any)?.longitude;
  const currentCity = CITIES.find(c =>
    userLat && userLon &&
    Math.abs(userLat - (c.lat || 0)) < 0.1 &&
    Math.abs(userLon - (c.lon || 0)) < 0.1
  )?.name || "Use GPS";

  return (
    <main className="page-surface">
      <section className="card">
        <div className="profile-header">
          <img
            className="avatar"
            src={getProfileSrc(user, isMe ? basicForm.profilePic : undefined)}
            alt="Avatar"
          />
          <div className="profile-meta">
            <strong>{isMe ? basicForm.username : user?.username || "Unnamed"}</strong>
            {!isMe && <OnlineIndicator isOnline={isOnline} lastSeen={user.lastSeen} />}
            {isMe && <span className="text-muted">{user.email}</span>}
            {interestChips.length > 0 && (
              <div className="tag-cloud">
                {interestChips.map((chip, idx) => (
                  <span key={idx} className="tag">{chip}</span>
                ))}
              </div>
            )}
            {!isMe && currentUser?.role !== "ADMIN" && user.connection?.status === "accepted" && (
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/chat?with=${user.connection?.id}`)}
                >
                  Chat
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? "Disconnecting..." : "Disconnect"}
                </button>
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => setShowReportModal(true)}
                >
                  Report
                </button>
              </div>
            )}
          </div>
        </div>
        {isMe && (
          <form className="split-layout" onSubmit={handleBasicSubmit} style={{ marginTop: "1.25rem" }}>
            <div className="form-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                value={basicForm.username}
                onChange={e => setBasicForm(prev => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="profilePic">Profile picture</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  ref={fileInputRef}
                  id="profilePic"
                  name="profilePic"
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setBasicForm(prev => ({ ...prev, profilePic: reader.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ flex: 1 }}
                />
                {basicForm.profilePic && !isDefaultImage && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      setBasicForm(prev => ({ ...prev, profilePic: "" }));
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div className="form-field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={basicForm.bio}
                onChange={e => setBasicForm(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingBasic}>
              {savingBasic ? "Saving..." : "Save profile"}
            </button>
          </form>
        )}
      </section>

      {isMe && (
        <section className="card">
          <form onSubmit={handleBioSubmit} className="bio-form">
            <div className="form-section">
              <h3 className="section-heading">Your Interests</h3>
              <div className="info-grid">
                <div className="form-group">
                  <label>Interest 1</label>
                  <input
                    type="text"
                    name="interest1"
                    value={bioForm.interest1}
                    onChange={handleBioChange}
                    placeholder="e.g. Cooking"
                  />
                </div>
                <div className="form-group">
                  <label>Interest 2</label>
                  <input
                    type="text"
                    name="interest2"
                    value={bioForm.interest2}
                    onChange={handleBioChange}
                    placeholder="e.g. Yoga"
                  />
                </div>
                <div className="form-group">
                  <label>Interest 3</label>
                  <input
                    type="text"
                    name="interest3"
                    value={bioForm.interest3}
                    onChange={handleBioChange}
                    placeholder="e.g. Traveling"
                  />
                </div>
                <div className="form-group">
                  <label>Favorite Music Genre</label>
                  <input
                    type="text"
                    name="music"
                    value={bioForm.music}
                    onChange={handleBioChange}
                    placeholder="e.g. Pop"
                  />
                </div>
                <div className="form-group">
                  <label>Favorite Hobby</label>
                  <input
                    type="text"
                    name="hobby"
                    value={bioForm.hobby}
                    onChange={handleBioChange}
                    placeholder="e.g. Skateboarding"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-heading">Location & Distance</h3>
              <div className="info-grid">
                <div className="form-group">
                  <label>Current Location</label>
                  <select
                    onChange={handleCityChange}
                    defaultValue={currentCity}
                  >
                    {CITIES.map(city => (
                      <option key={city.name} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Max Distance (km): {bioForm.maxDistance}</label>
                  <input
                    type="range"
                    name="maxDistance"
                    min="1"
                    max="500"
                    value={bioForm.maxDistance}
                    onChange={handleBioChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-heading">Matching Preferences</h3>
              <p className="text-muted small" style={{ marginBottom: '1.5rem' }}>
                Tell us what you're looking for. We'll prioritize people who match these.
              </p>

              <div className="info-grid">
                <div className="form-group">
                  <label>Preferred Interest</label>
                  <input
                    type="text"
                    name="prefInterest"
                    value={bioForm.prefInterest}
                    onChange={handleBioChange}
                    placeholder="e.g. Cooking"
                  />
                </div>
                <div className="form-group">
                  <label>Preferred Music</label>
                  <input
                    type="text"
                    name="prefMusic"
                    value={bioForm.prefMusic}
                    onChange={handleBioChange}
                    placeholder="e.g. Jazz"
                  />
                </div>
                <div className="form-group">
                  <label>Preferred Hobby</label>
                  <input
                    type="text"
                    name="prefHobby"
                    value={bioForm.prefHobby}
                    onChange={handleBioChange}
                    placeholder="e.g. Reading"
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={savingBio}>
                {savingBio ? "Saving..." : "Save Bio & Preferences"}
              </button>
            </div>
          </form>
          {error && <p className="form-feedback form-feedback--error">{error}</p>}
          {message && <p className="form-feedback form-feedback--success">{message}</p>}
        </section >
      )}

      {showReportModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
          <div className="card" style={{ width: "90%", maxWidth: "500px", position: "relative" }}>
            <button
              onClick={() => setShowReportModal(false)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}
            >
              &times;
            </button>
            <h2 className="section-heading">Report User</h2>
            <form onSubmit={handleReportSubmit}>
              <div className="form-group">
                <label>Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem" }}
                >
                  <option value="fake_profile">Fake Profile</option>
                  <option value="harassment">Harassment</option>
                  <option value="inappropriate_content">Inappropriate Content</option>
                  <option value="spam">Spam</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label>Details (Optional)</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={4}
                  style={{ width: "100%", padding: "0.5rem" }}
                  placeholder="Please provide more details..."
                />
              </div>
              <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={submittingReport}
                >
                  {submittingReport ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main >
  );
};

export default Profile;
