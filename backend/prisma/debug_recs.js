import prisma from "./client.js";

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

async function main() {
    const userEmail = "cameron83@example.com";
    // We don't know Cameron Anderson's email, so we search by username/name
    // Assuming username might be similar or we search by name pattern if possible.
    // Actually, let's search for "Cameron Anderson" in username or just list users with that name.
    // Since the user said "Recommendation from 'Cameron Anderson'", that's likely the username or we can find him.

    const me = await prisma.user.findUnique({
        where: { email: userEmail },
        include: { userBio: true }
    });

    if (!me) {
        console.log("User cameron83 not found");
        return;
    }

    console.log(`ME: ${me.username} (${me.email})`);
    console.log(`Location: ${me.latitude}, ${me.longitude}`);
    console.log(`Max Distance: ${me.userBio?.maxDistance} km`);

    // Find the other user
    // The user said "Cameron Anderson". Let's try to find a user with that username or similar.
    // Or maybe it's a first name/last name thing? The seed data generates usernames like "user1", "user2".
    // Wait, the user might have updated their profile name?
    // Or maybe the seed data uses real names?
    // Let's search for users with "Cameron" in username.

    const others = await prisma.user.findMany({
        where: {
            username: { contains: "Cameron", mode: "insensitive" },
            NOT: { id: me.id }
        }
    });

    console.log(`\nFound ${others.length} other users matching 'Cameron':`);

    for (const other of others) {
        const dist = getDistanceFromLatLonInKm(me.latitude, me.longitude, other.latitude, other.longitude);
        console.log(`- ${other.username} (${other.email})`);
        console.log(`  Location: ${other.latitude}, ${other.longitude}`);
        console.log(`  Distance: ${dist.toFixed(2)} km`);
        console.log(`  Within range? ${dist <= (me.userBio?.maxDistance || 50) ? "YES" : "NO"}`);
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
