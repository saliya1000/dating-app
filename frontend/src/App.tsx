import { Routes, Route, NavLink, useNavigate, Navigate } from "react-router-dom";
import { useEffect, useState, useContext, useRef } from "react";
import type { ReactElement } from "react";
import { io } from "socket.io-client";
import { API_URL, SOCKET_URL } from "./config";
import { fetchMe, fetchNotifications } from "./utils/api";
import { DEFAULT_PROFILE_PIC_URL } from "./utils/constants";
import { calculateProfileCompletion } from "./utils/profileCompletion";
import { isTokenExpired } from "./utils/auth";
import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import Recommendations from "./pages/Recommendations";
import Connections from "./pages/Connections";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminReports from "./pages/AdminReports";
import AdminInquiries from "./pages/AdminInquiries";
import Banned from "./pages/Banned";

import { NotifContext } from "./context/NotifContext";

function AuthenticatedRoute({ element, requireProfile = false }: { element: ReactElement, requireProfile?: boolean }) {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    // Check profile completion if required
    if (!requireProfile) { setIsAllowed(true); setAuthChecked(true); return; }

    // Fetch user and bio to check 100% completion
    Promise.all([
      fetchMe(token),
      fetch(`${API_URL}/users/me/bio`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.json())
    ])
      .then(([userData, bioData]) => {
        if (!userData) {
          navigate("/login");
          return;
        }

        // Calculate profile completion
        const completion = calculateProfileCompletion(userData, bioData);

        if (!completion.isComplete) {
          // Redirect to profile with a message
          navigate("/profile");
        } else {
          setIsAllowed(true);
        }
      })
      .catch(() => navigate("/login"))
      .finally(() => setAuthChecked(true));
  }, [navigate, requireProfile]);
  if (!authChecked) return <div>Loading...</div>;
  return isAllowed ? element : null;
}

