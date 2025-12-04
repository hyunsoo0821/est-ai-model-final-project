import express from "express";
import {
  saveLaughEvent,
  saveLlmResult,
  getEventsBySession,
  getLaughFinalEvents
} from "../controllers/laughEventController.js";
import supabase from "../supabase/supabase.js";


const router = express.Router();

router.post("/", saveLaughEvent);

router.post("/llm-result", saveLlmResult);

router.get("/final", getLaughFinalEvents);


router.get("/", async (req, res) => {
  try {
    const idx = req.query.event_index;
    // Supabase 조회 쿼리 생성
    let query = supabase.from("laugh_events").select("*");

    if (idx !== undefined) {
      query = query.eq("event_index", Number(idx));
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Supabase error:", error);
      return res.status(500).json({ error });
    }

    return res.json({
      ok: true,
      index: idx,
      data
    });

  } catch (err) {
    console.error("❌ Server error:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.get("/:session_uuid", getEventsBySession);

export default router;
// controllers/laughEventController.js 에 추가

export const getAllLaughEvents = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("laugh_events")
      .select("*") // 모든 필드를 선택
      .order("created_at", { ascending: false }); // 최신 순으로 정렬 (선택 사항)

    if (error) throw error;
     return res.json(data); // 배열 형태로 반환

  } catch (err) {
   // 서버 에러 발생 시 500을 반환하여 React 코드의 fetch에서 오류를 포착하도록 함
    return res.status(500).json({ error: "Failed to fetch all laugh events: " + err.message });
  }
};