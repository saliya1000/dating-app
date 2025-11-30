import prisma from "./client.js";

async function main() {
    // Ensure user is banned first
    const user = await prisma.user.findUnique({ where: { email: "cameron83@example.com" } });
    if (!user) return console.log("User not found");

    await prisma.user.update({ where: { id: user.id }, data: { isBanned: true } });
    console.log("User banned.");

    // Now unban
    await prisma.user.update({ where: { id: user.id }, data: { isBanned: false } });
    console.log("User unbanned.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
