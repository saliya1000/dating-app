import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// GET /chat/:connectionId → get chat history for a connection
router.get("/:connectionId", authMiddleware, async (req, res) => {
  const { connectionId } = req.params;
  const { cursor } = req.query;
  const userId = req.user.id;

  // Verify user is part of the connection and connection is accepted
  const connection = await prisma.connection.findFirst({
    where: {
      id: parseInt(connectionId, 10),
      OR: [
        { requesterId: userId },
        { recipientId: userId }
      ],
      status: "accepted" // Only allow chat for accepted connections
    }
  });

  if (!connection) {
    return res.status(403).json({ error: "You can only chat with connected users" });
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
router.post("/:connectionId/read", authMiddleware, async (req, res) => {
  const { connectionId } = req.params;
  const userId = req.user.id;

  // Verify user is part of the connection and connection is accepted
  const connection = await prisma.connection.findFirst({
    where: {
      id: parseInt(connectionId, 10),
      OR: [
        { requesterId: userId },
        { recipientId: userId }
      ],
      status: "accepted" // Only allow chat for accepted connections
    }
  });

  if (!connection) {
    return res.status(403).json({ error: "You can only chat with connected users" });
  }

  await prisma.message.updateMany({
    where: {
      connectionId: parseInt(connectionId, 10),
      recipientId: req.user.id,
      read: false,
    },
    data: {
      read: true,
    },
  });

  res.json({ success: true });
});

export default router;
