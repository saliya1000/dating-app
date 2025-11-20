import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import auth from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /recommendations → returns 10 best matches
 */
router.get("/", auth, async (req, res) => {
  const userId = req.user.id;

  const myBio = await prisma.userBio.findUnique({
    where: { userId }
  });

  if (!myBio) return res.json([]);

  // Get connections to exclude
  const myConnections = await prisma.connection.findMany({
    where: {
      OR: [
        { requesterId: userId },
        { recipientId: userId }
      ]
    }
  });

  const excludeIds = [
    userId,
    ...myConnections.map(c => c.requesterId),
    ...myConnections.map(c => c.recipientId),
  ];

  // Fetch all other users w/ bios
  const allUsers = await prisma.userBio.findMany({
    where: {
      userId: { notIn: excludeIds }
    },
    include: { user: true }
  });

  const scored = allUsers.map((other) => {
    let score = 0;

    if (other.interest1 === myBio.interest1) score++;
    if (other.interest2 === myBio.interest2) score++;
    if (other.interest3 === myBio.interest3) score++;
    if (other.music === myBio.music) score++;
    if (other.hobby === myBio.hobby) score++;

    return { ...other, score };
  });

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  res.json(top);
});

export default router;
