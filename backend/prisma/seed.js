import prisma from "../prisma/client.js";
import bcrypt from "bcrypt";

async function main() {
  console.log("Seeding database...");

  // -------------------------
  // 1️⃣ Create 100 users
  // -------------------------
  const usersData = [];
  for (let i = 1; i <= 100; i++) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);
    usersData.push({
      email: `user${i}@example.com`,
      username: `user${i}`,
      password: hashedPassword,
      profilePic: null,
      bio: `Hi, I am user${i}`,
    });
  }

  for (const userData of usersData) {
    await prisma.user.create({
      data: userData,
    });
  }

  console.log("Users created");

  // -------------------------
  // 2️⃣ Create randomized UserBio
  // -------------------------
  const interests = ["music", "movies", "sports", "reading", "travel", "cooking"];
  const hobbies = ["guitar", "chess", "painting", "cycling", "gaming"];
  const musicTypes = ["pop", "rock", "jazz", "classical", "hip-hop"];

  const users = await prisma.user.findMany({ select: { id: true } });

  for (const user of users) {
    await prisma.userBio.upsert({
      where: { userId: user.id },
      update: {}, // do nothing if already exists
      create: {
        userId: user.id,
        interest1: interests[Math.floor(Math.random() * interests.length)],
        interest2: interests[Math.floor(Math.random() * interests.length)],
        interest3: interests[Math.floor(Math.random() * interests.length)],
        music: musicTypes[Math.floor(Math.random() * musicTypes.length)],
        hobby: hobbies[Math.floor(Math.random() * hobbies.length)],
      },
    });
  }

  console.log("User bios created");

  // -------------------------
  // 3️⃣ Create random connections
  // -------------------------
  const connectionsData = [];
  for (let i = 0; i < 50; i++) { // 50 random connections
    const requester = users[Math.floor(Math.random() * users.length)];
    let recipient;
    do {
      recipient = users[Math.floor(Math.random() * users.length)];
    } while (recipient.id === requester.id); // avoid self-connections

    connectionsData.push({
      requesterId: requester.id,
      recipientId: recipient.id,
      status: Math.random() > 0.5 ? "accepted" : "pending",
    });
  }

  await prisma.connection.createMany({
    data: connectionsData,
    skipDuplicates: true,
  });

  console.log("Random connections created");

  console.log("✅ Database seeding completed!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
