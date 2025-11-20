import { useEffect, useState } from "react";
import { fetchMe, fetchConnections, fetchUserProfile, acceptConnection, rejectConnection, disconnectConnection, cancelConnection } from "../utils/api";
import { useNavigate } from "react-router-dom";

interface ConnectionUser {
  id: number;
  name: string;
  profilePic: string | null;
  status: string; // "connected" | "pending_incoming" | "pending_outgoing"
}

const ConnectionCard = ({ user, onAccept, onReject, onDisconnect, onCancel }:{
  user: ConnectionUser,
  onAccept?: () => void,
  onReject?: () => void,
  onDisconnect?: () => void,
  onCancel?: () => void
}) => (
  <div className="connection-card" style={{border:"1px solid #ccc",borderRadius:8,padding:16,margin:"16px 0",display:"flex",alignItems:"center",gap:16}}>
    <img src={user.profilePic || "https://via.placeholder.com/48?text=%F0%9F%91%A4"} alt="Profile" width={48} height={48} style={{borderRadius:'50%'}} />
    <div style={{flex:1}}>
      <strong>{user.name}</strong><br/>
      <small>Status: {user.status.replace('_',' ')}</small>
    </div>
    {user.status==="pending_incoming" && (
      <>
        <button onClick={onAccept} style={{marginRight:8}}>Accept</button>
        <button onClick={onReject}>Reject</button>
      </>
    )}
    {user.status==="connected" && (<button onClick={onDisconnect}>Disconnect</button>)}
    {user.status==="pending_outgoing" && (<button onClick={onCancel}>Cancel</button>)}
  </div>
);

const Connections = () => {
  const [users, setUsers] = useState<ConnectionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    fetchMe(token).then(me => {
      if (me.error) { navigate("/login"); return; }
      fetchConnections(token).then(async (connections: any[]) => {
        if (!Array.isArray(connections)) { setError("Could not fetch connections."); return; }
        // { id, status: 'connected' | 'pending_incoming' | 'pending_outgoing' }
        const users: ConnectionUser[] = [];
        for (const c of connections) {
          try {
            const info = await fetchUserProfile(token, c.id);
            users.push({
              id: c.id,
              name: info.fullName || "?", // fallback
              profilePic: info.profilePic || null,
              status: c.status,
            });
          } catch { /* skip if error */ }
        }
        setUsers(users);
        setLoading(false);
      });
    });
  }, []);

  const updateStatus = (id:number, status:string) => {
    setUsers(users => users.map(u => u.id !== id ? u : { ...u, status }));
  };

  return (
    <div style={{padding:"2rem",maxWidth:600,margin:"0 auto"}}>
      <h2>Connections</h2>
      {loading && <div>Loading connections...</div>}
      {error && <div style={{color:"red"}}>{error}</div>}
      {users.length === 0 && !loading && <div>No connections or requests found.</div>}
      {users.map(user => (
        <ConnectionCard
          key={user.id}
          user={user}
          onAccept={user.status==="pending_incoming" ? ()=>{
            const token = localStorage.getItem("token");
            if (token) acceptConnection(token, user.id).then(()=>updateStatus(user.id, "connected"));
          } : undefined}
          onReject={user.status==="pending_incoming" ? ()=>{
            const token = localStorage.getItem("token");
            if (token) rejectConnection(token, user.id).then(()=>updateStatus(user.id, ""));
          } : undefined}
          onDisconnect={user.status==="connected" ? ()=>{
            const token = localStorage.getItem("token");
            if (token) disconnectConnection(token, user.id).then(()=>updateStatus(user.id, ""));
          } : undefined}
          onCancel={user.status==="pending_outgoing" ? ()=>{
            const token = localStorage.getItem("token");
            if (token) cancelConnection(token, user.id).then(()=>updateStatus(user.id, ""));
          } : undefined}
        />
      ))}
    </div>
  );
};

export default Connections;
