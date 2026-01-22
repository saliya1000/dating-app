import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Helper to generate random data
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const firstNames = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Skyler", "Dakota", "Cameron", "Peyton", "Reese", "Parker", "Sage", "River", "Phoenix", "Rowan", "Finley", "Emerson"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const interests = ["Reading", "Hiking", "Cooking", "Photography", "Gaming", "Yoga", "Painting", "Dancing", "Traveling", "Music", "Sports", "Movies", "Fitness", "Writing", "Gardening"];
const musicGenres = ["Pop", "Rock", "Jazz", "Classical", "Hip-Hop", "Electronic", "Country", "R&B", "Indie", "Metal"];
const hobbies = ["Cycling", "Swimming", "Running", "Chess", "Knitting", "Baking", "Surfing", "Skateboarding", "Climbing", "Meditation"];
const bios = [
  "Love exploring new places and trying new foods!",
  "Fitness enthusiast and coffee addict ☕",
  "Looking for someone to share adventures with",
  "Dog lover 🐕 and outdoor enthusiast",
  "Bookworm seeking a reading partner",
  "Foodie who loves trying new restaurants",
  "Adventure seeker and travel junkie ✈️",
  "Music lover and concert goer 🎵",
  "Yoga instructor and wellness advocate",
  "Tech geek and startup founder",
];

const reportReasons = [
  "Inappropriate behavior",
  "Fake profile",
  "Harassment",
  "Spam messages",
  "Offensive content",
  "Catfishing",
];

async function main() {
  console.log("🌱 Starting seeding process...");

  // 1. Create Admin User
  console.log("🛡️  Upserting Admin user...");
  const adminEmail = "admin@example.com";
  const adminPassword = "admin123";
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      username: "SuperAdmin",
      password: hashedAdminPassword,
      role: "ADMIN",
      bio: "System Administrator",
      profilePic: "https://ui-avatars.com/api/?name=Super+Admin&background=0D8ABC&color=fff",
    },
  });
  console.log(`✅ Admin user ready: ${admin.email}`);

  // 2. Clear other data
  console.log("\n🗑️  Clearing existing user data (keeping admin)...");

  // Delete in correct order due to foreign key constraints
  await prisma.report.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.dismissal.deleteMany({});
  await prisma.connection.deleteMany({});
  await prisma.userBio.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      role: "USER" // Only delete regular users, preserve Admin
    },
  });

  console.log("✅ Cleared existing user data\n");

  console.log("👥 Creating 100 users...");
  const users = [];
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Reduced count from 500 to 100 for faster default seeding, but enough for testing
  for (let i = 1; i <= 100; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const username = `${firstName.toLowerCase()}${i}`;

    const user = await prisma.user.create({
      data: {
        email: `${username}@example.com`,
        username: `${firstName} ${lastName}`,
        password: hashedPassword,
        bio: randomElement(bios),
        profilePic: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=${Math.floor(Math.random() * 16777215).toString(16)}&color=fff`,
        latitude: 40.7128 + (Math.random() - 0.5) * 2, // Around NYC
        longitude: -74.0060 + (Math.random() - 0.5) * 2,
        role: "USER",
        isBanned: i > 90 ? true : false,
        isActive: i > 95 ? false : true,
      },
    });

    // Create bio for each user
    await prisma.userBio.create({
      data: {
        userId: user.id,
        interest1: randomElement(interests),
        interest2: randomElement(interests),
        interest3: randomElement(interests),
        music: randomElement(musicGenres),
        hobby: randomElement(hobbies),
        maxDistance: randomInt(10, 100),
      },
    });

    users.push(user);
  }
  console.log(`✅ Created ${users.length} users\n`);

  console.log("🤝 Creating connections...");
  const connections = [];
  const statuses = ["pending", "accepted", "rejected"];

  for (let i = 0; i < 50; i++) {
    const requester = randomElement(users);
    const recipient = randomElement(users.filter(u => u.id !== requester.id));

    // Check if connection already exists
    const existing = connections.find(
      c => (c.requesterId === requester.id && c.recipientId === recipient.id) ||
        (c.requesterId === recipient.id && c.recipientId === requester.id)
    );

    if (!existing) {
      const status = randomElement(statuses);
      const connection = await prisma.connection.create({
        data: {
          requesterId: requester.id,
          recipientId: recipient.id,
          status,
          createdAt: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000),
        },
      });
      connections.push(connection);
    }
  }
  console.log(`✅ Created ${connections.length} connections\n`);

  console.log("💬 Creating messages...");
  const messages = [
    "Hey! How are you?",
    "I saw your profile and thought we'd get along great!",
    "What do you like to do for fun?",
    "Would love to grab coffee sometime!",
    "That's awesome! Tell me more about that.",
  ];

  let messageCount = 0;
  const acceptedConnections = connections.filter(c => c.status === "accepted");

  for (const conn of acceptedConnections) {
    const messageAmount = randomInt(3, 8);

    for (let i = 0; i < messageAmount; i++) {
      const isRequesterSending = Math.random() > 0.5;
      await prisma.message.create({
        data: {
          connectionId: conn.id,
          senderId: isRequesterSending ? conn.requesterId : conn.recipientId,
          recipientId: isRequesterSending ? conn.recipientId : conn.requesterId,
          content: randomElement(messages),
          createdAt: new Date(Date.now() - randomInt(0, 7) * 24 * 60 * 60 * 1000),
        },
      });
      messageCount++;
    }
  }
  console.log(`✅ Created ${messageCount} messages\n`);

  console.log("🚫 Creating dismissals/blocks...");
  let dismissalCount = 0;

  for (let i = 0; i < 20; i++) {
    const dismisser = randomElement(users);
    const dismissed = randomElement(users.filter(u => u.id !== dismisser.id));

    const existing = await prisma.dismissal.findFirst({
      where: {
        dismisserId: dismisser.id,
        dismissedId: dismissed.id,
      },
    });

    if (!existing) {
      await prisma.dismissal.create({
        data: {
          dismisserId: dismisser.id,
          dismissedId: dismissed.id,
        },
      });
      dismissalCount++;
    }
  }
  console.log(`✅ Created ${dismissalCount} dismissals\n`);

  console.log("🚩 Creating reports...");
  let reportCount = 0;

  for (let i = 0; i < 10; i++) {
    const reporter = randomElement(users.filter(u => !u.isBanned));
    const reported = randomElement(users.filter(u => u.id !== reporter.id));
    const status = i < 5 ? "PENDING" : randomElement(["RESOLVED", "DISMISSED"]);

    await prisma.report.create({
      data: {
        reporterId: reporter.id,
        reportedId: reported.id,
        reason: randomElement(reportReasons),
        details: `This user has been ${randomElement(reportReasons).toLowerCase()}. Please review.`,
        status,
        createdAt: new Date(Date.now() - randomInt(0, 14) * 24 * 60 * 60 * 1000),
      },
    });
    reportCount++;
  }
  console.log(`✅ Created ${reportCount} reports\n`);

  console.log("📊 Summary:");
  console.log(`   👥 Users: ${users.length}`);
  console.log(`   🤝 Connections: ${connections.length}`);
  console.log(`   💬 Messages: ${messageCount}`);
  console.log(`   🚫 Dismissals: ${dismissalCount}`);
  console.log(`   🚩 Reports: ${reportCount}`);
  console.log("\n✨ Database seeded successfully!");
  console.log("\n📝 Test Credentials:");
  console.log("   Regular User: alex1@example.com / password123");
  console.log("   Admin: admin@example.com / admin123");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
