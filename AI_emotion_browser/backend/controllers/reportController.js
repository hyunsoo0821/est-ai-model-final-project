// backend/controllers/reportController.js
import supabase from "../supabase/supabase.js";

export async function getReportData(req, res) {
  try {
    const { sessionUUID } = req.params;

    if (!sessionUUID) {
      return res.status(400).json({
        ok: false,
        error: "sessionUUID is required",
      });
    }

    // 1) laugh_events 조회
    const { data: events, error: evErr } = await supabase
      .from("laugh_events")
      .select("*")
      .eq("session_uuid", sessionUUID)
      .order("event_index", { ascending: true });

    if (evErr) throw evErr;

    if (!events || events.length === 0) {
      return res.json({
        ok: true,
        data: {
          summary: ["아직 웃음 기록이 없습니다."],
          labels: [],
          tags: [],
          laughCount: 0,
          dominantLabel: null,
          labelCount: {
            병맛: 0,
            슬랩스틱: 0,
            팩트폭격: 0,
            공감: 0,
            상황개그: 0,
          },
          nickname: "익명",
        },
      });
    }

    /* ------------------------------------
       2) summary / labels / tags 모두 펼치기
       ------------------------------------ */
    const allSummaries = events
      .filter((e) => e.summary)
      .map((e) => e.summary);

    const allLabels = events.flatMap((e) => e.label || []);
    const allTags = [...new Set(events.flatMap((e) => e.tags || []))];

    /* ------------------------------------
       3) 라벨 카운트 계산
       ------------------------------------ */
    const labelCount = {
      병맛: 0,
      슬랩스틱: 0,
      팩트폭격: 0,
      공감: 0,
      상황개그: 0,
    };

    allLabels.forEach((lbl) => {
      if (labelCount[lbl] !== undefined) {
        labelCount[lbl]++;
      }
    });

    /* ------------------------------------
       4) dominantLabel 계산
       ------------------------------------ */
    const dominantLabel = Object.keys(labelCount).reduce((a, b) =>
      labelCount[a] >= labelCount[b] ? a : b
    );

    /* ------------------------------------
       5) 닉네임은 첫 이벤트 기준
       ------------------------------------ */
    const nickname = events[0].nickname || "익명";

    return res.json({
      ok: true,
      data: {
        summary: allSummaries,
        labels: allLabels,
        tags: allTags,
        laughCount: events.length,
        dominantLabel,
        labelCount,
        nickname,
      },
    });

  } catch (err) {
    console.error("🔥 Report API Error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
}
