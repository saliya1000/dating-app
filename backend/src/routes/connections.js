import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import authMiddleware from "../middleware/auth.js";

const router = express.Router();


router.post("/", authMiddleware, async (req, res) => {
  const { recipientId } = req.body;
  const parsedRecipient = parseInt(recipientId, 10);

  if (!parsedRecipient) {
    return res.status(400).json({ error: "Missing recipientId" });
  }

  if (req.user.id === parsedRecipient) {
    return res.status(400).json({ error: "Cannot connect to yourself" });
  }


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


  const io = req.app.get("io");
  io.to(parsedRecipient).emit("new notification", {
    id: `req-${connection.id}-${Date.now()}`,
    type: "connection_request",
    title: "New Connection Request",
    message: `${req.user.username} wants to connect with you.`,
    link: "/connections",
    createdAt: connection.createdAt,
    image: req.user.profilePic,
  });

  res.json(connection);
});


router.patch("/:id/accept", authMiddleware, async (req, res) => {
  const connection = await prisma.connection.update({
    where: { id: parseInt(req.params.id) },
    data: { status: "accepted" },
    include: {
      requester: { select: { id: true, username: true, profilePic: true, bio: true } },
      recipient: { select: { id: true, username: true, profilePic: true, bio: true } },
    },
  });


  const io = req.app.get("io");
  io.to(connection.requesterId).emit("new notification", {
    id: `acc-${connection.id}-${Date.now()}`,
    type: "connection_accepted",
    title: "Request Accepted",
    message: `${req.user.username} accepted your connection request.`,
    link: `/chat?with=${connection.id}`,
    createdAt: new Date(),
    image: req.user.profilePic,
  });

  res.json(connection);
});


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


router.post("/:id/dismiss", authMiddleware, async (req, res) => {
  const dismissedId = parseInt(req.params.id, 10);
  const dismisserId = req.user.id;

  if (isNaN(dismissedId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }


  if (dismisserId === dismissedId) {
    return res.status(400).json({ error: "Cannot dismiss yourself" });
  }


  const existing = await prisma.dismissal.findFirst({
    where: {
      dismisserId,
      dismissedId,
    },
  });

  if (existing) {
    return res.status(400).json({ error: "User already dismissed" });
  }

  await prisma.dismissal.create({
    data: {
      dismisserId,
      dismissedId,
    },
  });



  res.status(204).send();
});


router.delete("/:id", authMiddleware, async (req, res) => {
  const connectionId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  const connection = await prisma.connection.findFirst({
    where: {
      id: connectionId,
      OR: [{ requesterId: userId }, { recipientId: userId }],
    },
  });

  if (!connection) {
    return res.status(404).json({ error: "Connection not found" });
  }

  await prisma.connection.delete({
    where: { id: connectionId },
  });

  res.status(204).send();
});


router.get("/", authMiddleware, async (req, res) => {
  const connections = await prisma.connection.findMany({
    where: {
      OR: [
        { requesterId: req.user.id },
        { recipientId: req.user.id },
      ],
      status: { in: ["accepted", "pending"] },
    },
    select: {
      id: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });


  const connectionIds = connections.map(conn => conn.id);
  res.json(connectionIds);
});


router.get("/:id", authMiddleware, async (req, res) => {
  const connectionId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  const connection = await prisma.connection.findFirst({
    where: {
      id: connectionId,
      OR: [
        { requesterId: userId },
        { recipientId: userId },
      ],
    },
    include: {
      requester: { select: { id: true, username: true, profilePic: true, bio: true, lastSeen: true } },
      recipient: { select: { id: true, username: true, profilePic: true, bio: true, lastSeen: true } },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          messages: {
            where: {
              recipientId: userId,
              read: false,
            },
          },
        },
      },
    },
  });

  if (!connection) {
    return res.status(404).json({ error: "Connection not found" });
  }

  res.json(connection);
});

export default router;
