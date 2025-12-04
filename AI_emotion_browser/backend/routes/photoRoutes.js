
import express from "express";
import { uploadPhotos } from "../controllers/photoController.js";
import { uploadMemory } from "../middleware/multerMemory.js";

const router = express.Router();

router.post(
  "/",
  uploadMemory.array("photos", 4),
  uploadPhotos
);

export default router;

router.get("/:session_uuid", async (req, res) => {
  const { session_uuid } = req.params;

  const { data, error } = await supabase
    .from("laugh_events")
    .select("webcam_image_urls")
    .eq("session_uuid", session_uuid)
    .eq("event_index", 4)
    .single();

  if (error) return res.status(500).json({ error });

  res.json({ photos: data.webcam_image_urls || [] });
});


/**
 * routes/photoRoutes.js
 * --------------------------------------------
 * 사진 관련 API"의 URL만 정의하는 파일
 *
 * - 실제 로직은 controllers/photoController.js에서 처리
 * - multer 업로드는 middleware/multerConfig.js에서 담당
 * - 이 파일은 라우트 선언만 담당함
 * --------------------------------------------
 */
/*
import express from "express";
import upload from "../middleware/multerConfig.js";
import {
  uploadPhotos,
  getPhotos
} from "../controllers/photoController.js";

const router = express.Router();

// POST /photos
router.post("/", upload.array("photos", 4), uploadPhotos);

// GET /photos
router.get("/", getPhotos);

export default router;
*/