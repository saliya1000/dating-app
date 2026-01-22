import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user with role from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, isBanned: true, isActive: true },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user.isBanned || !user.isActive) {
      return res.status(403).json({ error: "Account is suspended" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
