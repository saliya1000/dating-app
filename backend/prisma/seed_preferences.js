import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const interests = ["Reading", "Hiking", "Cooking", "Photography", "Gaming", "Yoga", "Painting", "Dancing", "Traveling", "Music", "Sports", "Movies", "Fitness", "Writing", "Gardening"];
const musicGenres = ["Pop", "Rock", "Jazz", "Classical", "Hip-Hop", "Electronic", "Country", "R&B", "Indie", "Metal"];
const hobbies = ["Cycling", "Swimming", "Running", "Chess", "Knitting", "Baking", "Surfing", "Skateboarding", "Climbing", "Meditation"];

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
    console.log("🔄 Seeding matching preferences for existing users...");

    const users = await prisma.user.findMany({
        include: { userBio: true },
    });

    console.log(`Found ${users.length} users. Updating preferences...`);

    let updatedCount = 0;

    for (const user of users) {
        if (user.userBio) {
            await prisma.userBio.update({
                where: { userId: user.id },
                data: {
                    prefInterest: randomElement(interests),
                    prefMusic: randomElement(musicGenres),
                    prefHobby: randomElement(hobbies),
                },
            });
            updatedCount++;
        }
    }

    console.log(`✅ Successfully updated preferences for ${updatedCount} users.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
