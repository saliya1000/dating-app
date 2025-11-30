import { useEffect, useState, useContext } from "react";
import { fetchMe, fetchUserBio, updateUserProfile, updateUserBio, fetchUser, deleteConnection } from "../utils/api";
import { useNavigate, useParams } from "react-router-dom";
import { DEFAULT_PROFILE_PIC_URL } from "../utils/constants";
import { NotifContext } from "../App";
import { OnlineIndicator } from "../components/OnlineIndicator";

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
}

const EMPTY_BIO: UserBio = {
  interest1: "",
  interest2: "",
  interest3: "",
  music: "",
  hobby: "",
};

const Profile = () => {
  const { id } = useParams();
  const { onlineUsers } = useContext(NotifContext);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bio, setBio] = useState<UserBio>(EMPTY_BIO);
  const [basicForm, setBasicForm] = useState({ username: "", bio: "", profilePic: "" });
  const [bioForm, setBioForm] = useState(EMPTY_BIO);
  const [loading, setLoading] = useState(true);
  const [savingBasic, setSavingBasic] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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

  const handleBioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const token = localStorage.getItem("token");
    if (!token) return;
    setSavingBio(true);
    const response = await updateUserBio(token, bioForm);
    setSavingBio(false);
    if (response?.error) {
      setError(response.error);
    } else {
      setBio(response);
      setMessage("Interests updated!");
    }
  };

  const handleLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const token = localStorage.getItem("token");
          if (!token) return;
          await updateUserProfile(token, { latitude, longitude });
          setUser(prev => prev ? { ...prev, latitude, longitude } : null);
          setMessage("Location updated! Refreshing...");
          // Reload page to update profile completion
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        },
        () => {
          setError("Unable to retrieve your location.");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
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

  if (loading) return <div className="page-surface"><div className="card">Loading profile…</div></div>;
  if (error) return <div className="page-surface"><div className="card"><p className="form-feedback form-feedback--error">{error}</p></div></div>;
  if (!user) return <div className="page-surface"><div className="card">Unable to load profile.</div></div>;

  const interestChips = [bio.interest1, bio.interest2, bio.interest3, bio.music, bio.hobby].filter(Boolean);
  const isOnline = !isMe && onlineUsers.includes(user.id);

  return (
    <main className="page-surface">
      <section className="card">
        <div className="profile-header">
          <img
            className="avatar"
            src={isMe ? basicForm.profilePic : user?.profilePic || "👤"}
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
            {!isMe && user.connection?.status === "accepted" && (
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
                style={{ marginTop: "0.5rem" }}
              >
                {disconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
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
              <input
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
              />
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
          <h3 className="section-heading">Signature interests & Location</h3>
          <p className="text-muted">These details power your recommendations.</p>
          <form onSubmit={handleBioSubmit} style={{ marginTop: "1rem" }}>
            <div className="info-grid">
              {(["interest1", "interest2", "interest3", "music", "hobby"] as Array<keyof UserBio>).map(field => (
                <div className="form-field" key={field}>
                  <label htmlFor={field}>
                    {field.startsWith("interest") ? `Interest ${field.slice(-1)}` : field === "music" ? "Favorite music" : "Hobby"}
                  </label>
                  <input
                    id={field}
                    name={field}
                    value={bioForm[field]}
                    onChange={e => setBioForm(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder="Add a value"
                    required
                  />
                </div>
              ))}
              <div className="form-field">
                <label htmlFor="maxDistance">Max distance (km)</label>
                <input
                  id="maxDistance"
                  name="maxDistance"
                  type="number"
                  value={bioForm.maxDistance || ""}
                  onChange={e => setBioForm(prev => ({ ...prev, maxDistance: parseInt(e.target.value, 10) }))}
                  placeholder="e.g., 50"
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleLocation}>
                Set Current Location
              </button>
              <button type="submit" className="btn btn-primary" disabled={savingBio}>
                {savingBio ? "Saving..." : "Save Interests & Location"}
              </button>
            </div>
          </form>
          {error && <p className="form-feedback form-feedback--error">{error}</p>}
          {message && <p className="form-feedback form-feedback--success">{message}</p>}
        </section>
      )}
    </main>
  );
};

export default Profile;
