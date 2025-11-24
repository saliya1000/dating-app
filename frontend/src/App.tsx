import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState, createContext, useContext } from "react";
import type { ReactElement } from "react";
import { fetchMe } from "./utils/api";
import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import Recommendations from "./pages/Recommendations";
import Connections from "./pages/Connections";
import Chat from "./pages/Chat";
// Minimal notification state/context
const NotifContext = createContext<{ unreadChats:number, incomingRequests:number }>({ unreadChats: 0, incomingRequests: 0 });

function AuthenticatedRoute({ element, requireProfile=false }:{element: ReactElement, requireProfile?: boolean}) {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);
  useEffect(()=>{
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    // Check profile completion if required
    if (!requireProfile) { setIsAllowed(true); setAuthChecked(true); return; }
    fetchMe(token)
      .then(data => {
        if (!data || !data.bio) {
          navigate("/profile");
        } else {
          setIsAllowed(true);
        }
      })
      .catch(()=>navigate("/login"))
      .finally(()=>setAuthChecked(true));
  },[navigate, requireProfile]);
  if (!authChecked) return <div>Loading...</div>;
  return isAllowed ? element : null;
}

function AppNav({ isAuthenticated, onLogout }:{ isAuthenticated:boolean, onLogout:()=>void }) {
  const notif = useContext(NotifContext);
  return (
    <header className="global-nav">
      <div className="global-nav__inner">
        <NavLink to="/" className="brand-link">MatchMe</NavLink>
        <div className="nav-links">
          <NavLink to="/" className={({isActive})=>`nav-link ${isActive?'is-active':''}`}>Home</NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/profile" className={({isActive})=>`nav-link ${isActive?'is-active':''}`}>Profile</NavLink>
              <NavLink to="/recommendations" className={({isActive})=>`nav-link ${isActive?'is-active':''}`}>Recommendations</NavLink>
              <NavLink to="/connections" className={({isActive})=>`nav-link ${isActive?'is-active':''}`}>
                Connections
                {notif.incomingRequests>0 && <span className="badge">+{notif.incomingRequests}</span>}
              </NavLink>
              <NavLink to="/chat" className={({isActive})=>`nav-link ${isActive?'is-active':''}`}>
                Chat
                {notif.unreadChats>0 && <span className="badge">+{notif.unreadChats}</span>}
              </NavLink>
            </>
          )}
          {!isAuthenticated && (
            <>
              <NavLink to="/login" className={({isActive})=>`nav-link ${isActive?'is-active':''}`}>Login</NavLink>
              <NavLink to="/register" className={({isActive})=>`nav-link ${isActive?'is-active':''}`}>Register</NavLink>
            </>
          )}
        </div>
        <div className="nav-actions">
          {isAuthenticated ? (
            <button onClick={onLogout} className="nav-button nav-button--primary">Logout</button>
          ) : (
            <>
              <NavLink to="/login" className="nav-button nav-button--ghost" role="button">Log in</NavLink>
              <NavLink to="/register" className="nav-button nav-button--primary" role="button">Sign up</NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  // For badge demo; should be loaded via API or WebSocket
  const [notif, setNotif] = useState({ unreadChats: 0, incomingRequests: 0 });
  useEffect(() => {
    const syncAuth = () => setIsAuthenticated(!!localStorage.getItem("token"));
    syncAuth();
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setNotif({ unreadChats: 0, incomingRequests: 0 });
      return;
    }
    // Badges will be wired to live data later; keep defaults for now.
    setNotif({ unreadChats: 0, incomingRequests: 0 });
  }, [isAuthenticated]);
  const handleLogout = () => {
    localStorage.removeItem("token"); setIsAuthenticated(false); window.location.href = "/login";
  };

  return (
    <NotifContext.Provider value={notif}>
      <div className="app-shell">
        <AppNav isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={
            <AuthenticatedRoute element={<Profile />} requireProfile={false} />
          } />
          <Route path="/recommendations" element={
            <AuthenticatedRoute element={<Recommendations />} requireProfile={true} />
          } />
          <Route path="/connections" element={
            <AuthenticatedRoute element={<Connections />} requireProfile={true} />
          } />
          <Route path="/chat" element={
            <AuthenticatedRoute element={<Chat />} requireProfile={true} />
          } />
        </Routes>
      </div>
    </NotifContext.Provider>
  );
}

export default App;
