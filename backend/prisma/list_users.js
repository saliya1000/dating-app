import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function listUsers() {
    const users = await prisma.user.findMany({
        where: { role: "USER" },
        select: { email: true, username: true },
        take: 10,
        orderBy: { id: "asc" },
    });

    console.log("First 10 users:");
    users.forEach((u, i) => {
        console.log(`${i + 1}. Email: ${u.email} | Username: ${u.username}`);
    });
    console.log("\nPassword for all users: password123");
}

listUsers()
    .finally(() => prisma.$disconnect());
