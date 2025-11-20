import { useEffect, useState, ChangeEvent } from "react";
import { fetchMe, updateProfile } from "../utils/api";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  about: string;
  interests: string;
  favoriteMusic: string;
  location: string;
  preferredDistance: number;
  profilePic?: string | null;
}

const DEFAULT_PROFILE: Omit<UserProfile, "id" | "email"> = {
  fullName: "",
  about: "",
  interests: "",
  favoriteMusic: "",
  location: "",
  preferredDistance: 10,
  profilePic: null,
};

const isProfileComplete = (user?: Partial<UserProfile>) => {
  if (!user) return false;
  return (
    user.fullName?.trim() &&
    user.about?.trim() &&
    user.interests?.trim() &&
    user.favoriteMusic?.trim() &&
    user.location?.trim()
  );
};

const Profile = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(DEFAULT_PROFILE);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uploadPic, setUploadPic] = useState<File | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchMe(token).then(data => {
      if (data.error) {
        setError(data.error);
        navigate("/login");
      } else {
        setUser(data);
        setForm({
          fullName: data.fullName || "",
          about: data.about || "",
          interests: data.interests || "",
          favoriteMusic: data.favoriteMusic || "",
          location: data.location || "",
          preferredDistance: data.preferredDistance || 10,
          profilePic: data.profilePic || null,
        });
      }
    });
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, preferredDistance: Number(e.target.value) });
  };

  const handlePicChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setUploadPic(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage("");
    const token = localStorage.getItem("token");
    if (!token) return;
    // TODO: add profile pic upload logic if required (API stub for now)
    const result = await updateProfile(token, { ...form, profilePic: uploadPic });
    if (result.error) setError(result.error);
    else { setMessage("Profile updated!"); setUser(result); setEditMode(false); }
  };

  if (!user) return <div>Loading...</div>;

  // Show form if incomplete or editing
  if (!isProfileComplete(user) || editMode) {
    return (
      <div style={{padding:"2rem",maxWidth:500}}>
        <h2>{!isProfileComplete(user) ? "Complete your profile" : "Edit profile"}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Full Name: <br/>
            <input name="fullName" value={form.fullName} onChange={handleChange} required />
          </label><br/><br/>
          <label>
            About Me: <br/>
            <textarea name="about" value={form.about} onChange={handleChange} required rows={3}/>
          </label><br/><br/>
          <label>
            Interests: <br/>
            <input name="interests" value={form.interests} onChange={handleChange} required placeholder="e.g. cooking, music..." />
          </label><br/><br/>
          <label>
            Favorite Music: <br/>
            <input name="favoriteMusic" value={form.favoriteMusic} onChange={handleChange} required />
          </label><br/><br/>
          <label>
            Location (city): <br/>
            <input name="location" value={form.location} onChange={handleChange} required />
          </label><br/><br/>
          <label>
            Preferred Radius (km): <br/>
            <input name="preferredDistance" type="number" value={form.preferredDistance} onChange={handleNumberChange} min={1} required />
          </label><br/><br/>
          <label>
            Profile Picture: <br/>
            <input type="file" accept="image/*" onChange={handlePicChange} />
            {(form.profilePic || user.profilePic) && (
              <div>
                <img src={typeof form.profilePic === 'string' ? form.profilePic : user.profilePic} alt="Profile" width={64} height={64}/>
                <button type="button" onClick={()=>{ setForm({ ...form, profilePic:null }); setUploadPic(null); }}>Remove</button>
              </div>
            )}
          </label><br/>
          <button type="submit">Save</button>
        </form>
        {error && <p style={{color:"red"}}>{error}</p>}
        {message && <p style={{color:"green"}}>{message}</p>}
      </div>
    );
  }

  // View mode (profile complete, not editing)
  return (
    <div style={{padding:"2rem",maxWidth:500}}>
      <h2>My Profile</h2>
      <img src={user.profilePic || "https://via.placeholder.com/64?text=%F0%9F%91%A4"} alt="Profile" width={64} height={64}/>
      <p><strong>Name:</strong> {user.fullName}</p>
      <p><strong>About:</strong> {user.about}</p>
      <p><strong>Interests:</strong> {user.interests}</p>
      <p><strong>Favorite Music:</strong> {user.favoriteMusic}</p>
      <p><strong>Location:</strong> {user.location}</p>
      <p><strong>Preferred Distance:</strong> {user.preferredDistance} km</p>
      <p><strong>Email:</strong> {user.email}</p>
      <button onClick={()=>setEditMode(true)}>Edit</button>
    </div>
  );
};

export default Profile;
