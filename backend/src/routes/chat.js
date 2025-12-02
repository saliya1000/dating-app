import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// GET /chat/:connectionId → get chat history for a connection
// GET /chat/:connectionId → get chat history for a connection
router.get("/:connectionId", authMiddleware, async (req, res) => {
  const { connectionId } = req.params;
  const { cursor } = req.query;
  const userId = req.user.id;

  // Verify connection ownership
  const connection = await prisma.connection.findUnique({
    where: { id: parseInt(connectionId, 10) },
  });

  if (!connection) {
    return res.status(404).json({ error: "Connection not found" });
  }

  if (connection.requesterId !== userId && connection.recipientId !== userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const messages = await prisma.message.findMany({
    where: {
      connectionId: parseInt(connectionId, 10),
    },
    take: 20,
    ...(cursor && {
      skip: 1,
      cursor: {
        id: parseInt(cursor, 10),
      },
    }),
    orderBy: {
      createdAt: "desc",
    },
  });

  res.json(messages);
});

// POST /chat/:connectionId/read → mark all messages in connection as read
// POST /chat/:connectionId/read → mark all messages in connection as read
router.post("/:connectionId/read", authMiddleware, async (req, res) => {
  const { connectionId } = req.params;
  const userId = req.user.id;

  // Verify connection ownership
  const connection = await prisma.connection.findUnique({
    where: { id: parseInt(connectionId, 10) },
  });

  if (!connection) {
    return res.status(404).json({ error: "Connection not found" });
  }

  if (connection.requesterId !== userId && connection.recipientId !== userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  await prisma.message.updateMany({
    where: {
      connectionId: parseInt(connectionId, 10),
      recipientId: userId,
      read: false,
    },
    data: {
      read: true,
    },
  });

  res.json({ success: true });
});

export default router;
