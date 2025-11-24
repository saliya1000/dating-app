import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import connectionsRoutes from "./routes/connections.js";
import recommendationsRoutes from "./routes/recommendations.js";

dotenv.config();
const app = express();
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/connections", connectionsRoutes);
app.use("/api/recommendations", recommendationsRoutes);

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
