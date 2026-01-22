import express from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = express.Router();

// POST /api/reports - Create a new report
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { reportedId, reason, details } = req.body;
        const reporterId = req.user.id;

        if (!reportedId || !reason) {
            return res.status(400).json({ error: "reportedId and reason are required" });
        }

        if (reporterId === reportedId) {
            return res.status(400).json({ error: "Cannot report yourself" });
        }

        // Check if user exists
        const reportedUser = await prisma.user.findUnique({
            where: { id: reportedId },
        });

        if (!reportedUser) {
            return res.status(404).json({ error: "Reported user not found" });
        }

        const report = await prisma.report.create({
            data: {
                reporterId,
                reportedId,
                reason,
                details,
            },
            include: {
                reported: {
                    select: { id: true, username: true },
                },
            },
        });

        res.json(report);
    } catch (error) {
        console.error("Error creating report:", error);
        res.status(500).json({ error: "Failed to create report" });
    }
});

export default router;