function NotificationDropdown({ notifications, onClose, onNotificationClick }: { notifications: any[], onClose: () => void, onNotificationClick: (n: any) => void }) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <div className="notification-header">Notifications</div>
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="notification-empty">No new notifications</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className="notification-item"
              onClick={() => {
                navigate(n.link);
                onNotificationClick(n);
                onClose();
              }}
            >
              <img src={n.image || DEFAULT_PROFILE_PIC_URL} alt="" className="notification-avatar" />
              <div className="notification-content">
                <div className="notification-title">{n.title}</div>
                <div className="notification-message">{n.message}</div>
                <div className="notification-time">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AppNav({ isAuthenticated, onLogout, notifications, onNotificationClick, userRole }: { isAuthenticated: boolean, onLogout: () => void, notifications: any[], onNotificationClick: (n: any) => void, userRole?: string }) {
  const notif = useContext(NotifContext);
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="global-nav">
      <div className="global-nav__inner">
        <NavLink to="/" className="brand-link">MatchMe</NavLink>
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
            {isAuthenticated ? "Dashboard" : "Home"}
          </NavLink>
          {isAuthenticated && userRole !== "ADMIN" && (
            <>
              <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>Profile</NavLink>
              <NavLink to="/recommendations" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>Recommendations</NavLink>
              <NavLink to="/connections" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
                Connections
                {notif.incomingRequests > 0 && <span className="badge">+{notif.incomingRequests}</span>}
              </NavLink>
              <NavLink to="/chat" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
                Chat {notif.unreadChats > 0 && <span className="badge">{notif.unreadChats}</span>}
              </NavLink>
            </>
          )}
          {!isAuthenticated && (
            <>
              <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>Login</NavLink>
              <NavLink to="/register" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>Register</NavLink>
            </>
          )}
        </div>
        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <div className="nav-item-container">
                <button className="nav-icon-btn" onClick={() => setShowDropdown(!showDropdown)}>
                  🔔
                  {(notif.unreadChats + notif.incomingRequests) > 0 && (
                    <span className="nav-icon-badge">{notif.unreadChats + notif.incomingRequests}</span>
                  )}
                </button>
                {showDropdown && (
                  <NotificationDropdown
                    notifications={notifications}
                    onClose={() => setShowDropdown(false)}
                    onNotificationClick={onNotificationClick}
                  />
                )}
              </div>
              <button className="nav-button nav-button--ghost" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <NavLink to="/login" className="nav-button nav-button--primary">Login</NavLink>
          )}
        </div>
      </div>
    </header>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const [user, setUser] = useState<any>(null);
  const [notif, setNotif] = useState({ unreadChats: 0, incomingRequests: 0 });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);

  useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem("token");
      if (token && isTokenExpired(token)) {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(!!token);
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);

    const handleLogoutEvent = () => {
      localStorage.removeItem("token");
      setIsAuthenticated(false);
      window.location.href = "/login";
    };
    window.addEventListener("auth:logout", handleLogoutEvent);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth:logout", handleLogoutEvent);
    };
  }, []);

  const updateBadges = (currentNotifications: any[]) => {
    let requests = 0;
    const chats = new Set();
    currentNotifications.forEach((n: any) => {
      if (n.type === "connection_request") requests++;
      if (n.type === "message") chats.add(n.link); // Count unique chat links
    });
    setNotif({ unreadChats: chats.size, incomingRequests: requests });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setNotif({ unreadChats: 0, incomingRequests: 0 });
      setNotifications([]);
      setOnlineUsers([]);
      return;
    }

    // Fetch initial notifications
    fetchNotifications(token).then((data) => {
      if (Array.isArray(data)) {
        setNotifications(data);
        updateBadges(data);
      }
    });

    // Connect to Socket.IO for real-time notifications
    fetchMe(token).then((userData) => {
      if (userData && !userData.error) {
        setUser(userData);
        const socket = io(SOCKET_URL);
        socket.emit("join", userData.id);

        socket.on("new notification", (notification) => {
          setNotifications((prev) => {
            const newNotifications = [notification, ...prev];
            updateBadges(newNotifications);
            return newNotifications;
          });
        });

        // Online status listeners
        socket.on("online users", (users: number[]) => {
          setOnlineUsers(users);
        });

        socket.on("user online", (userId: number) => {
          setOnlineUsers(prev => {
            if (!prev.includes(userId)) return [...prev, userId];
            return prev;
          });
        });

        socket.on("user offline", (userId: number) => {
          setOnlineUsers(prev => prev.filter(id => id !== userId));
        });

        return () => {
          socket.disconnect();
        };
      }
    });

    // Fallback polling every 30 seconds for connection requests and sync
    const interval = setInterval(() => {
      fetchNotifications(token).then((data) => {
        if (Array.isArray(data)) {
          setNotifications(data);
          updateBadges(data);
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem("token"); setIsAuthenticated(false); window.location.href = "/login";
  };

  const handleNotificationClick = (notification: any) => {
    setNotifications((prev) => {
      let newNotifications;
      if (notification.type === "message") {
        // Remove all notifications for this chat link
        newNotifications = prev.filter((n) => n.link !== notification.link);
      } else {
        // Remove just this notification
        newNotifications = prev.filter((n) => n.id !== notification.id);
      }
      updateBadges(newNotifications);
      return newNotifications;
    });
  };

  return (
    <NotifContext.Provider value={{ ...notif, onlineUsers, currentUser: user }}>
      <div className="app-shell">
        <AppNav
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          userRole={user?.role}
        />
        <Routes>
          <Route path="/" element={isAuthenticated ? (user?.isBanned ? <Navigate to="/banned" /> : (user?.role === "ADMIN" ? <AdminDashboard /> : <Dashboard />)) : <Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/banned" element={<Banned />} />
          <Route path="/profile" element={
            user?.isBanned ? <Navigate to="/banned" /> : (user?.role === "ADMIN" ? <Navigate to="/" /> : <AuthenticatedRoute element={<Profile />} requireProfile={false} />)
          } />
          <Route path="/users/:id" element={
            user?.role === "ADMIN" ? <Navigate to="/" /> : <AuthenticatedRoute element={<Profile />} requireProfile={false} />
          } />
          <Route path="/recommendations" element={
            user?.role === "ADMIN" ? <Navigate to="/" /> : <AuthenticatedRoute element={<Recommendations />} requireProfile={true} />
          } />
          <Route path="/connections" element={
            user?.role === "ADMIN" ? <Navigate to="/" /> : <AuthenticatedRoute element={<Connections />} requireProfile={true} />
          } />
          <Route path="/chat" element={
            user?.role === "ADMIN" ? <Navigate to="/" /> : <AuthenticatedRoute element={<Chat />} requireProfile={true} />
          } />
          <Route path="/admin" element={
            <AuthenticatedRoute element={<AdminDashboard />} requireProfile={false} />
          } />
          <Route path="/admin/users" element={
            <AuthenticatedRoute element={<AdminUsers />} requireProfile={false} />
          } />
          <Route path="/admin/reports" element={
            <AuthenticatedRoute element={<AdminReports />} requireProfile={false} />
          } />
          <Route path="/admin/inquiries" element={
            <AuthenticatedRoute element={<AdminInquiries />} requireProfile={false} />
          } />
        </Routes>
      </div>
    </NotifContext.Provider>
  );
}

export default App;
