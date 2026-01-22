import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import authMiddlewareAllowBanned from "../middleware/authBanned.js";
import authMiddleware from "../middleware/auth.js";



const router = express.Router();

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
    return res.status(404).json({ message: "User not found" });
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
      return res.status(404).json({ message: "User not found" });
    }
  }

  // If we got here, they are a valid candidate (recommended)
  next();
};

// --- Handlers ---

const getUserProfileHandler = async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const currentUserId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userBio: true, // Include "about me" information
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Fetch connection info if not own profile
  let connection = null;
  if (userId !== currentUserId) {
    connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, recipientId: userId },
          { requesterId: userId, recipientId: currentUserId },
        ],
      },
      select: { id: true, status: true, requesterId: true }
    });
  }

  // Format "about me" information from userBio
  const aboutMe = user.userBio ? {
    bio: user.bio,
    interests: [
      user.userBio.interest1,
      user.userBio.interest2,
      user.userBio.interest3
    ].filter(Boolean),
    music: user.userBio.music,
    hobby: user.userBio.hobby,
  } : {
    bio: user.bio,
    interests: [],
    music: null,
    hobby: null,
  };

  // Build response with only necessary fields
  const response = {
    id: user.id,
    username: user.username,
    profilePic: user.profilePic,
    lastSeen: user.lastSeen,
    aboutMe,
  };

  // Include private details for own profile
  if (userId === currentUserId) {
    response.email = user.email;
    response.latitude = user.latitude;
    response.longitude = user.longitude;
    response.role = user.role;
    response.isBanned = user.isBanned;
    response.isActive = user.isActive;
  }

  // Include connection info if not own profile
  if (connection) {
    response.connection = connection;
  }

  res.json(response);
};

const getUserBioHandler = async (req, res) => {
  const bio = await prisma.userBio.findUnique({
    where: { userId: parseInt(req.params.id, 10) },
  });
  // Return empty object/default if not found, or 404? 
  // Previous implementation for /me/bio returned null/empty, /:id/bio returned 404
  if (!bio) {
    // For /me/bio usually we might want to return defaults, but adhering to strict handler reuse:
    return res.status(404).json({ message: "Bio not found" });
  }
  res.json(bio);
};

// --- Routes ---

// GET /users/me → Shortcut to get my profile
router.get("/me", authMiddlewareAllowBanned, (req, res, next) => {
  req.params.id = req.user.id;
  // We can skip checkConnection for "me" as it's implicit, but if we reused the exact route stack we'd need it.
  // Instead we call the handler directly.
  getUserProfileHandler(req, res);
});

// GET /users/me/bio → Shortcut to get my bio
router.get("/me/bio", authMiddleware, (req, res, next) => {
  req.params.id = req.user.id;
  getUserBioHandler(req, res);
});

// PATCH /users/me → update username, profilePic, bio, location
// This remains separate as editing logic differs from viewing logic
router.patch("/me", authMiddleware, async (req, res) => {
  const { username, profilePic, bio, latitude, longitude } = req.body;

  if (profilePic && !profilePic.startsWith("data:image/") && !profilePic.startsWith("http")) {
    return res.status(400).json({ error: "Invalid image format. Please upload a valid image." });
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: { username, profilePic, bio, latitude, longitude },
  });

  res.json(updatedUser);
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

// GET /users/:id → returns name and profile link only
router.get("/:id", authMiddleware, checkConnection, async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({
    id: user.id,
    name: user.username,
    profileLink: `/users/${user.id}`
  });
});

// GET /users/:id/profile → returns full profile details
router.get("/:id/profile", authMiddleware, checkConnection, getUserProfileHandler);

// GET /users/:id/bio
router.get("/:id/bio", authMiddleware, checkConnection, getUserBioHandler);

export default router;
