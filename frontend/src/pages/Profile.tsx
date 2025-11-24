import { useEffect, useState } from "react";
import { fetchMe, fetchUserBio, updateUserProfile, updateUserBio } from "../utils/api";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  id: number;
  email: string;
  username: string;
  bio?: string | null;
  profilePic?: string | null;
}

interface UserBio {
  interest1: string;
  interest2: string;
  interest3: string;
  music: string;
  hobby: string;
}

const EMPTY_BIO: UserBio = {
  interest1: "",
  interest2: "",
  interest3: "",
  music: "",
  hobby: "",
};

const Profile = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bio, setBio] = useState<UserBio>(EMPTY_BIO);
  const [basicForm, setBasicForm] = useState({ username: "", bio: "", profilePic: "" });
  const [bioForm, setBioForm] = useState(EMPTY_BIO);
  const [loading, setLoading] = useState(true);
  const [savingBasic, setSavingBasic] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
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
          profilePic: me.profilePic || "",
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
      })
      .finally(() => setLoading(false));
  }, [navigate]);

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

  if (loading) return <div className="page-surface"><div className="card">Loading profile…</div></div>;
  if (!user) return <div className="page-surface"><div className="card">Unable to load profile.</div></div>;

  const interestChips = [bio.interest1, bio.interest2, bio.interest3, bio.music, bio.hobby].filter(Boolean);

  return (
    <main className="page-surface">
      <section className="card">
        <div className="profile-header">
          <img
            className="avatar"
            src={basicForm.profilePic || "https://via.placeholder.com/64?text=%F0%9F%91%A4"}
            alt="Avatar"
          />
          <div className="profile-meta">
            <strong>{user.username || "Unnamed"}</strong>
            <span className="text-muted">{user.email}</span>
            {interestChips.length > 0 && (
              <div className="tag-cloud">
                {interestChips.map((chip, idx) => (
                  <span key={idx} className="tag">{chip}</span>
                ))}
              </div>
            )}
          </div>
        </div>

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
            <label htmlFor="profilePic">Profile picture URL</label>
            <input
              id="profilePic"
              name="profilePic"
              value={basicForm.profilePic}
              onChange={e => setBasicForm(prev => ({ ...prev, profilePic: e.target.value }))}
              placeholder="https://example.com/me.png"
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
      </section>

      <section className="card">
        <h3 className="section-heading">Signature interests</h3>
        <p className="text-muted">These details power your recommendations.</p>
        <form onSubmit={handleBioSubmit} style={{ marginTop: "1rem" }}>
          <div className="info-grid">
            {( ["interest1", "interest2", "interest3", "music", "hobby"] as Array<keyof UserBio>).map(field => (
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
          </div>
          <button type="submit" className="btn btn-primary" disabled={savingBio}>
            {savingBio ? "Saving..." : "Save interests"}
          </button>
        </form>
        {error && <p className="form-feedback form-feedback--error">{error}</p>}
        {message && <p className="form-feedback form-feedback--success">{message}</p>}
      </section>
    </main>
  );
};

export default Profile;
