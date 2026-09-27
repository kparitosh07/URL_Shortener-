import { nanoid } from "nanoid";
import Url from "../models/Url.js";

export const createShortUrl = async (req, res) => {
    try {
        const { originalUrl, customAlias, expiresAt } = req.body;

        if (!originalUrl) {
            return res.status(400).json({
                success: false,
                message: "Original URL is required",
            });
        }

        let parsedUrl;

        try {
            parsedUrl = new URL(originalUrl);
        } catch {
            return res.status(400).json({
                success: false,
                message: "Invalid URL",
            });
        }

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            return res.status(400).json({
                success: false,
                message: "Only HTTP and HTTPS URLs are allowed",
            });
        }

        let shortCode;

        if (customAlias) {
            if (!/^[a-zA-Z0-9-]+$/.test(customAlias)) {
                return res.status(400).json({
                    success: false,
                    message:"Custom alias can only contain letters, numbers and hyphens",
                });
            }

            const existingUrl = await Url.findOne({
                shortCode: customAlias,
            });

            if (existingUrl) {
                return res.status(409).json({
                    success: false,
                    message: "Custom alias already exists",
                });
            }

            shortCode = customAlias;
        } else {
            shortCode = nanoid(6);

            while (await Url.findOne({ shortCode })) {
                shortCode = nanoid(6);
            }
        }

        const newUrl = await Url.create({ originalUrl, shortCode, expiresAt: expiresAt || null });

        return res.status(201).json({
            success: true,
            message: "Short URL created successfully",
            data: {
                originalUrl: newUrl.originalUrl,
                shortCode: newUrl.shortCode,
                shortUrl: `${req.protocol}://${req.get("host")}/${newUrl.shortCode}`,
                expiresAt: newUrl.expiresAt,
            },
        });
    } catch (error) {
        console.error("Create short URL error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const redirectUrl = async (req,res) => {
    try {
        const { shortCode } = req.params;

        const url = await Url.findOne({ shortCode });

        if(!url){
            return res.status(404).json({
                success: false,
                message: "Short URL not found"
            });
        }

        if(url.expiresAt && new Date() > url.expiresAt){
            return res.status(404).json({
                success: false,
                message: "Short Url has expired"
            });
        }

        url.clicks += 1;
        url.lastAccessed = new Date();

        await url.save();
        return res.redirect(302 , url.originalUrl);
    } catch (error) {
        console.error("Redirect url error", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}

export const getAnalytics = async (req, res) => {
    try {
        const { shortCode } = req.params;

        const url = await Url.findOne({ shortCode });

        if (!url) {
            return res.status(404).json({
                success: false,
                message: "Short URL not found"
            });
        }

        const isExpired =
            url.expiresAt && new Date() > url.expiresAt;

        return res.status(200).json({
            success: true,
            data: {
                shortCode: url.shortCode,
                originalUrl: url.originalUrl,
                clicks: url.clicks,
                lastAccessed: url.lastAccessed,
                expiresAt: url.expiresAt,
                status: isExpired ? "Expired" : "Active"
            }
        });

    } catch (error) {
        console.error("Analytics error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};