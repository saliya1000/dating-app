import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import connectionsRoutes from "./routes/connections.js";

dotenv.config();
const app = express();
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/connections", connectionsRoutes);

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
