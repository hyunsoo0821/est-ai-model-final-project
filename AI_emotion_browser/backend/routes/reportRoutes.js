import express from "express";
import { getReportData } from "../controllers/reportController.js";

const router = express.Router();

router.get("/:sessionUUID", getReportData);

export default router;
