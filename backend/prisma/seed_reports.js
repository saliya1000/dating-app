import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createTestReports() {
    // Get some users
    const users = await prisma.user.findMany({
        where: { role: "USER" },
        take: 5,
    });

    if (users.length < 2) {
        console.log("Not enough users to create reports");
        return;
    }

    // Create a few test reports
    const report1 = await prisma.report.create({
        data: {
            reporterId: users[0].id,
            reportedId: users[1].id,
            reason: "Inappropriate behavior",
            details: "User was sending spam messages",
            status: "PENDING",
        },
    });

    const report2 = await prisma.report.create({
        data: {
            reporterId: users[2].id,
            reportedId: users[3].id,
            reason: "Fake profile",
            details: "Profile picture doesn't match description",
            status: "PENDING",
        },
    });

    const report3 = await prisma.report.create({
        data: {
            reporterId: users[1].id,
            reportedId: users[4].id,
            reason: "Harassment",
            details: "Repeated unwanted contact after blocking",
            status: "PENDING",
        },
    });

    console.log("Created test reports:", { report1, report2, report3 });
}

createTestReports()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
