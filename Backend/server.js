import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import urlRoutes from "./routes/urlRoutes.js";
import { redirectUrl } from "./controllers/urlController.js";

import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true
    })
);
app.use(express.json());

app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/api", urlRoutes);

app.get("/:shortCode", redirectUrl);

app.get("/", (req, res) => {
    res.json({
        message: "URL Shortener API is running",
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});