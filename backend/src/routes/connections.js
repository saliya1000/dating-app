import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Send request
router.post("/", authMiddleware, async (req, res) => {
  const { recipientId } = req.body;
  const parsedRecipient = parseInt(recipientId, 10);

  if (!parsedRecipient) {
    return res.status(400).json({ error: "Missing recipientId" });
  }

  if (req.user.id === parsedRecipient) {
    return res.status(400).json({ error: "Cannot connect to yourself" });
  }

  // Avoid duplicate pending connections
  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: req.user.id, recipientId: parsedRecipient },
        { requesterId: parsedRecipient, recipientId: req.user.id },
      ],
      status: { in: ["pending", "accepted"] },
    },
  });

  if (existing) {
    return res.status(400).json({ error: "Connection already exists or pending" });
  }

  const connection = await prisma.connection.create({
    data: {
      requesterId: req.user.id,
      recipientId: parsedRecipient,
      status: "pending",
    },
    include: {
      requester: { select: { id: true, username: true, profilePic: true, bio: true } },
      recipient: { select: { id: true, username: true, profilePic: true, bio: true } },
    },
  });

  res.json(connection);
});

// Accept request
router.patch("/:id/accept", authMiddleware, async (req, res) => {
  const connection = await prisma.connection.update({
    where: { id: parseInt(req.params.id) },
    data: { status: "accepted" },
    include: {
      requester: { select: { id: true, username: true, profilePic: true, bio: true } },
      recipient: { select: { id: true, username: true, profilePic: true, bio: true } },
    },
  });

  res.json(connection);
});

// Reject request
router.patch("/:id/reject", authMiddleware, async (req, res) => {
  const connection = await prisma.connection.update({
    where: { id: parseInt(req.params.id) },
    data: { status: "rejected" },
    include: {
      requester: { select: { id: true, username: true, profilePic: true, bio: true } },
      recipient: { select: { id: true, username: true, profilePic: true, bio: true } },
    },
  });

  res.json(connection);
});

// List my connections and requests
router.get("/", authMiddleware, async (req, res) => {
  const connections = await prisma.connection.findMany({
    where: {
      OR: [
        { requesterId: req.user.id },
        { recipientId: req.user.id },
      ],
    },
    include: {
      requester: { select: { id: true, username: true, profilePic: true, bio: true } },
      recipient: { select: { id: true, username: true, profilePic: true, bio: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(connections);
});

export default router;
