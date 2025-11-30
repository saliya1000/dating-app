import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMe, fetchAdminUsers, toggleUserBan, toggleUserActive, deleteUser } from "../utils/api";
import { CITIES } from "../utils/cities";

function AdminUsers() {
    // const [user, setUser] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
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

    const getLocationDisplay = (lat?: number, lon?: number) => {
        if (!lat || !lon) return "Unknown";

        const city = CITIES.find(c =>
            c.lat && c.lon &&
            Math.abs(lat - c.lat) < 0.1 &&
            Math.abs(lon - c.lon) < 0.1
        );

        if (city) return city.name;
        return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
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
                                <th style={{ padding: "0.75rem" }}>Location</th>
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
                                    <td style={{ padding: "0.75rem" }}>
                                        {u.latitude && u.longitude ? (
                                            <span title={`${u.latitude}, ${u.longitude}`}>📍 {getLocationDisplay(u.latitude, u.longitude)}</span>
                                        ) : (
                                            <span className="text-muted">Unknown</span>
                                        )}
                                    </td>
                                    <td style={{ padding: "0.75rem" }}>{u._count?.receivedReports || 0}</td>
                                    <td style={{ padding: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                        {u.role !== "ADMIN" && (
                                            <>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => setSelectedUser(u)}
                                                >
                                                    View
                                                </button>
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

            {selectedUser && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
                }}>
                    <div className="card" style={{ width: "90%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
                        <button
                            onClick={() => setSelectedUser(null)}
                            style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}
                        >
                            &times;
                        </button>
                        <h2 className="section-heading">User Details</h2>

                        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "center" }}>
                            <img
                                src={selectedUser.profilePic || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
                                alt="Avatar"
                                style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
                            />
                            <div>
                                <h3>{selectedUser.username}</h3>
                                <p className="text-muted">{selectedUser.email}</p>
                                <p className="small">ID: {selectedUser.id} | Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="info-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem", display: "grid" }}>
                            <div>
                                <strong>Status:</strong><br />
                                {selectedUser.isBanned ? "🚫 Banned" : selectedUser.isActive ? "✅ Active" : "⏸️ Inactive"}
                            </div>
                            <div>
                                <strong>Role:</strong><br />
                                {selectedUser.role}
                            </div>
                            <div>
                                <strong>Location:</strong><br />
                                {selectedUser.latitude && selectedUser.longitude ? (
                                    <a
                                        href={`https://www.google.com/maps?q=${selectedUser.latitude},${selectedUser.longitude}`}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {getLocationDisplay(selectedUser.latitude, selectedUser.longitude)} ↗️
                                    </a>
                                ) : "Not set"}
                            </div>
                            <div>
                                <strong>Last Seen:</strong><br />
                                {selectedUser.lastSeen ? new Date(selectedUser.lastSeen).toLocaleString() : "Never"}
                            </div>
                        </div>

                        <hr style={{ margin: "1rem 0", border: "0", borderTop: "1px solid #eee" }} />

                        <h4>Bio</h4>
                        <p>{selectedUser.bio || "No bio provided."}</p>

                        {selectedUser.userBio && (
                            <>
                                <h4>Interests & Hobbies</h4>
                                <div className="tag-cloud">
                                    {[
                                        selectedUser.userBio.interest1,
                                        selectedUser.userBio.interest2,
                                        selectedUser.userBio.interest3,
                                        selectedUser.userBio.music,
                                        selectedUser.userBio.hobby
                                    ].filter(Boolean).map((tag: string, i: number) => (
                                        <span key={i} className="tag">{tag}</span>
                                    ))}
                                </div>

                                <h4 style={{ marginTop: "1rem" }}>Preferences</h4>
                                <p className="small">
                                    <strong>Max Distance:</strong> {selectedUser.userBio.maxDistance} km<br />
                                    <strong>Looking for:</strong> {[
                                        selectedUser.userBio.prefInterest,
                                        selectedUser.userBio.prefMusic,
                                        selectedUser.userBio.prefHobby
                                    ].filter(Boolean).join(", ") || "Any"}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}

export default AdminUsers;
