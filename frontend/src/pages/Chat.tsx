import { useEffect, useState, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// @ts-ignore: If not installed, run: npm install socket.io-client
import { io, Socket } from "socket.io-client";
import { fetchMe, fetchConnections, fetchChatHistory, markMessagesRead } from "../utils/api";
import { DEFAULT_PROFILE_PIC_URL } from "../utils/constants";
import { formatRelativeTime } from "../utils/timeFormat";
import { NotifContext } from "../App";
import { OnlineIndicator } from "../components/OnlineIndicator";

interface ChatUser {
  id: number; // This is the connection ID
  userId: number; // This is the other user's ID
  name: string;
  profilePic: string | null;
  lastMessageAt?: string;
  unreadCount: number;
  lastSeen?: string | null;
}

interface ChatMessage {
  id: number;
  senderId: number;
  recipientId: number;
  content: string;
  createdAt: string;
  connectionId: number;
}

const SOCKET_URL = "http://localhost:3000";

const Chat = () => {
  const { onlineUsers } = useContext(NotifContext);
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [connections, setConnections] = useState<ChatUser[]>([]);
  const [typing, setTyping] = useState<{ [k: number]: boolean }>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const openConnectionId = parseInt(new URLSearchParams(location.search).get("with") || "", 10) || null;

  const [hasMore, setHasMore] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);

  // Load user and connections
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetchMe(token).then((me) => {
      if (me.error) return;
      setUser(me);
      fetchConnections(token).then((conns: any[]) => {
        if (Array.isArray(conns)) {
          const cs: ChatUser[] = conns.map((c: any) => {
            const counterpart = c.requesterId === me.id ? c.recipient : c.requester;
            const lastMsg = c.messages?.[0];
            return {
              id: c.id, // Connection ID
              userId: counterpart.id, // User ID
              name: counterpart.username || "Match",
              profilePic: counterpart.profilePic || null,
              lastMessageAt: lastMsg?.createdAt || c.createdAt,
              unreadCount: c._count?.messages || 0,
              lastSeen: counterpart.lastSeen,
            };
          });
          // Sort by last message
          cs.sort((a, b) => {
            const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return dateB - dateA;
          });
          setConnections(cs);
        }
      });
    });
  }, []);

  // Socket.IO connection
  useEffect(() => {
    if (!user) return;
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.emit("join", user.id);

    // Note: Online status is handled globally by App.tsx via NotifContext

    socket.on("chat message", (msg: ChatMessage) => {
      // If this message belongs to the open chat
      if (msg.connectionId === openConnectionId) {
        setChatMessages((msgs) => [...msgs, msg]);
        if (msg.senderId !== user.id) {
          const token = localStorage.getItem("token");
          if (token) markMessagesRead(token, msg.connectionId);
        }
      }

      // Update connections list (reorder and update unread count)
      setConnections((prev) => {
        const connIndex = prev.findIndex((c) => c.id === msg.connectionId);
        if (connIndex === -1) return prev;

        const conn = prev[connIndex];
        const updatedConn = {
          ...conn,
          lastMessageAt: msg.createdAt,
          unreadCount:
            msg.connectionId === openConnectionId || msg.senderId === user.id
              ? 0
              : conn.unreadCount + 1,
        };

        const newConns = [...prev];
        newConns.splice(connIndex, 1);
        newConns.unshift(updatedConn);
        return newConns;
      });
    });

    socket.on("typing", ({ userId }) => {
      // userId is the sender's user ID
      setTyping((typing) => ({ ...typing, [userId]: true }));
      setTimeout(() => {
        setTyping((typing) => ({ ...typing, [userId]: false }));
      }, 2000);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, openConnectionId]);

  // Open chat: load messages
  useEffect(() => {
    if (!openConnectionId || !user) return;
    setLoadingMessages(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    // Reset pagination when switching chats
    setChatMessages([]);

    fetchChatHistory(token, openConnectionId).then((data) => {
      if (data && Array.isArray(data)) {
        // Reverse to show oldest first (since API returns newest first)
        setChatMessages(data.reverse());
        setHasMore(data.length === 20);
        setLoadingMessages(false);
        // Mark as read
        markMessagesRead(token, openConnectionId);
        // Update local unread count
        setConnections((prev) =>
          prev.map((c) => (c.id === openConnectionId ? { ...c, unreadCount: 0 } : c))
        );
      }
    });

    // scroll to bottom
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
  }, [openConnectionId, user]);

  // Pagination
  const loadMoreMessages = () => {
    if (!openConnectionId || !hasMore) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const oldestMessageId = chatMessages[0]?.id;
    if (!oldestMessageId) return;

    fetchChatHistory(token, openConnectionId, oldestMessageId).then((data) => {
      if (data && Array.isArray(data)) {
        if (data.length < 20) setHasMore(false);
        setChatMessages((prev) => [...data.reverse(), ...prev]);
      }
    });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [chatMessages]);

  // Send message
  const sendMessage = () => {
    if (!openConnectionId || !message.trim() || !socketRef.current || !user) return;

    const connection = connections.find((c) => c.id === openConnectionId);
    if (!connection) return;

    const msg = {
      connectionId: connection.id,
      senderId: user.id,
      recipientId: connection.userId,
      content: message,
    };

    socketRef.current.emit("chat message", msg);
    setMessage("");
  };

  const handleTyping = () => {
    if (!openConnectionId || !socketRef.current || !user) return;
    const connection = connections.find((c) => c.id === openConnectionId);
    if (!connection) return;

    socketRef.current.emit("typing", {
      senderId: user.id,
      recipientId: connection.userId,
    });
  };

  // Mobile view logic
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(!openConnectionId);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setShowSidebar(!openConnectionId);
    } else {
      setShowSidebar(true);
    }
  }, [openConnectionId, isMobile, location.search]);

  if (!user) return <div className="page-surface"><div className="card">Loading chat…</div></div>;

  const openChatConnection = connections.find((c) => c.id === openConnectionId);

  return (
    <main className="page-surface chat-layout">
      {(!isMobile || showSidebar) && (
        <aside className="chat-sidebar" style={isMobile ? { width: '100%', borderRight: 'none' } : {}}>
          <h2 className="section-heading">Conversations</h2>
          <div className="conversation-list">
            {connections.map((c) => {
              const isOnline = onlineUsers.includes(c.userId);
              return (
                <div
                  key={c.id}
                  className={`conversation-item ${c.id === openConnectionId ? "active" : ""}`}
                  onClick={() => navigate(`/chat?with=${c.id}`)}
                >
                  <div className="avatar-container">
                    <img src={c.profilePic || DEFAULT_PROFILE_PIC_URL} alt="Profile" className="avatar" />
                    {isOnline && <div className="online-dot-badge"></div>}
                  </div>
                  <div className="conversation-details">
                    <div className="conversation-header">
                      <strong>{c.name}</strong>
                      {isOnline ? (
                        <span className="status-text online">Online</span>
                      ) : (
                        <span className="status-text">{c.lastSeen ? new Date(c.lastSeen).toLocaleDateString() : ""}</span>
                      )}
                    </div>
                    {typing[c.userId] ? (
                      <p className="typing-indicator">💬 typing…</p>
                    ) : (
                      <p className="last-message-time">
                        {c.lastMessageAt ? formatRelativeTime(c.lastMessageAt) : "New Match"}
                      </p>
                    )}
                  </div>
                  {c.unreadCount > 0 && <div className="unread-indicator">{c.unreadCount}</div>}
                </div>
              );
            })}
          </div>
        </aside>
      )}

      {(!isMobile || !showSidebar) && (
        <section className="chat-main" style={isMobile ? { display: 'flex' } : {}}>
          {openConnectionId && openChatConnection ? (
            <>
              <header className="chat-header">
                {isMobile && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate("/chat")}
                    style={{ marginRight: '0.5rem', padding: '0.4rem 0.8rem' }}
                  >
                    ←
                  </button>
                )}
                <div className="chat-header-info">
                  <h3>Chat with {openChatConnection.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {typing[openChatConnection.userId] ? (
                      <span className="typing-indicator" style={{ fontSize: '0.85rem', color: '#666' }}>💬 typing...</span>
                    ) : (
                      <OnlineIndicator
                        isOnline={onlineUsers.includes(openChatConnection.userId)}
                        lastSeen={openChatConnection.lastSeen}
                      />
                    )}
                  </div>
                </div>
              </header>
              <div className="chat-messages">
                {hasMore && (
                  <button className="btn btn-secondary load-more-btn" onClick={loadMoreMessages}>
                    Load older messages
                  </button>
                )}
                {loadingMessages && <div className="chat-loading">Loading messages…</div>}
                {chatMessages.map((m) => (
                  <div key={m.id} className={`chat-message ${user.id === m.senderId ? "sent" : "received"}`}>
                    <div className="chat-bubble">
                      <p className="chat-content">{m.content}</p>
                      <span className="chat-timestamp">{formatRelativeTime(m.createdAt)}</span>
                    </div>
                  </div>
                ))}
                <div ref={msgEndRef}></div>
              </div>
              <div className="chat-input-area">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                  placeholder="Type a message…"
                  className="chat-input"
                />
                <button className="btn btn-primary" onClick={sendMessage}>
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>Select a conversation</h3>
              <p>Choose a connection from the list to start chatting.</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
};

export default Chat;
