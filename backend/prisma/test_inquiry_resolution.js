import prisma from "./client.js";

async function main() {
    // 1. Ensure user exists and is banned
    let user = await prisma.user.findUnique({ where: { email: "jordan500@example.com" } });
    if (!user) {
        // Create user if not exists
        user = await prisma.user.create({
            data: {
                email: "jordan500@example.com",
                username: "Jordan Test",
                password: "password123",
                isBanned: true
            }
        });
    } else {
        await prisma.user.update({ where: { id: user.id }, data: { isBanned: true } });
    }

    // 2. Create a pending inquiry
    await prisma.bannedInquiry.create({
        data: {
            userId: user.id,
            message: "Please unban me",
            status: "PENDING"
        }
    });

    console.log("User banned and inquiry created.");

    // 3. Simulate unban API logic (update user + resolve inquiries)
    const userId = user.id;
    await prisma.user.update({
        where: { id: userId },
        data: { isBanned: false }
    });

    await prisma.bannedInquiry.updateMany({
        where: { userId: userId, status: "PENDING" },
        data: { status: "RESOLVED" },
    });

    console.log("User unbanned and inquiries resolved.");

    // 4. Verify inquiry status
    const inquiries = await prisma.bannedInquiry.findMany({
        where: { userId: userId, status: "PENDING" }
    });

    if (inquiries.length === 0) {
        console.log("SUCCESS: No pending inquiries found for user.");
    } else {
        console.log("FAILURE: Pending inquiries still exist.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
