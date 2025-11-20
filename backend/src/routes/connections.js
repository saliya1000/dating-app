import express from "express";
import prisma from "../../prisma/client.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Send request
router.post("/", authMiddleware, async (req, res) => {
  const { recipientId } = req.body;

  if (req.user.id === recipientId) return res.status(400).json({ error: "Cannot connect to self" });

  const connection = await prisma.connection.create({
    data: {
      requesterId: req.user.id,
      recipientId,
      status: "pending",
    },
  });

  res.json(connection);
});

// Accept request
router.patch("/:id/accept", authMiddleware, async (req, res) => {
  const connection = await prisma.connection.update({
    where: { id: parseInt(req.params.id) },
    data: { status: "accepted" },
  });

  res.json(connection);
});

// Reject request
router.patch("/:id/reject", authMiddleware, async (req, res) => {
  const connection = await prisma.connection.update({
    where: { id: parseInt(req.params.id) },
    data: { status: "rejected" },
  });

  res.json(connection);
});

// List my connections
router.get("/", authMiddleware, async (req, res) => {
  const connections = await prisma.connection.findMany({
    where: {
      OR: [
        { requesterId: req.user.id, status: "accepted" },
        { recipientId: req.user.id, status: "accepted" },
      ],
    },
  });

  res.json(connections);
});

export default router;
