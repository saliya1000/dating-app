import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMe, fetchAdminUsers, toggleUserBan, toggleUserActive, deleteUser } from "../utils/api";

function AdminUsers() {
    // const [user, setUser] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
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
            // setUser(me);
            loadUsers(token);
        });
    }, [navigate]);

    const loadUsers = async (token?: string) => {
        const t = token || localStorage.getItem("token");
        if (!t) return;

        const params: any = {};
        if (search) params.search = search;
        if (status !== "all") params.status = status;

        const data = await fetchAdminUsers(t, params);
        if (!data.error) {
            setUsers(data.users);
        }
        setLoading(false);
    };

    const handleBan = async (userId: number) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        await toggleUserBan(token, userId);
        loadUsers();
    };

    const handleDisable = async (userId: number) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        await toggleUserActive(token, userId);
        loadUsers();
    };

    const handleDelete = async (userId: number) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        await deleteUser(token, userId);
        loadUsers();
    };

    if (loading) return <div className="page-surface"><div className="card">Loading...</div></div>;

    return (
        <main className="page-surface">
            <section className="card">
                <h1 className="section-heading">👥 User Management</h1>

                <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                    <input
                        type="text"
                        placeholder="Search by username or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1, minWidth: "200px" }}
                    />
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="all">All Users</option>
                        <option value="banned">Banned</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <button className="btn btn-primary" onClick={() => loadUsers()}>Search</button>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                                <th style={{ padding: "0.75rem" }}>ID</th>
                                <th style={{ padding: "0.75rem" }}>Username</th>
                                <th style={{ padding: "0.75rem" }}>Email</th>
                                <th style={{ padding: "0.75rem" }}>Status</th>
                                <th style={{ padding: "0.75rem" }}>Reports</th>
                                <th style={{ padding: "0.75rem" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                    <td style={{ padding: "0.75rem" }}>{u.id}</td>
                                    <td style={{ padding: "0.75rem" }}>{u.username}</td>
                                    <td style={{ padding: "0.75rem" }}>{u.email}</td>
                                    <td style={{ padding: "0.75rem" }}>
                                        {u.isBanned && <span style={{ color: "#EF4444", fontWeight: "bold" }}>🚫 BANNED</span>}
                                        {!u.isActive && !u.isBanned && <span style={{ color: "#F59E0B" }}>⏸️ INACTIVE</span>}
                                        {u.isActive && !u.isBanned && <span style={{ color: "#10B981" }}>✅ ACTIVE</span>}
                                    </td>
                                    <td style={{ padding: "0.75rem" }}>{u._count?.receivedReports || 0}</td>
                                    <td style={{ padding: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                        {u.role !== "ADMIN" && (
                                            <>
                                                <button
                                                    className={u.isBanned ? "btn btn-success btn-sm" : "btn btn-danger btn-sm"}
                                                    onClick={() => handleBan(u.id)}
                                                >
                                                    {u.isBanned ? "Unban" : "Ban"}
                                                </button>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleDisable(u.id)}
                                                >
                                                    {u.isActive ? "Disable" : "Enable"}
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(u.id)}
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                        {u.role === "ADMIN" && <span className="text-muted">Admin User</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {users.length === 0 && (
                    <div style={{ textAlign: "center", padding: "2rem", color: "#6B7280" }}>
                        No users found
                    </div>
                )}
            </section>
        </main>
    );
}

export default AdminUsers;
