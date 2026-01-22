import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import auth from "../middleware/auth.js";

const router = express.Router();


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



router.get("/", auth, async (req, res) => {
  console.log("Recommendations endpoint hit by user:", req.user.id);
  const userId = req.user.id;

  const me = await prisma.user.findUnique({
    where: { id: userId },
    include: { userBio: true },
  });


  if (!me || !me.userBio || !me.latitude || !me.longitude) {
    return res.json([]);
  }


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

  });


  if (me.latitude && me.longitude && me.userBio.maxDistance) {
    allUsers = allUsers.filter(other => {
      const distance = getDistance(me.latitude, me.longitude, other.latitude, other.longitude);
      return distance <= me.userBio.maxDistance;
    });
  }

  const scored = allUsers.map((other) => {
    let score = 0;

    const normalize = (str) => (str || "").toLowerCase().trim();


    if (me.userBio.prefInterest && me.userBio.prefInterest.trim()) {

      const target = normalize(me.userBio.prefInterest);
      if (normalize(other.userBio.interest1) === target ||
        normalize(other.userBio.interest2) === target ||
        normalize(other.userBio.interest3) === target) {
        score += 2; // Higher score for explicit preference match
      }
    } else {

      if (normalize(other.userBio.interest1) === normalize(me.userBio.interest1)) score++;
      if (normalize(other.userBio.interest2) === normalize(me.userBio.interest2)) score++;
      if (normalize(other.userBio.interest3) === normalize(me.userBio.interest3)) score++;
    }


    if (me.userBio.prefMusic && me.userBio.prefMusic.trim()) {
      if (normalize(other.userBio.music) === normalize(me.userBio.prefMusic)) {
        score += 2;
      }
    } else {
      if (normalize(other.userBio.music) === normalize(me.userBio.music)) score++;
    }


    if (me.userBio.prefHobby && me.userBio.prefHobby.trim()) {
      if (normalize(other.userBio.hobby) === normalize(me.userBio.prefHobby)) {
        score += 2;
      }
    } else {
      if (normalize(other.userBio.hobby) === normalize(me.userBio.hobby)) score++;
    }

    return { ...other, score };
  }).filter(user => user.score > 0);

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(user => user.id);

  res.json(top);
});

export default router;
