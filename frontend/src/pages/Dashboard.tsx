import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchMe, fetchRecommendations, fetchConnections } from "../utils/api";
import { DEFAULT_PROFILE_PIC_URL } from "../utils/constants";
// import { NotifContext } from "../App";

function Dashboard() {
    const [user, setUser] = useState<any>(null);
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

                // 2. Fetch Recommendations (Top 3)
                const recs = await fetchRecommendations(token);
                if (Array.isArray(recs)) {
                    setRecommendations(recs.slice(0, 3));
                }

                // 3. Fetch Connections for Recent Chats
                const conns = await fetchConnections(token);
                if (Array.isArray(conns)) {
                    // Filter accepted and sort by last message
                    const chats = conns
                        .filter((c: any) => c.status === "accepted")
                        .sort((a: any, b: any) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime())
                        .slice(0, 3);
                    setRecentChats(chats);

                    // 4. Filter Pending Requests
                    const pending = conns.filter((c: any) => c.status === "pending" && c.recipientId === userData.id);
                    setPendingRequests(pending);

                    // 5. Calculate Stats locally or fetch from new endpoint
                    // Using local calculation for now to save a request, or could use the new endpoint
                    // Let's use the new endpoint for consistency if preferred, but we have data here.
                    // Let's fetch from the new endpoint to get the "Matching Score" logic
                    const statsRes = await fetch("http://localhost:3000/api/dashboard/stats", {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (statsRes.ok) {
                        const statsData = await statsRes.json();
                        setStats(statsData);
                    }
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

    // Calculate Profile Completion
    let completedFields = 0;
    // const totalFields = 4; // bio, interests, profilePic, location/etc
    if (user.bio) completedFields++;
    if (user.interests && user.interests.length > 0) completedFields++;
    if (user.profilePic) completedFields++;
    // Mock 4th field or just use 3
    const completionPercentage = Math.round((completedFields / 3) * 100);

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
                            <div className="progress-bar" style={{ width: `${completionPercentage}%` }}></div>
                        </div>
                        <p className="text-muted small">{completionPercentage}% Complete</p>
                        {completionPercentage < 100 && (
                            <Link to="/profile" className="btn-link">Complete Profile →</Link>
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
                            <div className="recommendations-list">
                                {recommendations.map((rec) => (
                                    <div key={rec.id} className="rec-item">
                                        <img src={rec.profilePic || DEFAULT_PROFILE_PIC_URL} alt="" className="avatar-large" />
                                        <div className="rec-info">
                                            <strong>{rec.username}</strong>
                                            <span className="text-muted small">{rec.sharedInterests?.length || 0} shared interests</span>
                                            <Link to={`/users/${rec.id}`} className="btn btn-sm btn-primary mt-2">View</Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted">No recommendations yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
