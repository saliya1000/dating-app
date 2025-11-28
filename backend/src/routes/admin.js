import express from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middleware/auth.js";
import adminMiddleware from "../middleware/admin.js";

const prisma = new PrismaClient();
const router = express.Router();

// All routes require auth + admin
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/users - List all users with filters
router.get("/users", async (req, res) => {
    try {
        const { search, status, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {
            deletedAt: null, // Don't show soft-deleted users by default
        };

        if (search) {
            where.OR = [
                { username: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        if (status === "banned") where.isBanned = true;
        if (status === "inactive") where.isActive = false;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    username: true,
                    role: true,
                    isBanned: true,
                    isActive: true,
                    createdAt: true,
                    lastSeen: true,
                    _count: {
                        select: {
                            sentConnections: true,
                            receivedReports: true,
                        },
                    },
                },
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: "desc" },
            }),
            prisma.user.count({ where }),
        ]);

        res.json({
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// PATCH /api/admin/users/:id/ban - Toggle ban status
router.patch("/users/:id/ban", async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.role === "ADMIN") {
            return res.status(403).json({ error: "Cannot ban admin users" });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { isBanned: !user.isBanned },
            select: { id: true, username: true, isBanned: true },
        });

        res.json(updated);
    } catch (error) {
        console.error("Error toggling ban:", error);
        res.status(500).json({ error: "Failed to toggle ban" });
    }
});

// PATCH /api/admin/users/:id/disable - Toggle active status
router.patch("/users/:id/disable", async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.role === "ADMIN") {
            return res.status(403).json({ error: "Cannot disable admin users" });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { isActive: !user.isActive },
            select: { id: true, username: true, isActive: true },
        });

        res.json(updated);
    } catch (error) {
        console.error("Error toggling active status:", error);
        res.status(500).json({ error: "Failed to toggle active status" });
    }
});

// DELETE /api/admin/users/:id - Soft delete user
router.delete("/users/:id", async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.role === "ADMIN") {
            return res.status(403).json({ error: "Cannot delete admin users" });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { deletedAt: new Date(), isActive: false },
            select: { id: true, username: true, deletedAt: true },
        });

        res.json(updated);
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

// GET /api/admin/reports - List all reports
router.get("/reports", async (req, res) => {
    try {
        const { status = "PENDING", page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        if (status && status !== "ALL") {
            where.status = status;
        }

        const [reports, total] = await Promise.all([
            prisma.report.findMany({
                where,
                include: {
                    reporter: {
                        select: { id: true, username: true, email: true },
                    },
                    reported: {
                        select: { id: true, username: true, email: true, isBanned: true },
                    },
                },
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: "desc" },
            }),
            prisma.report.count({ where }),
        ]);

        res.json({
            reports,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ error: "Failed to fetch reports" });
    }
});

// PATCH /api/admin/reports/:id - Update report status
router.patch("/reports/:id", async (req, res) => {
    try {
        const reportId = parseInt(req.params.id);
        const { status, action } = req.body; // status: RESOLVED/DISMISSED, action: ban/warn/ignore

        const updated = await prisma.report.update({
            where: { id: reportId },
            data: { status },
        });

        // If action is ban, ban the reported user
        if (action === "ban") {
            await prisma.user.update({
                where: { id: updated.reportedId },
                data: { isBanned: true },
            });
        }

        res.json(updated);
    } catch (error) {
        console.error("Error updating report:", error);
        res.status(500).json({ error: "Failed to update report" });
    }
});

// GET /api/admin/stats - Platform statistics
router.get("/stats", async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalUsers,
            activeToday,
            totalConnections,
            messagesToday,
            pendingReports,
            bannedUsers,
        ] = await Promise.all([
            prisma.user.count({ where: { deletedAt: null } }),
            prisma.user.count({
                where: {
                    lastSeen: { gte: today },
                    deletedAt: null,
                },
            }),
            prisma.connection.count({ where: { status: "accepted" } }),
            prisma.message.count({
                where: { createdAt: { gte: today } },
            }),
            prisma.report.count({ where: { status: "PENDING" } }),
            prisma.user.count({ where: { isBanned: true } }),
        ]);

        res.json({
            totalUsers,
            activeToday,
            totalConnections,
            messagesToday,
            pendingReports,
            bannedUsers,
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

export default router;
