import prisma from "./client.js";

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.log("Please provide an email address.");
        return;
    }

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (user) {
        console.log(`User found:`);
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Username: ${user.username}`);
    } else {
        console.log(`User '${email}' not found.`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
