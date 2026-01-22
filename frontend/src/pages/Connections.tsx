import { useEffect, useMemo, useState, useContext } from "react";
import { fetchMe, fetchConnections, fetchConnection, respondToConnection } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { DEFAULT_PROFILE_PIC_URL } from "../utils/constants";
import { NotifContext } from "../context/NotifContext";
import { OnlineIndicator } from "../components/OnlineIndicator";

interface BasicUser {
  id: number;
  username: string;
  profilePic: string | null;
  bio?: string | null;
  lastSeen?: string | null;
}

interface ConnectionRecord {
  id: number;
  status: string;
  requesterId: number;
  recipientId: number;
  requester: BasicUser;
  recipient: BasicUser;
}

const Connections = () => {
  const { onlineUsers } = useContext(NotifContext);
  const [me, setMe] = useState<{ id: number } | null>(null);
  const [records, setRecords] = useState<ConnectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchMe(token).then(user => {
      if (user?.error) {
        navigate("/login");
        return;
      }
      setMe({ id: user.id });
      fetchConnections(token)
        .then(async (connectionIds: number[]) => {
          if (!Array.isArray(connectionIds)) {
            setError("Unable to fetch connections.");
            return;
          }
          // Fetch full connection details for each ID
          const connectionPromises = connectionIds.map(id => fetchConnection(token, id));
          const connections = await Promise.all(connectionPromises);
          setRecords(connections);
        })
        .catch(() => setError("Unable to fetch connections."))
        .finally(() => setLoading(false));
    });
  }, [navigate]);

  const { pending, accepted } = useMemo(() => {
    if (!me) return { pending: [], accepted: [] };

    const items = records.map(record => {
      const isRequester = record.requesterId === me.id;
      const counterpart = isRequester ? record.recipient : record.requester;
      const direction =
        record.status === "pending"
          ? (isRequester ? "pending_outgoing" : "pending_incoming")
          : record.status;
      return {
        id: record.id,
        status: record.status,
        direction,
        counterpart,
      };
    });

    return {
      pending: items.filter(item => item.status === "pending"),
      accepted: items.filter(item => item.status === "accepted"),
    };
  }, [records, me]);

  const handleRespond = async (connectionId: number, action: "accept" | "reject") => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const updated = await respondToConnection(token, connectionId, action);
    setRecords(prev => prev.map(rec => rec.id === connectionId ? updated : rec));
  };

  return (
    <main className="page-surface">
      <section className="card">
        <h2 className="section-heading">Connections</h2>
        <p className="text-muted">Manage your accepted matches and pending requests.</p>
        {error && <p className="form-feedback form-feedback--error">{error}</p>}
        {loading && <p>Loading connections…</p>}
        {!loading && pending.length === 0 && accepted.length === 0 && (
          <div className="empty-state">
            <h3>No connections yet</h3>
            <p>Visit the recommendations tab to start meeting people.</p>
          </div>
        )}

        {pending.length > 0 && (
          <div>
            <h3 className="subsection-heading">Pending Requests</h3>
            {pending.map(item => (
              <div key={item.id} className="list-card">
                <img
                  className="avatar"
                  src={item.counterpart.profilePic || DEFAULT_PROFILE_PIC_URL}
                  alt={`${item.counterpart.username} avatar`}
                />
                <div className="list-card__content">
                  <strong>{item.counterpart.username}</strong>
                  <p className="connection-meta">
                    {item.direction === "pending_incoming" && "Wants to connect"}
                    {item.direction === "pending_outgoing" && "Request sent"}
                  </p>
                  <p className="text-muted">{item.counterpart.bio || "No bio yet."}</p>
                </div>
                <div className="list-card__actions">
                  {item.direction === "pending_incoming" && (
                    <>
                      <button className="btn btn-success" onClick={() => handleRespond(item.id, "accept")}>
                        Accept
                      </button>
                      <button className="btn btn-danger" onClick={() => handleRespond(item.id, "reject")}>
                        Reject
                      </button>
                    </>
                  )}
                  {item.direction === "pending_outgoing" && <span className="text-muted">Awaiting response…</span>}
                  <button className="btn btn-tertiary" onClick={() => navigate(`/users/${item.counterpart.id}`)}>
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {accepted.length > 0 && (
          <div className="mt-lg">
            <h3 className="subsection-heading">Accepted Connections</h3>
            {accepted.map(item => {
              const isOnline = onlineUsers.includes(item.counterpart.id);
              return (
                <div key={item.id} className="list-card">
                  <img
                    className="avatar"
                    src={item.counterpart.profilePic || DEFAULT_PROFILE_PIC_URL}
                    alt={`${item.counterpart.username} avatar`}
                  />
                  <div className="list-card__content">
                    <div className="flex flex-center flex-gap">
                      <strong>{item.counterpart.username}</strong>
                      <OnlineIndicator isOnline={isOnline} lastSeen={item.counterpart.lastSeen} showLastSeen={false} />
                    </div>
                    <p className="connection-meta">Connected</p>
                    <p className="text-muted">{item.counterpart.bio || "No bio yet."}</p>
                  </div>
                  <div className="list-card__actions">
                    <button className="btn btn-danger" onClick={() => handleRespond(item.id, "reject")}>
                      Disconnect
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate(`/chat?with=${item.id}`)}>
                      Chat
                    </button>
                    <button className="btn btn-tertiary" onClick={() => navigate(`/users/${item.counterpart.id}`)}>
                      View Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default Connections;
