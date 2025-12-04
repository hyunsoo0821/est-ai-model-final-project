/**
 * controllers/photoController.js
 * --------------------------------------------
 * 업로드된 4개의 웹캠 사진을 Supabase Storage에 저장하고
 * public URL을 DB(laugh_events)에 매핑
 * --------------------------------------------
 */
// controllers/photoController.js
import supabase from "../supabase/supabase.js";
const bucketName = process.env.SUPABASE_BUCKET_LAUGH;


export const uploadPhotos = async (req, res) => {
  try {
    const sessionUUID = req.body.session_uuid;

    if (!sessionUUID) {
      return res.status(400).json({ error: "session_uuid missing" });
    }

    const files = req.files; // 4장

    let uploadedUrls = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = `${sessionUUID}/capture_${i}.jpg`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file.buffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) throw error;

        const publicUrl = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath).data.publicUrl;

      uploadedUrls.push(publicUrl);
    }

    return res.json({ urls: uploadedUrls });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
};


/**
 * controllers/photoController.js
 * --------------------------------------------
 * 사진 업로드 / 조회의 실제 처리 로직 담당
 *
 * - uploadPhotos(req,res)
 *    → multer가 저장한 파일에 대해 응답만 해줌
 *    → *multer : 
 * 
 * - getPhotos(req,res)
 *    → uploads/ 폴더에서 최신 사진 4개를 찾아
 *       정렬 후 URL로 반환
 *
 *    라우트에서는 필요한 함수만 가져다 사용.
 * --------------------------------------------
 */


/*
import fs from "fs";

const uploadDir = "uploads";

export const uploadPhotos = (req, res) => {
  return res.json({ success: true });
};

export const getPhotos = (req, res) => {
  const files = fs.readdirSync(uploadDir);

  const sorted = files
    .sort((a, b) => {
      const at = parseInt(a.split("-")[0]);
      const bt = parseInt(b.split("-")[0]);
      return bt - at;
    })
    .slice(0, 4);

  const urls = sorted.map(
    (file) => `http://localhost:5001/uploads/${file}`
  );

  res.json({ photos: urls });
};*/
