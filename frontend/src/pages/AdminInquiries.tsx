import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toggleUserBan } from "../utils/api";
import { API_URL } from "../config";


const AdminInquiries = () => {
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        fetch(`${API_URL}/inquiries`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch inquiries");
                return res.json();
            })
            .then(data => {
                setInquiries(data.filter((inq: any) => inq.status === "PENDING"));
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [navigate]);

    const handleUnban = async (userId: number) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        // if (!confirm("Are you sure you want to unban this user?")) return;

        try {
            await toggleUserBan(token, userId);
            // Update local state to reflect unban (optional: remove inquiry or update status)
            // alert("User unbanned successfully.");
            // Refresh inquiries or update list
            setInquiries(prev => prev.filter(inq => inq.userId !== userId));
        } catch (err) {
            console.error(err);
            alert("Failed to unban user.");
        }
    };

    if (loading) return <div className="page-surface"><div className="card">Loading inquiries...</div></div>;

    return (
        <main className="page-surface">
            <h1 className="section-heading">Banned User Inquiries</h1>
            <div className="card">
                {inquiries.length === 0 ? (
                    <p>No inquiries found.</p>
                ) : (
                    <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                                <th style={{ padding: "0.75rem" }}>User</th>
                                <th style={{ padding: "0.75rem" }}>Message</th>
                                <th style={{ padding: "0.75rem" }}>Date</th>
                                <th style={{ padding: "0.75rem" }}>Status</th>
                                <th style={{ padding: "0.75rem" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inquiries.map((inquiry) => (
                                <tr key={inquiry.id} style={{ borderBottom: "1px solid #eee" }}>
                                    <td style={{ padding: "0.75rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <strong>{inquiry.user.username}</strong>
                                            <span className="text-muted" style={{ fontSize: "0.85rem" }}>({inquiry.user.email})</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "0.75rem" }}>{inquiry.message}</td>
                                    <td style={{ padding: "0.75rem" }}>{new Date(inquiry.createdAt).toLocaleString()}</td>
                                    <td style={{ padding: "0.75rem" }}>
                                        <span className={`status-badge status-${inquiry.status.toLowerCase()}`}>
                                            {inquiry.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: "0.75rem" }}>
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleUnban(inquiry.user.id)}
                                        >
                                            Unban
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </main>
    );
};

export default AdminInquiries;
