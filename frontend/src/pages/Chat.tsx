import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// @ts-ignore: If not installed, run: npm install socket.io-client
import { io, Socket } from "socket.io-client";
import { fetchMe, fetchConnections, fetchChatHistory } from "../utils/api";
import { DEFAULT_PROFILE_PIC_URL } from "../utils/constants";

interface ChatUser { id: number; name: string; profilePic: string | null; online?: boolean; }
interface ChatMessage {
  id: number;
  from: number;
  to: number;
  content: string;
  createdAt: string;
}

const SOCKET_URL = "http://localhost:3000";

const Chat = () => {
  const [user, setUser] = useState<ChatUser|null>(null);
  const [connections, setConnections] = useState<ChatUser[]>([]);
  const [unread, setUnread] = useState<{[k:number]:boolean}>({});
  const [typing, setTyping] = useState<{[k:number]:boolean}>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const openChatId = parseInt(new URLSearchParams(location.search).get("with") || "", 10) || null;
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const socketRef = useRef<Socket|null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);

  // Load user and connections
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // Should be handled by AuthenticatedRoute
    fetchMe(token).then(me => {
      if (me.error) return; // Should be handled by AuthenticatedRoute
      setUser(me);
      fetchConnections(token).then((conns:any[]) => {
        if (Array.isArray(conns)) {
          const cs: ChatUser[] = conns
            .filter((c:any) => c.status === "accepted")
            .map((c:any) => {
              const counterpart = c.requesterId === me.id ? c.recipient : c.requester;
              return {
                id: counterpart.id,
                name: counterpart.username || "Match",
                profilePic: counterpart.profilePic || null
              };
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

    socket.on("user online", (userId) => {
      setConnections(prev =>
        prev.map(c => (c.id === userId ? { ...c, online: true } : c))
      );
    });

    socket.on("user offline", (userId) => {
      setConnections(prev =>
        prev.map(c => (c.id === userId ? { ...c, online: false } : c))
      );
    });

    socket.on("chat message", (msg: ChatMessage) => {
      if (msg.senderId === openChatId) {
        setChatMessages((msgs) => [...msgs, msg]);
      } else {
        setUnread((unread) => ({ ...unread, [msg.senderId]: true }));
      }
    });

    socket.on("typing", ({ userId }) => {
      if (userId === openChatId) {
        setTyping(typing => ({ ...typing, [userId]: true }));
        setTimeout(() => {
          setTyping(typing => ({ ...typing, [userId]: false }));
        }, 2000);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, openChatId]);

  // Open chat: load messages
  useEffect(() => {
    if (!openChatId || !user) return;
    setLoadingMessages(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    // Find the connection to get the connectionId
    const connection = connections.find(c => c.id === openChatId);
    if (!connection) return;

    fetchChatHistory(token, connection.id).then((data) => {
      if (data && Array.isArray(data)) {
        setChatMessages(data);
        setHasMore(data.length === 20);
        setLoadingMessages(false);
      }
    });
    setUnread((u) => ({ ...u, [openChatId]: false }));
    // scroll to bottom (newest)
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
  }, [openChatId, page, user, connections]);


  // Send message
  const sendMessage = () => {
    if (!openChatId || !message.trim() || !socketRef.current || !user) return;

    // Find the connection to get the connectionId
    const connection = connections.find(c => c.id === openChatId);
    if (!connection) return;

    const msg = {
      connectionId: connection.id,
      senderId: user.id,
      recipientId: openChatId,
      content: message,
    };

    socketRef.current.emit("chat message", msg);
    setChatMessages((msgs) => [
      ...msgs,
      {
        id: Date.now(),
        from: user.id,
        to: openChatId,
        content: message,
        createdAt: new Date().toISOString(),
      },
    ]);
    setMessage("");
  };

  const handleTyping = () => {
    if (!openChatId || !socketRef.current || !user) return;
    socketRef.current.emit("typing", {
      senderId: user.id,
      recipientId: openChatId,
    });
  };

  if (!user) return <div className="page-surface"><div className="card">Loading chat…</div></div>;

  const openChatUser = connections.find(c => c.id === openChatId);

  return (
    <main className="page-surface chat-layout">
      <aside className="chat-sidebar">
        <h2 className="section-heading">Conversations</h2>
        <div className="conversation-list">
          {connections.map(c => (
            <div
              key={c.id}
              className={`conversation-item ${c.id === openChatId ? "active" : ""}`}
              onClick={() => navigate(`/chat?with=${c.id}`)}
            >
              <div className="avatar-container">
                <img src={c.profilePic || DEFAULT_PROFILE_PIC_URL} alt="Profile" className="avatar" />
                {c.online && <div className="online-indicator"></div>}
              </div>
              <div className="conversation-details">
                <strong>{c.name}</strong>
                {typing[c.id] && <p className="typing-indicator">💬 typing…</p>}
              </div>
              {unread[c.id] && <div className="unread-indicator"></div>}
            </div>
          ))}
        </div>
      </aside>
      <section className="chat-main">
        {openChatId && openChatUser ? (
          <>
            <header className="chat-header">
              <h3>Chat with {openChatUser.name}</h3>
            </header>
            <div className="chat-messages">
              {loadingMessages && <div className="chat-loading">Loading messages…</div>}
              {chatMessages.map(m => (
                <div key={m.id} className={`chat-message ${user.id === m.senderId ? "sent" : "received"}`}>
                  <div className="chat-bubble">
                    <p className="chat-content">{m.content}</p>
                    <span className="chat-timestamp">{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              <div ref={msgEndRef}></div>
            </div>
            {hasMore && <button className="btn btn-secondary" onClick={() => setPage(p => p + 1)}>Load older messages</button>}
            <div className="chat-input-area">
              <input
                type="text"
                value={message}
                onChange={e => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Type a message…"
                className="chat-input"
              />
              <button className="btn btn-primary" onClick={sendMessage}>Send</button>
            </div>
            {typing[openChatId] && <p className="typing-indicator">💬 Typing…</p>}
          </>
        ) : (
          <div className="empty-state">
            <h3>Select a conversation</h3>
            <p>Choose a connection from the list to start chatting.</p>
          </div>
        )}
      </section>
    </main>
  );
};

export default Chat;
// Note: You will need to `npm install socket.io-client` to make this work!
