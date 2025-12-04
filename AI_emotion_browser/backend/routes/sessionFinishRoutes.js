import express from "express";
import { finishSession } from "../controllers/sessionFinishController.js";

const router = express.Router();

router.post("/:session_uuid", finishSession);

export default router;
