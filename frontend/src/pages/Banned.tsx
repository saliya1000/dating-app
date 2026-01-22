import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMe } from "../utils/api";

const Banned = () => {
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        // Verify user is actually banned
        fetchMe(token).then((user) => {
            if (!user || (!user.isBanned && user.isActive)) {
                navigate("/");
            }
        });
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return;

        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("http://localhost:3000/api/inquiries", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message }),
            });

            if (!res.ok) {
                throw new Error("Failed to submit inquiry");
            }

            setSuccess(true);
            setMessage("");
        } catch (err) {
            console.error(err);
            setError("Failed to submit inquiry. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    return (
        <div className="page-surface" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="card" style={{ maxWidth: "500px", width: "100%", textAlign: "center" }}>
                <h1 style={{ color: "#e74c3c", marginBottom: "1rem" }}>Account Suspended</h1>
                <p style={{ marginBottom: "1.5rem", color: "#666" }}>
                    Your account has been suspended due to a violation of our terms of service.
                    You cannot access the platform at this time.
                </p>

                {success ? (
                    <div className="form-feedback form-feedback--success" style={{ marginBottom: "1.5rem" }}>
                        Your inquiry has been submitted successfully. An admin will review it shortly.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
                        <div className="form-group">
                            <label htmlFor="inquiry">Submit an Inquiry / Appeal</label>
                            <textarea
                                id="inquiry"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={5}
                                placeholder="Explain why you think this is a mistake..."
                                required
                                style={{ width: "100%", padding: "0.5rem", marginTop: "0.5rem" }}
                            />
                        </div>
                        {error && <p className="form-feedback form-feedback--error">{error}</p>}
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: "100%", marginTop: "1rem" }}
                            disabled={submitting}
                        >
                            {submitting ? "Submitting..." : "Submit Inquiry"}
                        </button>
                    </form>
                )}

                <button
                    onClick={handleLogout}
                    className="btn btn-ghost"
                    style={{ marginTop: "1rem" }}
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Banned;
