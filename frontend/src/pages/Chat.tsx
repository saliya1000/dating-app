import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore: If not installed, run: npm install socket.io-client
import { io, Socket } from "socket.io-client";
import { fetchMe, fetchConnections, fetchUserProfile, fetchChatHistory, sendMessageAPI, markChatRead } from "../utils/api";

interface ChatUser { id: number; name: string; profilePic: string | null; }
interface ChatMessage {
  id: number;
  from: number;
  to: number;
  content: string;
  createdAt: string;
}

const SOCKET_URL = "http://localhost:4000"; // adjust to backend

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
      fetchConnections(token).then(async (conns:any[]) => {
        if (Array.isArray(conns)) {
          const cs: ChatUser[] = [];
          for (const c of conns.filter((c:any)=>c.status==="connected")) {
            try {
              const info = await fetchUserProfile(token, c.id);
              cs.push({ id: c.id, name: info.fullName, profilePic: info.profilePic||null });
            } catch {}
          }
          setConnections(cs);
        }
      });
    });
  }, []);

  // Socket.IO connection
  useEffect(() => {
    if (!user) return;
    const socket = io(SOCKET_URL, { auth: { token: localStorage.getItem("token") } });
    socketRef.current = socket;
    socket.emit("user:join", user.id);
    socket.on("chat:message", (msg:ChatMessage) => {
      if (msg.from === openChatId) {
        setChatMessages(msgs => [...msgs, msg]);
        markChatRead(localStorage.getItem("token")||"", msg.from);
        setUnread(unread => ({...unread, [msg.from]: false}));
      } else {
        setUnread(unread => ({...unread, [msg.from]: true}));
      }
    });
    socket.on("user:typing", ({fromId}:any) => {
      setTyping(t => ({...t, [fromId]: true}));
      setTimeout(()=>setTyping(t=>({...t,[fromId]:false})), 2000);
    });
    return () => { socket.disconnect(); };
  }, [user, openChatId]);

  // Open chat: load messages
  useEffect(() => {
    if (!openChatId || !user) return;
    setLoadingMessages(true);
    fetchChatHistory(localStorage.getItem("token")||"", openChatId, page).then(data => {
      if (data && Array.isArray(data.messages)) {
        setChatMessages(data.messages);
        setHasMore(data.hasMore);
        setLoadingMessages(false);
      }
    });
    markChatRead(localStorage.getItem("token")||"", openChatId);
    setUnread(u => ({...u, [openChatId]: false}));
    // scroll to bottom (newest)
    setTimeout(()=>msgEndRef.current?.scrollIntoView({behavior:'smooth'}), 150);
  }, [openChatId, page, user]);

  // Send message
  const sendMessage = () => {
    if (!openChatId || !message.trim() || !socketRef.current) return;
    socketRef.current.emit("chat:message", { to: openChatId, content: message });
    sendMessageAPI(localStorage.getItem("token")||"", openChatId, message); // fallback for REST
    setChatMessages(msgs => [...msgs, {
      id: Date.now(), from: user!.id, to: openChatId, content: message, createdAt: new Date().toISOString()
    }]);
    setMessage("");
  };

  const sendTyping = () => {
    if (!openChatId || !socketRef.current) return;
    socketRef.current.emit("user:typing", { toId: openChatId });
  };

  if (!user) return <div style={{padding:"2rem"}}>Loading...</div>;

  // List view
  if (!openChatId) return (
    <div style={{padding:"2rem",maxWidth:600,margin:"0 auto"}}>
      <h2>Chats</h2>
      {connections.length === 0 && <div>No conversations yet.</div>}
      {connections.map(c => (
        <div key={c.id} style={{display:'flex',alignItems:'center',padding:8,borderBottom:"1px solid #ececec",cursor:'pointer'}} onClick={()=>setOpenChatId(c.id)}>
          <img src={c.profilePic||"https://via.placeholder.com/48?text=%F0%9F%91%A4"} alt="Profile" width={48} height={48} style={{borderRadius:'50%'}} />
          <span style={{marginLeft:16,flex:1}}>{c.name}</span>
          {typing[c.id] && <span style={{color:"#2c7"}}>&#128172; typing…</span>}
          {unread[c.id] && <span style={{background:"#fc4",borderRadius:8,padding:"0 6px",marginLeft:12}}>●</span>}
        </div>
      ))}
    </div>
  );

  // Chat thread view
  const other = connections.find(c => c.id === openChatId);
  return (
    <div style={{padding:"2rem",maxWidth:600,margin:"0 auto"}}>
      <button onClick={()=>setOpenChatId(null)} style={{marginBottom:16}}>&larr; Back</button>
      <h2>Chat with {other?.name}</h2>
      <div style={{minHeight:320,maxHeight:360,overflowY:'auto',border:'1px solid #ddd',borderRadius:8,padding:8,background:'#fafcff'}}>
        {loadingMessages ? <div>Loading…</div> : null}
        {chatMessages.map(m => (
          <div key={m.id} style={{display:'flex',flexDirection: user.id===m.from?"row-reverse":"row",marginBottom:8}}>
            <div style={{maxWidth:'70%',padding:8,background:user.id===m.from?"#cef3cb":"#e8edfa",borderRadius:12}}>
              <span>{m.content}</span><br/>
              <span style={{fontSize:10,color:'#888'}}>{new Date(m.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
        <div ref={msgEndRef}></div>
      </div>
      {hasMore && <button onClick={()=>setPage(p=>p+1)}>Load older…</button>}
      <div style={{marginTop:8,display:'flex',alignItems:'center'}}>
        <input type="text" value={message} onChange={e=>setMessage(e.target.value)} 
               onKeyDown={e=>{if(e.key==="Enter")sendMessage(); else sendTyping();}} placeholder="Type a message…" style={{flex:1,marginRight:8}}/>
        <button onClick={sendMessage}>Send</button>
      </div>
      {typing[openChatId||0] && <div style={{color:"#2c7",marginTop:5}}>&#128172; Typing…</div>}
    </div>
  );
};

export default Chat;
// Note: You will need to `npm install socket.io-client` to make this work!
