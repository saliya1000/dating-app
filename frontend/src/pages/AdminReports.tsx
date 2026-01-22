import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMe, fetchAdminReports, updateReport } from "../utils/api";

function AdminReports() {
    // const [user, setUser] = useState<any>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState("PENDING");
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
            loadReports(token);
        });
    }, [navigate, statusFilter]);

    const loadReports = async (token?: string) => {
        const t = token || localStorage.getItem("token");
        if (!t) return;

        const data = await fetchAdminReports(t, { status: statusFilter });
        if (!data.error) {
            setReports(data.reports);
        }
        setLoading(false);
    };

    const handleAction = async (reportId: number, action: string) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const status = action === "ignore" ? "DISMISSED" : "RESOLVED";
        await updateReport(token, reportId, { status, action });
        loadReports();
    };

    if (loading) return <div className="page-surface"><div className="card">Loading...</div></div>;

    return (
        <main className="page-surface">
            <section className="card">
                <h1 className="section-heading">🚩 Reports Management</h1>

                <div style={{ marginBottom: "1.5rem" }}>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="PENDING">Pending</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="DISMISSED">Dismissed</option>
                        <option value="ALL">All</option>
                    </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {reports.map((report) => (
                        <div key={report.id} className="card" style={{ padding: "1.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                                <div>
                                    <h3 style={{ margin: 0, marginBottom: "0.5rem" }}>
                                        Report #{report.id} - {report.reason}
                                    </h3>
                                    <p className="text-muted" style={{ margin: 0 }}>
                                        Reported by: <strong>{report.reporter.username}</strong> ({report.reporter.email})
                                    </p>
                                    <p className="text-muted" style={{ margin: 0 }}>
                                        Reported user: <strong>{report.reported.username}</strong> ({report.reported.email})
                                        {report.reported.isBanned && <span style={{ color: "#EF4444", marginLeft: "0.5rem" }}>🚫 BANNED</span>}
                                    </p>
                                    <p className="text-muted" style={{ margin: 0, marginTop: "0.5rem" }}>
                                        {new Date(report.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <span
                                    style={{
                                        padding: "0.25rem 0.75rem",
                                        borderRadius: "0.25rem",
                                        fontSize: "0.875rem",
                                        fontWeight: "bold",
                                        backgroundColor: report.status === "PENDING" ? "#FEF3C7" : report.status === "RESOLVED" ? "#D1FAE5" : "#E5E7EB",
                                        color: report.status === "PENDING" ? "#92400E" : report.status === "RESOLVED" ? "#065F46" : "#1F2937",
                                    }}
                                >
                                    {report.status}
                                </span>
                            </div>

                            {report.details && (
                                <div style={{ padding: "1rem", backgroundColor: "#F9FAFB", borderRadius: "0.5rem", marginBottom: "1rem" }}>
                                    <strong>Details:</strong>
                                    <p style={{ margin: "0.5rem 0 0 0" }}>{report.details}</p>
                                </div>
                            )}

                            {report.status === "PENDING" && (
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleAction(report.id, "ban")}
                                    >
                                        Ban User
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => handleAction(report.id, "warn")}
                                    >
                                        Warn & Resolve
                                    </button>
                                    <button
                                        className="btn btn-tertiary btn-sm"
                                        onClick={() => handleAction(report.id, "ignore")}
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {reports.length === 0 && (
                    <div style={{ textAlign: "center", padding: "2rem", color: "#6B7280" }}>
                        No reports found
                    </div>
                )}
            </section>
        </main>
    );
}

export default AdminReports;
