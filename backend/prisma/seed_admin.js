import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    const email = "admin@example.com";
    const password = "admin123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: { email },
        update: { role: "ADMIN" },
        create: {
            email,
            username: "SuperAdmin",
            password: hashedPassword,
            role: "ADMIN",
            bio: "System Administrator",
            profilePic: "https://ui-avatars.com/api/?name=Super+Admin&background=0D8ABC&color=fff",
        },
    });

    console.log({ admin });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
