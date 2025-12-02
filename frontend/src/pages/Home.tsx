import "./Home.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchStats } from "../utils/api";

interface Stats {
  activeUsers: number;
  successfulMatches: number;
  avgResponseTime: number;
}

const Home = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then((data) => {
        if (data) {
          setStats(data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch stats:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <main className="page-surface">
      <section className="card hero-card home-hero">
        <p className="hero-eyebrow">Designed for meaningful matches</p>
        <h1>Find the people who share your rhythm</h1>
        <p>
          MatchMe pairs your interests, hobbies, and social energy with members of the community.
          Join to unlock curated recommendations, frictionless requests, and a clean space to chat.
        </p>
        <div className="home-hero__actions">
          <Link to="/register" className="btn btn-primary">Get started</Link>
          <Link to="/login" className="btn btn-ghost">I already have an account</Link>
        </div>
        <div className="home-highlight">
          <span>92%</span>
          of our users complete their profile and receive matches within the first day.
        </div>
      </section>

      <section className="stat-grid">
        <article className="stat-card">
          <div className="stat-label">Active members</div>
          <div className="stat-value">
            {loading ? "..." : stats ? `${formatNumber(stats.activeUsers)}+` : "10K+"}
          </div>
          <p className="text-muted">Across hobbies, cities, and vibes</p>
        </article>
        <article className="stat-card">
          <div className="stat-label">Successful matches</div>
          <div className="stat-value">
            {loading ? "..." : stats ? formatNumber(stats.successfulMatches) : "3.2K"}
          </div>
          <p className="text-muted">Total connections made</p>
        </article>
        <article className="stat-card">
          <div className="stat-label">Avg. response time</div>
          <div className="stat-value">
            {loading ? "..." : stats ? `${stats.avgResponseTime} hrs` : "4 hrs"}
          </div>
          <p className="text-muted">For pending requests</p>
        </article>
      </section>

      <section className="home-feature-grid">
        <article className="home-feature-card">
          <h3>Profile builder</h3>
          <p>Share your bio and top interests so the algorithm can learn who belongs in your orbit.</p>
        </article>
        <article className="home-feature-card">
          <h3>Smart recommendations</h3>
          <p>We score every potential match across shared activities, music taste, and hobbies.</p>
        </article>
        <article className="home-feature-card">
          <h3>Connection controls</h3>
          <p>Send, accept, or reject requests in one dashboard before jumping into a chat.</p>
        </article>
      </section>
    </main>
  );
};

export default Home;
