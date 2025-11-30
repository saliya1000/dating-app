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
      latitude: true,
      longitude: true,
      role: true,
      isBanned: true,
      isActive: true,
    },
  });

  // Check if user is banned or inactive
  if (user && (user.isBanned || !user.isActive)) {
    return res.status(403).json({ error: "Account is suspended" });
  }

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
  const { interest1, interest2, interest3, music, hobby, maxDistance, prefInterest, prefMusic, prefHobby } = req.body;

  const updatedBio = await prisma.userBio.upsert({
    where: { userId: req.user.id },
    update: { interest1, interest2, interest3, music, hobby, maxDistance, prefInterest, prefMusic, prefHobby },
    create: { userId: req.user.id, interest1, interest2, interest3, music, hobby, maxDistance, prefInterest, prefMusic, prefHobby },
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

  // 1. Check for existing connection (pending or accepted)
  const connection = await prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: currentUserId, recipientId: requestedUserId },
        { requesterId: requestedUserId, recipientId: currentUserId },
      ],
    },
  });

  if (connection) {
    return next();
  }

  // 2. Check if user is recommended (valid candidate)
  // Logic: Not blocked/dismissed AND within max distance (if set)

  // Check dismissal
  const dismissal = await prisma.dismissal.findFirst({
    where: {
      dismisserId: currentUserId,
      dismissedId: requestedUserId,
    },
  });

  if (dismissal) {
    return res.status(404).json({ message: "User not found or you don't have permission to view this profile." });
  }

  // Check distance if maxDistance is set
  const me = await prisma.user.findUnique({
    where: { id: currentUserId },
    include: { userBio: true },
  });

  const other = await prisma.user.findUnique({
    where: { id: requestedUserId },
  });

  if (!other) return res.status(404).json({ message: "User not found" });

  // Don't allow viewing banned, inactive, or deleted users
  if (other.isBanned || !other.isActive || other.deletedAt) {
    return res.status(404).json({ message: "User not found" });
  }

  if (me?.userBio?.maxDistance && me.latitude && me.longitude && other.latitude && other.longitude) {
    // Haversine formula (duplicated from recommendations.js, ideally shared util)
    const R = 6371;
    const dLat = (other.latitude - me.latitude) * (Math.PI / 180);
    const dLon = (other.longitude - me.longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(me.latitude * (Math.PI / 180)) *
      Math.cos(other.latitude * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance > me.userBio.maxDistance) {
      return res.status(404).json({ message: "User not found or you don't have permission to view this profile." });
    }
  }

  // If we got here, they are a valid candidate (recommended)
  next();
};


// GET /users/:id
router.get("/:id", authMiddleware, checkConnection, async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const currentUserId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      profilePic: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Fetch connection info
  const connection = await prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: currentUserId, recipientId: userId },
        { requesterId: userId, recipientId: currentUserId },
      ],
    },
    select: { id: true, status: true, requesterId: true }
  });

  res.json({ ...user, connection });
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
