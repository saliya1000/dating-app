import prisma from "./client.js";

async function main() {
    // Find a user to ban (e.g. cameron83)
    const user = await prisma.user.findUnique({
        where: { email: "cameron83@example.com" }
    });

    if (!user) {
        console.log("User not found");
        return;
    }

    // Ban the user
    await prisma.user.update({
        where: { id: user.id },
        data: { isBanned: true }
    });

    console.log(`User ${user.username} (ID: ${user.id}) has been banned.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
