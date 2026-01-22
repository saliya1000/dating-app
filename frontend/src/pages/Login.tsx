import { useState } from "react";
import { loginUser } from "../utils/api";
import { Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const data = await loginUser(email, password);
      if (data.token) {
        localStorage.setItem("token", data.token);

        // Fetch user details to check ban status immediately
        try {
          const res = await fetch("http://localhost:3000/api/users/me", {
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
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      if (errorMessage.includes("database") || errorMessage.includes("Database")) {
        setError("Database connection error. Please ensure PostgreSQL is running.");
      } else if (errorMessage.includes("Network") || errorMessage.includes("fetch")) {
        setError("Unable to connect to server. Please check if the backend is running on port 3000.");
      } else {
        setError(errorMessage || "Login failed. Please try again.");
      }
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
            <div className="position-relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="input-with-icon"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
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
