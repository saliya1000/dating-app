import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState, createContext, useContext } from "react";
import type { ReactElement } from "react";
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
    // Fetch profile (stubbed)
    fetch("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.json())
      .then(data => {
        if (!(data.fullName && data.about && data.interests && data.favoriteMusic && data.location)) {
          navigate("/profile");
        } else {
          setIsAllowed(true);
        }
        setAuthChecked(true);
      })
      .catch(()=>{navigate("/login"); setAuthChecked(true);});
  },[]);
  if (!authChecked) return <div>Loading...</div>;
  return isAllowed ? element : null;
}

function AppNav({ isAuthenticated, onLogout }:{ isAuthenticated:boolean, onLogout:()=>void }) {
  const notif = useContext(NotifContext);
  return (
    <nav style={{display:'flex',gap:12,padding:12,background:'#f7f7f7',alignItems:'center',justifyContent:'center'}}>
      <NavLink to="/" className={({isActive})=>isActive?'nav-active':undefined}>Home</NavLink>
      {isAuthenticated && <>
        <NavLink to="/profile" className={({isActive})=>isActive?'nav-active':undefined}>Profile</NavLink>
        <NavLink to="/recommendations" className={({isActive})=>isActive?'nav-active':undefined}>Recommendations</NavLink>
        <NavLink to="/connections" className={({isActive})=>isActive?'nav-active':undefined}>
          Connections{notif.incomingRequests>0 &&
            <span style={{background:'#fc4',color:'#222',borderRadius:8,fontSize:12,marginLeft:4,padding:'0 6px'}}>+{notif.incomingRequests}</span>}
        </NavLink>
        <NavLink to="/chat" className={({isActive})=>isActive?'nav-active':undefined}>
          Chat{notif.unreadChats>0 && <span style={{background:'#fc4',color:'#222',borderRadius:8,fontSize:12,marginLeft:4,padding:'0 6px'}}>+{notif.unreadChats}</span>}
        </NavLink>
        <button onClick={onLogout} style={{ marginLeft:16, background:"#eee", border:"none", borderRadius:4, cursor:"pointer" }}>Logout</button>
      </>}
      {!isAuthenticated && <>
        <NavLink to="/login" className={({isActive})=>isActive?'nav-active':undefined}>Login</NavLink>
        <NavLink to="/register" className={({isActive})=>isActive?'nav-active':undefined}>Register</NavLink>
      </>}
    </nav>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  // For badge demo; should be loaded via API or WebSocket
  const [notif, setNotif] = useState({ unreadChats: 0, incomingRequests: 0 });
  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("token"));
    // Faked notification - demo logic, should be replaced with backend integration
    if (isAuthenticated) setNotif({ unreadChats: 2, incomingRequests: 1 });
    else setNotif({ unreadChats: 0, incomingRequests: 0 });
    const storageListener = () => setIsAuthenticated(!!localStorage.getItem("token"));
    window.addEventListener("storage", storageListener);
    return () => window.removeEventListener("storage", storageListener);
  }, [isAuthenticated]);
  const handleLogout = () => {
    localStorage.removeItem("token"); setIsAuthenticated(false); window.location.href = "/login";
  };

  return (
    <NotifContext.Provider value={notif}>
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
    </NotifContext.Provider>
  );
}

export default App;
