import express from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// GET /dashboard/stats
router.get("/stats", authMiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        // 1. Connections Count
        const connectionsCount = await prisma.connection.count({
            where: {
                OR: [{ requesterId: userId }, { recipientId: userId }],
                status: "accepted",
            },
        });

        // 2. Pending Requests Count (Incoming)
        const pendingCount = await prisma.connection.count({
            where: {
                recipientId: userId,
                status: "pending",
            },
        });

        // 3. Matching Score (Mock calculation for now)
        // Logic: Base 3 stars + 1 if has > 5 connections + 1 if profile complete
        let score = 3;
        if (connectionsCount > 5) score += 1;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { bio: true, interests: true, profilePic: true }
        });

        if (user.bio && user.interests.length > 0 && user.profilePic) {
            score += 1;
        }
        if (score > 5) score = 5;

        res.json({
            connectionsCount,
            pendingCount,
            matchingScore: score,
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
});

export default router;
