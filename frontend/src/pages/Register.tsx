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
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full">Sign up</button>
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
