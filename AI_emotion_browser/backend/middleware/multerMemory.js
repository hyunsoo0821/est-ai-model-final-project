/**
 * middleware/multerConfig.js
 * --------------------------------------------
 * Supabase Storage로 업로드하기 위해
 * multer를 memoryStorage로 변경
 * --------------------------------------------
 */

// middleware/multerMemory.js
import multer from "multer";

export const uploadMemory = multer({
  storage: multer.memoryStorage(),
});

/**
 * middleware/multerConfig.js
 * --------------------------------------------
 *  Multer 파일 업로드 설정 담당
 *
 * - uploads/ 폴더 생성 여부 체크
 * - 파일명이 겹치지 않도록 timestamp 추가
 * - diskStorage 방식으로 파일을 로컬에 저장
 *
 * --------------------------------------------
 */

/*
import multer from "multer";
import fs from "fs";

const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + file.originalname;
    cb(null, unique);
  },
});

const upload = multer({ storage });

export default upload;*/ //로컬저장 방식
