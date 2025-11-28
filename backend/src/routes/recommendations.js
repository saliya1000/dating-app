import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import auth from "../middleware/auth.js";

const router = express.Router();

// Haversine formula to calculate distance between two points on Earth
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}


/**
 * GET /recommendations → returns 10 best matches
 */
router.get("/", auth, async (req, res) => {
  const userId = req.user.id;

  const me = await prisma.user.findUnique({
    where: { id: userId },
    include: { userBio: true },
  });

  if (!me || !me.userBio) return res.json([]);

  // Get connections and dismissals to exclude
  const myConnections = await prisma.connection.findMany({
    where: {
      OR: [
        { requesterId: userId },
        { recipientId: userId }
      ]
    }
  });
  const myDismissals = await prisma.dismissal.findMany({
    where: { dismisserId: userId },
  });

  const excludeIds = [
    userId,
    ...myConnections.map(c => c.requesterId),
    ...myConnections.map(c => c.recipientId),
    ...myDismissals.map(d => d.dismissedId),
  ];

  // Fetch all other users w/ bios
  let allUsers = await prisma.user.findMany({
    where: {
      id: { notIn: excludeIds },
      userBio: { isNot: null },
      latitude: { not: null },
      longitude: { not: null },
      role: "USER", // Exclude admin accounts
      isBanned: false, // Exclude banned users
      isActive: true, // Exclude inactive users
      deletedAt: null, // Exclude soft-deleted users
    },
    include: { userBio: true },
    // Note: select cannot be used with include at the same level in Prisma.
    // We need to fetch everything or use select for nested relations.
    // However, since we need userBio for scoring, include is better.
    // We can just return the fields we need.
  });

  // Filter by location
  if (me.latitude && me.longitude && me.userBio.maxDistance) {
    allUsers = allUsers.filter(other => {
      const distance = getDistance(me.latitude, me.longitude, other.latitude, other.longitude);
      return distance <= me.userBio.maxDistance;
    });
  }

  const scored = allUsers.map((other) => {
    let score = 0;

    if (other.userBio.interest1 === me.userBio.interest1) score++;
    if (other.userBio.interest2 === me.userBio.interest2) score++;
    if (other.userBio.interest3 === me.userBio.interest3) score++;
    if (other.userBio.music === me.userBio.music) score++;
    if (other.userBio.hobby === me.userBio.hobby) score++;

    return { ...other, score };
  });

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  res.json(top);
});

export default router;
