import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import connectionsRoutes from "./routes/connections.js";
import recommendationsRoutes from "./routes/recommendations.js";
import chatRoutes from "./routes/chat.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const onlineUsers = new Map();

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/connections", connectionsRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    onlineUsers.set(socket.id, userId);
    io.emit("user online", userId);
  });

  socket.on("disconnect", () => {
    const userId = onlineUsers.get(socket.id);
    if (userId) {
      onlineUsers.delete(socket.id);
      io.emit("user offline", userId);
      console.log(`user ${userId} disconnected`);
    }
  });

  socket.on("chat message", async (msg) => {
    const { connectionId, senderId, recipientId, content } = msg;
    const message = await prisma.message.create({
      data: {
        connectionId,
        senderId,
        recipientId,
        content,
      },
    });
    io.to(recipientId).to(senderId).emit("chat message", message);
  });

  socket.on("typing", (data) => {
    io.to(data.recipientId).emit("typing", { userId: data.senderId });
  });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
