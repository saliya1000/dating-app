import "./Home.css";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="logo">MatchMe ❤️</div>
        <div className="nav-links">
          <Link to="/login">Login</Link>
          <Link to="/register" className="signup-btn">Get Started</Link>
        </div>
      </nav>

      <section className="hero">
        <h1>Find Your Perfect Connection</h1>
        <p>
          Whether you want new friends, professional contacts, music buddies,
          gaming teammates, or love — MatchMe connects people who truly match.
        </p>

        <div className="hero-buttons">
          <Link to="/register" className="primary-btn">Join Now</Link>
          <Link to="/login" className="secondary-btn">Already a member?</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
