import { useEffect, useMemo, useState } from "react";
import { fetchMe, fetchConnections, respondToConnection } from "../utils/api";
import { useNavigate } from "react-router-dom";

interface BasicUser {
  id: number;
  username: string;
  profilePic: string | null;
  bio?: string | null;
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
        .then((response) => {
          if (!Array.isArray(response)) {
            setError("Unable to fetch connections.");
            return;
          }
          setRecords(response);
        })
        .catch(() => setError("Unable to fetch connections."))
        .finally(() => setLoading(false));
    });
  }, [navigate]);

  const items = useMemo(() => {
    if (!me) return [];
    return records.map(record => {
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
        {!loading && items.length === 0 && (
          <div className="empty-state">
            <h3>No connections yet</h3>
            <p>Visit the recommendations tab to start meeting people.</p>
          </div>
        )}
        {items.map(item => (
          <div key={item.id} className="list-card">
            <img
              className="avatar"
              src={item.counterpart.profilePic || "https://via.placeholder.com/56?text=%F0%9F%91%A4"}
              alt={`${item.counterpart.username} avatar`}
            />
            <div className="list-card__content">
              <strong>{item.counterpart.username}</strong>
              <p className="connection-meta">
                {item.direction === "pending_incoming" && "Wants to connect"}
                {item.direction === "pending_outgoing" && "Request sent"}
                {item.direction === "accepted" && "Connected"}
                {item.direction !== "pending_incoming" && item.direction !== "pending_outgoing" && item.direction !== "accepted" && item.direction}
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
              {item.direction === "accepted" && <span className="text-muted">Connected</span>}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
};

export default Connections;
