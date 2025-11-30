import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: {
            username: "Cameron Moore"
        }
    });

    if (user) {
        console.log(`User found:`);
        console.log(`Email: ${user.email}`);
        console.log(`Username: ${user.username}`);
    } else {
        console.log("User 'Cameron Moore' not found.");
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
