import prisma from "./client.js";

async function main() {
    const adminId = 406;
    const userId = 489;

    // 1. Ensure connection exists
    let connection = await prisma.connection.findFirst({
        where: {
            OR: [
                { requesterId: adminId, recipientId: userId },
                { requesterId: userId, recipientId: adminId }
            ]
        }
    });

    if (!connection) {
        console.log("Creating connection...");
        connection = await prisma.connection.create({
            data: {
                requesterId: userId,
                recipientId: adminId,
                status: "accepted"
            }
        });
    } else {
        console.log("Connection already exists.");
        if (connection.status !== "accepted") {
            await prisma.connection.update({
                where: { id: connection.id },
                data: { status: "accepted" }
            });
        }
    }

    // 2. Seed 25 messages (older)
    console.log("Seeding 25 messages...");
    const messages = [];
    for (let i = 0; i < 25; i++) {
        messages.push({
            connectionId: connection.id,
            senderId: userId,
            recipientId: adminId,
            content: `History message ${i + 1}`,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * (26 - i)) // 1 hour apart, starting 26 hours ago
        });
    }
    await prisma.message.createMany({ data: messages });

    // 3. Send 1 new message (unread)
    console.log("Sending 1 new unread message...");
    await prisma.message.create({
        data: {
            connectionId: connection.id,
            senderId: userId,
            recipientId: adminId,
            content: "Hey Admin, this is a new message!",
            createdAt: new Date()
        }
    });

    console.log("Done!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
