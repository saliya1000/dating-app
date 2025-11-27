import { useEffect, useState } from "react";
import { fetchMe, fetchRecommendations, sendConnectionRequest, dismissUser } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { DEFAULT_PROFILE_PIC_URL } from "../utils/constants";

interface Recommendation {
  userId: number;
  username: string;
  profilePic: string | null;
  bio?: string | null;
  highlights: string[];
  score: number;
}

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [hidden, setHidden] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchMe(token).then(me => {
      if (me?.error) {
        navigate("/login");
        return;
      }
      fetchRecommendations(token)
        .then((data: any[]) => {
          if (!Array.isArray(data)) {
            setError("Could not load recommendations yet.");
            return;
          }
          const normalized = data.map(item => ({
            userId: item.user?.id ?? item.userId,
            username: item.user?.username ?? "Anonymous",
            profilePic: item.user?.profilePic ?? null,
            bio: item.user?.bio ?? item.bio ?? "",
            highlights: [item.interest1, item.interest2, item.interest3, item.music, item.hobby].filter(Boolean),
            score: item.score ?? 0,
          }));
          setRecommendations(normalized);
        })
        .catch(() => setError("Unable to reach the recommendations service."))
        .finally(() => setLoading(false));
    });
  }, [navigate]);

  const handleConnect = async (userId: number) => {
    setSuccessMsg("");
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    await sendConnectionRequest(token, userId);
    setHidden(prev => [...prev, userId]);
    setSuccessMsg("Request sent! Check the Connections page for updates.");
  };

  const handleDismiss = async (userId: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    await dismissUser(token, userId);
    setHidden(prev => [...prev, userId]);
  };

  const visible = recommendations.filter(rec => !hidden.includes(rec.userId));

  if (loading) {
    return <div className="page-surface"><div className="card">Loading recommendations…</div></div>;
  }

  return (
    <main className="page-surface">
      <section className="card">
        <h2 className="section-heading">Recommended connections</h2>
        <p className="text-muted">Curated matches based on your shared interests.</p>
        {error && <p className="form-feedback form-feedback--error">{error}</p>}
        {successMsg && <p className="form-feedback form-feedback--success">{successMsg}</p>}
        {visible.length === 0 ? (
          <div className="empty-state">
            <h3>No new matches right now</h3>
            <p>Update your interests or check back later for fresh people.</p>
          </div>
        ) : (
          <div className="recommendation-grid">
            {visible.map(rec => (
              <article key={rec.userId} className="recommendation-card">
                <img
                  className="avatar"
                  src={rec.profilePic || DEFAULT_PROFILE_PIC_URL}
                  alt={`${rec.username} avatar`}
                />
                <div className="recommendation-copy">
                  <strong>{rec.username}</strong>
                  <p className="connection-meta">
                    Match score: {Math.round((rec.score / 5) * 100) || 0}%
                  </p>
                  <p className="text-muted">{rec.bio || "This member hasn’t added a bio yet."}</p>
                  <div className="badge-row">
                    {rec.highlights.slice(0, 4).map((highlight, idx) => (
                      <span className="pill" key={idx}>{highlight}</span>
                    ))}
                  </div>
                </div>
                <div className="recommendation-actions">
                  <button className="btn btn-secondary" onClick={() => handleDismiss(rec.userId)}>
                    Dismiss
                  </button>
                  <button className="btn btn-primary" onClick={() => handleConnect(rec.userId)}>
                    Connect
                  </button>
                  <button className="btn btn-tertiary" onClick={() => navigate(`/users/${rec.userId}`)}>
                    View Profile
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Recommendations;
