import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// GET /chat/:connectionId → get chat history for a connection
router.get("/:connectionId", authMiddleware, async (req, res) => {
  const { connectionId } = req.params;
  const { cursor } = req.query;

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

export default router;
