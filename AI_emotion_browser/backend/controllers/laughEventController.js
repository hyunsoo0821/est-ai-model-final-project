// controllers/laughEventController.js
import supabase from "../supabase/supabase.js";

export const saveLaughEvent = async (req, res) => {
  try {
    const {
      session_uuid,
      nickname,
      event_index,
      detected_time,
      start_time,
      end_time,
      webcam_urls
    } = req.body;

    const { data, error } = await supabase
      .from("laugh_events")
      .insert({
        session_uuid,
        event_index,
        detected_time,
        start_time,
        end_time,
        webcam_image_urls: webcam_urls,
        nickname
      })
      .select();

    if (error) throw error;
    return res.json({ success: true, event: data });
  } catch (err) {
    return res.status(500).json({ error: "DB insert failed" });
  }
};

// 🎯 새로 추가해야 하는 함수 — Python LLM에서 전달된 결과 저장
export const saveLlmResult = async (req, res) => {
  try {
    const { event_id, tags, label, summary } = req.body;

    const result = await supabase
      .from("laugh_events")
      .update({
        tags,
        label,
        summary,
      })
      .eq("id", event_id)
      .select();

    return res.json({ ok: true, result });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};


export const getEventsBySession = async (req, res) => {
  try {
    const { session_uuid } = req.params;

    const { data, error } = await supabase
      .from("laugh_events")
      .select("*")
      .eq("session_uuid", session_uuid)
      .order("event_index", { ascending: true });

    if (error) throw error;
    return res.json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getLaughFinalEvents = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("laugh_events")
      .select("nickname, detected_time")
      .eq("event_index", 4)
      .order("detected_time", { ascending: false });

    if (error) throw error;

    return res.json({
      ok: true,
      data,
    });

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};
