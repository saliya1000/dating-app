import express from "express";
import { PrismaClient } from "@prisma/client";
import authMiddlewareAllowBanned from "../middleware/authBanned.js";
import authMiddleware from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = express.Router();

// POST /api/inquiries - Submit an inquiry (allowed for banned users)
router.post("/", authMiddlewareAllowBanned, async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const inquiry = await prisma.bannedInquiry.create({
            data: {
                userId,
                message,
            },
        });

        res.json(inquiry);
    } catch (error) {
        console.error("Error creating inquiry:", error);
        res.status(500).json({ error: "Failed to submit inquiry" });
    }
});

// GET /api/admin/inquiries - View all inquiries (admin only)
// Note: This route should be mounted under /api/admin/inquiries or similar.
// Since we are creating a separate file, let's assume this file is mounted at /api/inquiries
// and we add a specific admin route here, OR we can put this in admin.js.
// Let's put the admin route here but protect it.

router.get("/", authMiddleware, async (req, res) => {
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Access denied" });
    }

    try {
        const inquiries = await prisma.bannedInquiry.findMany({
            include: {
                user: {
                    select: { id: true, username: true, email: true, profilePic: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        res.json(inquiries);
    } catch (error) {
        console.error("Error fetching inquiries:", error);
        res.status(500).json({ error: "Failed to fetch inquiries" });
    }
});

export default router;
