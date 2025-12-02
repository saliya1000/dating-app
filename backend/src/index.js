import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import connectionsRoutes from "./routes/connections.js";
import recommendationsRoutes from "./routes/recommendations.js";
import notificationsRoutes from "./routes/notifications.js";
import chatRoutes from "./routes/chat.js";
import statsRoutes from "./routes/stats.js";
import dashboardRoutes from "./routes/dashboard.js";
import adminRoutes from "./routes/admin.js";
import reportsRoutes from "./routes/reports.js";
import inquiriesRoutes from "./routes/inquiries.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests from localhost or 127.0.0.1 on port 5173
      if (!origin || origin === "http://localhost:5173" || origin === "http://127.0.0.1:5173") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
  },
});
app.set("io", io);

const onlineUsers = new Map();

app.use(express.json({ limit: "50mb" }));
app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests from localhost or 127.0.0.1 on port 5173
    if (!origin || origin === "http://localhost:5173" || origin === "http://127.0.0.1:5173") {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/connections", connectionsRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/inquiries", inquiriesRoutes);

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    onlineUsers.set(socket.id, userId);
    io.emit("user online", userId);

    // Send list of currently online users to the joining user
    const uniqueOnlineUsers = Array.from(new Set(onlineUsers.values()));
    socket.emit("online users", uniqueOnlineUsers);
  });

  socket.on("disconnect", async () => {
    const userId = onlineUsers.get(socket.id);
    if (userId) {
      onlineUsers.delete(socket.id);

      // Check if user has other sockets open (e.g. multiple tabs)
      const isStillOnline = Array.from(onlineUsers.values()).includes(userId);

      if (!isStillOnline) {
        io.emit("user offline", userId);
        try {
          await prisma.user.update({
            where: { id: userId },
            data: { lastSeen: new Date() },
          });
        } catch (err) {
          console.error("Error updating lastSeen:", err);
        }
        console.log(`user ${userId} disconnected`);
      }
    }
  });

  socket.on("chat message", async (msg) => {
    const { connectionId, senderId, recipientId, content } = msg;

    // Check if sender is admin
    const senderUser = await prisma.user.findUnique({
      where: { id: senderId },
      select: { role: true }
    });

    if (senderUser?.role === "ADMIN") {
      return;
    }
    const message = await prisma.message.create({
      data: {
        connectionId,
        senderId,
        recipientId,
        content,
      },
    });

    // Emit message to both users
    io.to(recipientId).to(senderId).emit("chat message", message);

    // Emit real-time notification to recipient
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { username: true, profilePic: true }
    });

    io.to(recipientId).emit("new notification", {
      id: `msg-${connectionId}-${Date.now()}`,
      type: "message",
      title: sender.username,
      message: content,
      link: `/chat?with=${connectionId}`,
      createdAt: message.createdAt,
      image: sender.profilePic,
    });
  });

  socket.on("typing", (data) => {
    io.to(data.recipientId).emit("typing", { userId: data.senderId });
  });
});

server.listen(3000, "0.0.0.0", () => console.log("Server running on http://localhost:3000"));
