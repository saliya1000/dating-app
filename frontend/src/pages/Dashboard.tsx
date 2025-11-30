import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchMe, fetchRecommendations, fetchConnections, fetchUserBio } from "../utils/api";
import { DEFAULT_PROFILE_PIC_URL } from "../utils/constants";
import { calculateProfileCompletion } from "../utils/profileCompletion";
// import { NotifContext } from "../App";

function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const [userBio, setUserBio] = useState<any>(null);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [recentChats, setRecentChats] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [stats, setStats] = useState({ connectionsCount: 0, pendingCount: 0, matchingScore: 0 });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    // const notif = useContext(NotifContext);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const loadData = async () => {
            try {
                // 1. Fetch User Profile
                const userData = await fetchMe(token);
                setUser(userData);

                // 2. Fetch User Bio
                const bioData = await fetchUserBio(token);
                setUserBio(bioData);

                // 3. Fetch Recommendations (Top 3)
                const recs = await fetchRecommendations(token);
                if (Array.isArray(recs)) {
                    setRecommendations(recs.slice(0, 3));
                }

                // 4. Fetch Connections for Recent Chats
                const conns = await fetchConnections(token);
                if (Array.isArray(conns)) {
                    // Filter accepted and sort by last message
                    const chats = conns
                        .filter((c: any) => c.status === "accepted")
                        .sort((a: any, b: any) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime())
                        .slice(0, 3);
                    setRecentChats(chats);

                    // 5. Filter Pending Requests
                    const pending = conns.filter((c: any) => c.status === "pending" && c.recipientId === userData.id);
                    setPendingRequests(pending);

                    // 6. Calculate Stats from actual data
                    const acceptedConnections = conns.filter((c: any) => c.status === "accepted");
                    const pendingConnections = conns.filter((c: any) => c.status === "pending");

                    // Calculate matching score based on profile completion and connections
                    const profileComp = calculateProfileCompletion(userData, bioData);
                    let matchingScore = 0;
                    if (profileComp.isComplete) matchingScore += 2;
                    if (acceptedConnections.length > 0) matchingScore += 1;
                    if (acceptedConnections.length >= 5) matchingScore += 1;
                    if (acceptedConnections.length >= 10) matchingScore += 1;

                    setStats({
                        connectionsCount: acceptedConnections.length,
                        pendingCount: pendingConnections.length,
                        matchingScore: Math.min(matchingScore, 5)
                    });
                }
            } catch (error) {
                console.error("Error loading dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) return <div className="page-surface">Loading dashboard...</div>;
    if (!user) return null;

    // Calculate Profile Completion using utility
    const profileCompletion = calculateProfileCompletion(user, userBio);

    return (
        <div className="page-surface">
            <header className="dashboard-header">
                <h1>Welcome back, {user.username}! 👋</h1>
                <p className="text-muted">Here's what's happening in your network.</p>
            </header>

            <div className="dashboard-grid">
                {/* Left Column */}
                <div className="dashboard-column">
                    {/* Profile Completion Widget */}
                    <div className="card widget-card">
                        <h3>Profile Completion</h3>
                        <div className="progress-container">
                            <div className="progress-bar" style={{ width: `${profileCompletion.percentage}%` }}></div>
                        </div>
                        <p className="text-muted small">{profileCompletion.percentage}% Complete</p>
                        {profileCompletion.isComplete ? (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#e8f5e9', borderRadius: '0.5rem', border: '1px solid #4caf50' }}>
                                <p style={{ margin: 0, color: '#2e7d32', fontWeight: 600 }}>🎉 Profile Complete!</p>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#388e3c' }}>
                                    You have maximum possibility to get connected with others!
                                </p>
                            </div>
                        ) : (
                            <>
                                <Link to="/profile" className="btn-link">Complete Profile →</Link>
                                <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#666' }}>
                                    <p style={{ margin: '0.25rem 0', fontWeight: 600 }}>Missing fields:</p>
                                    <ul style={{ margin: '0.25rem 0', paddingLeft: '1.25rem' }}>
                                        {profileCompletion.missingFields.map((field, idx) => (
                                            <li key={idx}>{field}</li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Match Stats Widget */}
                    <div className="card widget-card">
                        <h3>Your Match Stats</h3>
                        <div className="stats-row">
                            <div className="stat-item">
                                <span className="stat-value">{stats.connectionsCount}</span>
                                <span className="stat-label">Connections</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{stats.pendingCount}</span>
                                <span className="stat-label">Pending</span>
                            </div>
                        </div>
                        <div className="matching-score">
                            <span className="stat-label">Matching Score</span>
                            <div className="stars">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className={i < stats.matchingScore ? "star filled" : "star"}>★</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Pending Requests Widget */}
                    {pendingRequests.length > 0 && (
                        <div className="card widget-card">
                            <h3>Pending Requests</h3>
                            <div className="list-widget">
                                {pendingRequests.map((req) => (
                                    <div key={req.id} className="list-item">
                                        <img src={req.requester.profilePic || DEFAULT_PROFILE_PIC_URL} alt="" className="avatar-small" />
                                        <div className="list-content">
                                            <strong>{req.requester.username}</strong>
                                            <span className="text-muted small">wants to connect</span>
                                        </div>
                                        <Link to="/connections" className="btn-icon">➜</Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="dashboard-column flex-grow">
                    {/* Recent Chats Widget */}
                    <div className="card widget-card">
                        <div className="widget-header">
                            <h3>Recent Chats</h3>
                            <Link to="/chat" className="btn-link">View All</Link>
                        </div>
                        {recentChats.length > 0 ? (
                            <div className="list-widget">
                                {recentChats.map((chat) => {
                                    const counterpart = chat.requesterId === user.id ? chat.recipient : chat.requester;
                                    return (
                                        <div key={chat.id} className="list-item clickable" onClick={() => navigate(`/chat?with=${chat.id}`)}>
                                            <div className="avatar-wrapper">
                                                <img src={counterpart.profilePic || DEFAULT_PROFILE_PIC_URL} alt="" className="avatar-medium" />
                                                {/* Online indicator could go here */}
                                            </div>
                                            <div className="list-content">
                                                <strong>{counterpart.username}</strong>
                                                <p className="text-muted small truncate">
                                                    {chat.unreadCount > 0 ? <strong>New message</strong> : "Click to chat"}
                                                </p>
                                            </div>
                                            {chat.unreadCount > 0 && <span className="badge">{chat.unreadCount}</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-muted">No recent chats.</p>
                        )}
                    </div>

                    {/* Top Recommendations Widget */}
                    <div className="card widget-card">
                        <div className="widget-header">
                            <h3>Top Recommendations</h3>
                            <Link to="/recommendations" className="btn-link">Explore</Link>
                        </div>
                        {recommendations.length > 0 ? (
                            <div className="recommendation-grid">
                                {recommendations.map((rec) => (
                                    <div key={rec.id} className="recommendation-card">
                                        <img src={rec.profilePic || DEFAULT_PROFILE_PIC_URL} alt="" className="avatar" />
                                        <div className="recommendation-copy">
                                            <strong>{rec.username}</strong>
                                            <p className="text-muted small" style={{ margin: '0.25rem 0' }}>
                                                {rec.bio || "No bio available"}
                                            </p>
                                            {rec.highlights && rec.highlights.length > 0 && (
                                                <div className="badge-row" style={{ marginTop: '0.5rem' }}>
                                                    {rec.highlights.slice(0, 3).map((highlight: string, idx: number) => (
                                                        <span key={idx} className="pill">{highlight}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="list-card__actions">
                                            <Link to={`/users/${rec.id}`} className="btn btn-ghost">View</Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted">No recommendations yet. Complete your profile to get matched!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
