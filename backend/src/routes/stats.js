import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get("/", async (_req, res) => {
    try {
        // Get total active users
        const activeUsers = await prisma.user.count();

        // Get successful matches (accepted connections) - All time
        const successfulMatches = await prisma.connection.count({
            where: {
                status: "accepted",
            },
        });

        // Calculate average response time for accepted connections
        // We'll use the first message timestamp as a proxy for when the connection was accepted
        const acceptedConnections = await prisma.connection.findMany({
            where: {
                status: "accepted",
            },
            select: {
                createdAt: true,
                messages: {
                    orderBy: {
                        createdAt: "asc",
                    },
                    take: 1,
                    select: {
                        createdAt: true,
                    },
                },
            },
        });

        let avgResponseTime = 0;
        const connectionsWithMessages = acceptedConnections.filter(conn => conn.messages.length > 0);

        if (connectionsWithMessages.length > 0) {
            const totalResponseTime = connectionsWithMessages.reduce((sum, conn) => {
                const responseTime = conn.messages[0].createdAt.getTime() - conn.createdAt.getTime();
                return sum + responseTime;
            }, 0);

            // Convert from milliseconds to hours
            avgResponseTime = Math.round(totalResponseTime / connectionsWithMessages.length / (1000 * 60 * 60));
        } else {
            // If no messages yet, just use a default value
            avgResponseTime = 4;
        }

        res.json({
            activeUsers,
            successfulMatches,
            avgResponseTime,
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: "Failed to fetch statistics" });
    }
});

export default router;
