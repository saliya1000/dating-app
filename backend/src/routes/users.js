import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// GET /users/me → get profile info
router.get("/me", authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      profilePic: true,
      bio: true,
    },
  });
  res.json(user);
});

// PATCH /users/me → update username, profilePic, bio, location
router.patch("/me", authMiddleware, async (req, res) => {
  const { username, profilePic, bio, latitude, longitude } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: { username, profilePic, bio, latitude, longitude },
  });

  res.json(updatedUser);
});

// GET /users/me/bio → get interests
router.get("/me/bio", authMiddleware, async (req, res) => {
  const bio = await prisma.userBio.findUnique({
    where: { userId: req.user.id },
  });
  res.json(bio);
});

// PATCH /users/me/bio → update interests and maxDistance
router.patch("/me/bio", authMiddleware, async (req, res) => {
  const { interest1, interest2, interest3, music, hobby, maxDistance } = req.body;

  const updatedBio = await prisma.userBio.upsert({
    where: { userId: req.user.id },
    update: { interest1, interest2, interest3, music, hobby, maxDistance },
    create: { userId: req.user.id, interest1, interest2, interest3, music, hobby, maxDistance },
  });

  res.json(updatedBio);
});

// Middleware to check for a connection between the authenticated user and the user being requested
const checkConnection = async (req, res, next) => {
  const requestedUserId = parseInt(req.params.id, 10);
  const currentUserId = req.user.id;

  if (requestedUserId === currentUserId) {
    return next();
  }

  const connection = await prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: currentUserId, recipientId: requestedUserId },
        { requesterId: requestedUserId, recipientId: currentUserId },
      ],
    },
  });

  if (!connection) {
    return res.status(404).json({ message: "User not found or you don't have permission to view this profile." });
  }

  next();
};


// GET /users/:id
router.get("/:id", authMiddleware, checkConnection, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(req.params.id, 10) },
    select: {
      id: true,
      username: true,
      profilePic: true,
    },
  });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json(user);
});

// GET /users/:id/profile
router.get("/:id/profile", authMiddleware, checkConnection, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(req.params.id, 10) },
    select: {
      id: true,
      bio: true,
    },
  });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json(user);
});

// GET /users/:id/bio
router.get("/:id/bio", authMiddleware, checkConnection, async (req, res) => {
  const bio = await prisma.userBio.findUnique({
    where: { userId: parseInt(req.params.id, 10) },
  });
  if (!bio) {
    return res.status(404).json({ message: "Bio not found" });
  }
  res.json(bio);
});

export default router;
