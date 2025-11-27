import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore: If not installed, run: npm install socket.io-client
import { io, Socket } from "socket.io-client";
import { fetchMe, fetchConnections, fetchChatHistory, sendMessageAPI, markChatRead } from "../utils/api";

interface ChatUser { id: number; name: string; profilePic: string | null; }
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
  const [openChatId, setOpenChatId] = useState<number|null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const socketRef = useRef<Socket|null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load user and connections
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    fetchMe(token).then(me => {
      if (me.error) { navigate("/login"); return; }
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

  // List view
  if (!openChatId) return (
    <main className="page-surface">
      <section className="card">
        <h2 className="section-heading">Chats</h2>
        {connections.length === 0 && (
          <div className="empty-state">
            <h3>No conversations yet</h3>
            <p>Once you connect with someone, you can chat with them here.</p>
          </div>
        )}
        {connections.map(c => (
          <div key={c.id} className="list-card" onClick={() => setOpenChatId(c.id)}>
            <div className="avatar-container">
              <img
                src={c.profilePic || "https://via.placeholder.com/48?text=%F0%9F%91%A4"}
                alt="Profile"
                className="avatar"
              />
              {c.online && <div className="online-indicator"></div>}
            </div>
            <div className="list-card__content">
              <strong>{c.name}</strong>
              {typing[c.id] && <p className="typing-indicator">💬 typing…</p>}
            </div>
            {unread[c.id] && <div className="unread-indicator"></div>}
          </div>
        ))}
      </section>
    </main>
  );

  // Chat thread view
  const other = connections.find(c => c.id === openChatId);
  return (
    <div style={{padding:"2rem",maxWidth:600,margin:"0 auto"}}>
      <button onClick={()=>setOpenChatId(null)} style={{marginBottom:16}}>&larr; Back</button>
      <h2>Chat with {other?.name}</h2>
      <div style={{minHeight:320,maxHeight:360,overflowY:'auto',border:'1px solid #ddd',borderRadius:8,padding:8,background:'#fafcff'}}>
        {loadingMessages ? <div className="chat-loading">Loading…</div> : null}
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
    </div>
  );
};

export default Chat;
// Note: You will need to `npm install socket.io-client` to make this work!
