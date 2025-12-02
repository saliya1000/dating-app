import { useState } from "react";
import { loginUser } from "../utils/api";
import { API_URL } from "../config";
import { Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const data = await loginUser(email, password);
    if (data.token) {
      localStorage.setItem("token", data.token);

      // Fetch user details to check ban status immediately
      try {
        const res = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        const user = await res.json();

        if (user.isBanned) {
          window.location.href = "/banned";
        } else if (user.role === "ADMIN") {
          window.location.href = "/";
        } else {
          window.location.href = "/profile";
        }
      } catch (err) {
        // Fallback if fetch fails
        window.location.href = "/profile";
      }
    } else {
      setError(data.error || "Login failed");
    }
  };

  return (
    <section className="auth-page">
      <div className="card auth-card">
        <h2 className="page-heading">Welcome back</h2>
        <p className="text-muted">Sign in to continue matching with new connections.</p>
        <form onSubmit={handleLogin}>
          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingRight: "2.5rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "0.5rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  padding: "0",
                  color: "#666"
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full">Login</button>
        </form>
        {error && <p className="form-feedback form-feedback--error">{error}</p>}
        <p className="text-muted" style={{ marginTop: "1rem" }}>
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </section>
  );
};

export default Login;
