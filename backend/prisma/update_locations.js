import prisma from "./client.js";

const CITIES = [
    { name: "Helsinki", lat: 60.1699, lon: 24.9384 },
    { name: "Espoo", lat: 60.2055, lon: 24.6559 },
    { name: "Tampere", lat: 61.4978, lon: 23.7610 },
    { name: "Vantaa", lat: 60.2934, lon: 25.0378 },
    { name: "Oulu", lat: 65.0121, lon: 25.4651 },
    { name: "Turku", lat: 60.4518, lon: 22.2666 },
    { name: "Jyväskylä", lat: 62.2426, lon: 25.7473 },
    { name: "Lahti", lat: 60.9827, lon: 25.6612 },
    { name: "Kuopio", lat: 62.8980, lon: 27.6782 },
    { name: "Pori", lat: 61.4851, lon: 21.7974 },
    { name: "Kouvola", lat: 60.8678, lon: 26.7042 },
    { name: "Joensuu", lat: 62.6010, lon: 29.7636 },
    { name: "Lappeenranta", lat: 61.0587, lon: 28.1887 },
    { name: "Hämeenlinna", lat: 60.9959, lon: 24.4643 },
    { name: "Vaasa", lat: 63.0951, lon: 21.6165 },
    { name: "Seinäjoki", lat: 62.7877, lon: 22.8543 },
    { name: "Rovaniemi", lat: 66.5039, lon: 25.7294 },
    { name: "Mikkeli", lat: 61.6886, lon: 27.2723 },
    { name: "Kotka", lat: 60.4666, lon: 26.9431 },
    { name: "Salo", lat: 60.3863, lon: 23.1237 },
];

async function main() {
    console.log("Updating user locations to Finnish cities...");

    const users = await prisma.user.findMany();

    for (const user of users) {
        const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];

        // Add some random jitter to coordinates so they aren't all stacked exactly on top of each other
        // 0.01 degrees is roughly 1km
        const jitterLat = (Math.random() - 0.5) * 0.02;
        const jitterLon = (Math.random() - 0.5) * 0.02;

        await prisma.user.update({
            where: { id: user.id },
            data: {
                latitude: randomCity.lat + jitterLat,
                longitude: randomCity.lon + jitterLon,
            },
        });
    }

    console.log(`✅ Updated ${users.length} users with random Finnish locations.`);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
