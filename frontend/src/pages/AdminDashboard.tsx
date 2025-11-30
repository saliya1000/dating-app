import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchMe, fetchAdminStats } from "../utils/api";

function AdminDashboard() {
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeToday: 0,
        totalConnections: 0,
        messagesToday: 0,
        pendingReports: 0,
        bannedUsers: 0,
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        fetchMe(token).then((me) => {
            if (me?.error || me.role !== "ADMIN") {
                navigate("/");
                return;
            }
            setUser(me);

            fetchAdminStats(token).then((data) => {
                if (!data.error) {
                    setStats(data);
                }
                setLoading(false);
            });
        });
    }, [navigate]);

    if (loading) return <div className="page-surface"><div className="card">Loading...</div></div>;

    return (
        <main className="page-surface">
            <section className="card">
                <h1 className="section-heading">🛡️ Super Admin Dashboard</h1>
                <p className="text-muted">Welcome back, {user?.username}</p>

                <div className="admin-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "2rem" }}>
                    <div className="stat-card card" style={{ padding: "1.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#0D8ABC" }}>{stats.totalUsers}</div>
                        <div className="text-muted">Total Users</div>
                    </div>

                    <div className="stat-card card" style={{ padding: "1.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#10B981" }}>{stats.activeToday}</div>
                        <div className="text-muted">Active Today</div>
                    </div>

                    <div className="stat-card card" style={{ padding: "1.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#8B5CF6" }}>{stats.totalConnections}</div>
                        <div className="text-muted">Total Connections</div>
                    </div>

                    <div className="stat-card card" style={{ padding: "1.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#F59E0B" }}>{stats.messagesToday}</div>
                        <div className="text-muted">Messages Today</div>
                    </div>

                    <div className="stat-card card" style={{ padding: "1.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#EF4444" }}>{stats.pendingReports}</div>
                        <div className="text-muted">Pending Reports</div>
                    </div>

                    <div className="stat-card card" style={{ padding: "1.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#6B7280" }}>{stats.bannedUsers}</div>
                        <div className="text-muted">Banned Users</div>
                    </div>
                </div>

                <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
                    <Link to="/admin/users" className="btn btn-primary">Manage Users</Link>
                    <Link to="/admin/reports" className="btn btn-secondary">View Reports</Link>
                    <Link to="/admin/inquiries" className="btn btn-secondary">View Inquiries</Link>
                </div>
            </section>
        </main>
    );
}

export default AdminDashboard;
