import { useState } from "react";
import { registerUser } from "../utils/api";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const data = await registerUser(email, username, password);
      if (data?.token) {
        // auto login for smoother UX
        localStorage.setItem("token", data.token);
        setMessage("Registered successfully!");
        navigate("/profile");
      } else if (data?.id) {
        setMessage("Registered successfully! You can login now.");
        navigate("/login");
      } else {
        setError(data?.error || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      if (errorMessage.includes("database") || errorMessage.includes("Database")) {
        setError("Database connection error. Please ensure PostgreSQL is running.");
      } else if (errorMessage.includes("Network") || errorMessage.includes("fetch")) {
        setError("Unable to connect to server. Please check if the backend is running.");
      } else {
        setError(errorMessage || "Registration failed. Please try again.");
      }
    }
  };

  return (
    <section className="auth-page">
      <div className="card auth-card">
        <h2 className="page-heading">Create your account</h2>
        <p className="text-muted">Tell us who you are to start receiving matches.</p>
        <form onSubmit={handleRegister}>
          <div className="form-field">
            <label htmlFor="register-email">Email address</label>
            <input
              id="register-email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
              type="text"
              placeholder="matchmaker"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              minLength={3}
            />
          </div>
          <div className="form-field">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <div style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
              <p style={{ margin: "0 0 0.5rem", color: "var(--text-muted)" }}>Password strength:</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li style={{ color: password.length >= 8 ? "var(--success)" : "var(--text-muted)" }}>
                  {password.length >= 8 ? "✓" : "○"} At least 8 characters
                </li>
                <li style={{ color: /[A-Z]/.test(password) ? "var(--success)" : "var(--text-muted)" }}>
                  {/[A-Z]/.test(password) ? "✓" : "○"} Uppercase letter
                </li>
                <li style={{ color: /[a-z]/.test(password) ? "var(--success)" : "var(--text-muted)" }}>
                  {/[a-z]/.test(password) ? "✓" : "○"} Lowercase letter
                </li>
                <li style={{ color: /\d/.test(password) ? "var(--success)" : "var(--text-muted)" }}>
                  {/\d/.test(password) ? "✓" : "○"} Number
                </li>
                <li style={{ color: /[\W_]/.test(password) ? "var(--success)" : "var(--text-muted)" }}>
                  {/[\W_]/.test(password) ? "✓" : "○"} Special character
                </li>
              </ul>
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={!(password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[\W_]/.test(password))}
            style={{ opacity: (password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[\W_]/.test(password)) ? 1 : 0.6 }}
          >
            Sign up
          </button>
        </form>
        {error && <p className="form-feedback form-feedback--error">{error}</p>}
        {message && <p className="form-feedback form-feedback--success">{message}</p>}
        <p className="text-muted" style={{ marginTop: "1rem" }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </section>
  );
};

export default Register;
