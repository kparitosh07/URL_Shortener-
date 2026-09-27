import express from "express";
import { createShortUrl,getAnalytics } from "../controllers/urlController.js";

const router = express.Router();

router.post("/shorten", createShortUrl);
router.get("/analytics/:shortCode", getAnalytics);

export default router;