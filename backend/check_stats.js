import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const totalAccepted = await prisma.connection.count({ where: { status: "accepted" } });
    const pending = await prisma.connection.findMany({ where: { status: "pending" } });

    console.log("Total Accepted:", totalAccepted);
    console.log("Total Pending:", pending.length);

    if (pending.length > 0) {
        const totalAge = pending.reduce((sum, c) => sum + (Date.now() - c.createdAt.getTime()), 0);
        const avgAgeHours = totalAge / pending.length / (1000 * 60 * 60);
        console.log("Avg Age of Pending (hours):", avgAgeHours);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
