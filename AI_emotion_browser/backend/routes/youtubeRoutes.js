import express from "express";
import { getYoutubeRecommendations } from "../controllers/youtubeController.js";

const router = express.Router();

router.get("/recommend/:sessionUUID", getYoutubeRecommendations);


export default router;
