import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

async function main() {
    // 1. Get a user to test with
    const user = await prisma.user.findFirst({ where: { email: "casey1@example.com" } });
    if (!user) {
        console.log("User not found");
        return;
    }

    // 2. Generate token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secret_key_123", { expiresIn: "1h" });

    // 3. Fetch recommendations
    const res = await fetch("http://localhost:3000/api/recommendations", {
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    console.log("Response status:", res.status);
    console.log("Response data:", JSON.stringify(data, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
