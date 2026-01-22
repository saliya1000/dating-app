import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// GET /notifications
router.get("/", authMiddleware, async (req, res) => {
    const userId = req.user.id;

    // 1. Pending connection requests
    const requests = await prisma.connection.findMany({
        where: {
            recipientId: userId,
            status: "pending",
        },
        include: {
            requester: { select: { id: true, username: true, profilePic: true } },
        },
    });

    // 2. Unread messages (grouped by connection)
    const connectionsWithUnread = await prisma.connection.findMany({
        where: {
            OR: [{ requesterId: userId }, { recipientId: userId }],
            status: "accepted",
            messages: {
                some: {
                    recipientId: userId,
                    read: false,
                },
            },
        },
        include: {
            requester: { select: { id: true, username: true, profilePic: true } },
            recipient: { select: { id: true, username: true, profilePic: true } },
            messages: {
                where: {
                    recipientId: userId,
                    read: false,
                },
                orderBy: { createdAt: "desc" },
                take: 1,
            },
            _count: {
                select: {
                    messages: {
                        where: {
                            recipientId: userId,
                            read: false,
                        },
                    },
                },
            },
        },
    });

    // Format notifications
    const notifications = [];

    requests.forEach((req) => {
        notifications.push({
            id: `req-${req.id}`,
            type: "connection_request",
            title: "New Connection Request",
            message: `${req.requester.username} wants to connect`,
            link: "/connections",
            createdAt: req.createdAt,
            image: req.requester.profilePic,
        });
    });

    connectionsWithUnread.forEach((conn) => {
        const counterpart = conn.requesterId === userId ? conn.recipient : conn.requester;
        const count = conn._count.messages;
        const lastMsg = conn.messages[0];
        notifications.push({
            id: `msg-${conn.id}`,
            type: "message",
            title: `${counterpart.username} (${count})`,
            message: lastMsg ? lastMsg.content : "New messages",
            link: `/chat?with=${conn.id}`,
            createdAt: lastMsg ? lastMsg.createdAt : new Date(),
            image: counterpart.profilePic,
        });
    });

    // Sort by newest
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(notifications);
});

export default router;
