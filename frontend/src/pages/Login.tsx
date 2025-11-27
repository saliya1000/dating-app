import { useState } from "react";
import { loginUser } from "../utils/api";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const data = await loginUser(email, password);
    if (data.token) {
      localStorage.setItem("token", data.token);
      window.location.href = "/profile";
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
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
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
