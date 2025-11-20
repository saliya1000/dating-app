import { useEffect, useState } from "react";
import { fetchMe, fetchRecommendations, fetchUserProfile, connectWithUser, dismissRecommendation } from "../utils/api";
import { useNavigate } from "react-router-dom";

interface RecUserBasic {
  id: number;
  name: string;
  profilePic: string | null;
  about: string;
}

const RecommendationCard = ({ user, onConnect, onDismiss }: {
  user: RecUserBasic, onConnect: () => void, onDismiss: () => void
} ) => (
  <div className="recommendation-card" style={{border:"1px solid #ddd",borderRadius:8,padding:16,margin:"16px 0",display:"flex",alignItems:"center",gap:16}}>
    <img 
      src={user.profilePic || "https://via.placeholder.com/64?text=%F0%9F%91%A4"} 
      alt="Profile" width={64} height={64} style={{borderRadius: "50%"}} 
    />
    <div style={{flex:1}}>
      <strong>{user.name}</strong><br/>
      <span style={{fontSize:14, color:"#555"}}>{user.about}</span>
    </div>
    <button onClick={onConnect} style={{marginRight:8}}>Connect</button>
    <button onClick={onDismiss}>Dismiss</button>
  </div>
);

const Recommendations = () => {
  const [me, setMe] = useState<any>(null);
  const [users, setUsers] = useState<RecUserBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState<number[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login"); return;
    }
    fetchMe(token).then(data => {
      if (data.error) { navigate("/login"); return; }
      if (!(data.fullName && data.about && data.interests && data.favoriteMusic && data.location)) {
        navigate("/profile");
        return;
      }
      setMe(data);
      fetchRecommendations(token).then(async ids => {
        if (!Array.isArray(ids)) return setError("Could not fetch recommendations.");
        // For each id, fetch user displayable info (excluding email)
        const recUsers: RecUserBasic[] = [];
        for (const id of ids) {
          try {
            const info = await fetchUserProfile(token, id);
            recUsers.push({
              id,
              name: info.fullName || "?", // fallback
              profilePic: info.profilePic || null,
              about: info.about || "..."
            });
          } catch { /* skip if error or forbidden */ }
        }
        setUsers(recUsers);
        setLoading(false);
      });
    });
  }, []);

  const handleDismiss = (id:number) => {
    setDismissed(prev => [...prev, id]);
    const token = localStorage.getItem("token");
    if (token) dismissRecommendation(token, id);
  };
  const handleConnect = (id:number) => {
    const token = localStorage.getItem("token");
    if (token) connectWithUser(token, id);
    // Optionally, optimistically hide card or show toast
    setDismissed(prev => [...prev, id]);
  };

  if (loading) return <div style={{padding:"2rem"}}>Loading recommendations...</div>;
  if (users.filter(u=>!dismissed.includes(u.id)).length === 0)
    return <div style={{padding:"2rem"}}><h2>No new recommendations!</h2><p>Try updating your profile or check back later.</p></div>;

  return (
    <div style={{padding:"2rem",maxWidth:600,margin:"0 auto"}}>
      <h2>Recommended Connections</h2>
      {users.filter(u=>!dismissed.includes(u.id)).map(user => (
        <RecommendationCard key={user.id}
          user={user}
          onConnect={()=>handleConnect(user.id)}
          onDismiss={()=>handleDismiss(user.id)}
        />
      ))}
    </div>
  );
};

export default Recommendations;
