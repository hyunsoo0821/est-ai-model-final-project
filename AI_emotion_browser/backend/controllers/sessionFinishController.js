

//backend/controllers/sessionFinishController.js

import axios from "axios";
import supabase from "../supabase/supabase.js";

export async function finishSession(req, res) {
  const { session_uuid } = req.params;

  try {
    console.log("⚡ finishSessionController.js loaded");
    console.log(`🔥 세션 종료 처리: ${session_uuid}`);

    // 1) laugh_events 조회
    const { data: events, error } = await supabase
      .from("laugh_events")
      .select("*")
      .eq("session_uuid", session_uuid)
      .order("event_index", { ascending: true });

    if (error) throw error;

    if (!events.length) {
      return res.json({ success: true, message: "분석할 이벤트 없음" });
    }

    const results = [];

    for (const ev of events) {
      // 2) 8100 LLM 서버에 필요한 데이터만 전달
      const resLLM = await axios.post(
        "http://localhost:8100/laugh-event",
        {
          event_id: ev.id,
          start_time: ev.start_time,
          end_time: ev.end_time,
        }
      );

      const ai = resLLM.data; 

      // 3) Supabase에 결과 업데이트
      await supabase
        .from("laugh_events")
        .update({
          tags: ai.tags || [],
          label: ai.label || [],
          summary: ai.summary || "",
          raw_response: ai.raw,
        })
        .eq("id", ev.id);

      results.push({
        event_index: ev.event_index,
        tags: ai.tags,
        label: ai.label,
        summary: ai.summary,
      });
    }

    return res.json({
      success: true,
      message: "LLM 분석 완료",
      results,
    });
  } catch (err) {
    console.error("🔥 세션 종료 오류:", err);
    return res.status(500).json({ error: "세션 종료 실패" });
  }
}


