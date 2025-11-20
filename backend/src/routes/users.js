import express from "express";
import prisma from "../../prisma/client.js";
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

// PATCH /users/me → update username, profilePic, bio
router.patch("/me", authMiddleware, async (req, res) => {
  const { username, profilePic, bio } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: { username, profilePic, bio },
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

// PATCH /users/me/bio → update interests
router.patch("/me/bio", authMiddleware, async (req, res) => {
  const { interest1, interest2, interest3, music, hobby } = req.body;

  const updatedBio = await prisma.userBio.upsert({
    where: { userId: req.user.id },
    update: { interest1, interest2, interest3, music, hobby },
    create: { userId: req.user.id, interest1, interest2, interest3, music, hobby },
  });

  res.json(updatedBio);
});

export default router;
