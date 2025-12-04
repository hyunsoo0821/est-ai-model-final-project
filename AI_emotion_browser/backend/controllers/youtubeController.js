import axios from "axios";
import supabase from "../supabase/supabase.js";

const API_KEY = process.env.YOUTUBE_API_KEY;

// GET /youtube/recommend/:sessionUUID
export async function getYoutubeRecommendations(req, res) {
  try {
    const { sessionUUID } = req.params;

    // 1) laugh_events 전체 가져오기
    const { data: events, error } = await supabase
      .from("laugh_events")
      .select("event_index, tags")
      .eq("session_uuid", sessionUUID)
      .order("event_index", { ascending: true });

    if (error) {
      console.error("❌ Supabase Error:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    if (!events.length) {
      return res.json({ ok: false, error: "No events found" });
    }

    const sections = [];
    const grouped = {};

    // 2) index 별로 tags 그룹화 + 안전 JSON 변환
    events.forEach((ev) => {
      if (!grouped[ev.event_index]) grouped[ev.event_index] = [];

      let tagList = ev.tags;

      // 🔥 ev.tags가 문자열(JSON string)일 경우 파싱
      if (typeof tagList === "string") {
        try {
          tagList = JSON.parse(tagList);
        } catch (e) {
          console.error("❌ Failed to parse tags:", ev.tags);
          tagList = [];
        }
      }

      // 배열이 아닌 경우 대비
      if (!Array.isArray(tagList)) {
        tagList = [];
      }

      grouped[ev.event_index].push(...tagList);
    });

    // 3) 각 index별 YouTube 추천 영상 요청
    for (const index of Object.keys(grouped)) {
      const tags = [...new Set(grouped[index])];
      if (!tags.length) continue;

      const query = tags.join(" ") + " 웃긴 영상";

      let youtubeResponse;

      try {
        youtubeResponse = await axios.get(
          "https://www.googleapis.com/youtube/v3/search",
          {
            params: {
              key: API_KEY,
              q: query,
              part: "snippet",
              type: "video",
              maxResults: 5,
              order: "relevance",
            },
          }
        );
      } catch (err) {
        console.error("❌ YouTube API Error:", err.response?.data || err);
        continue; // 이 index는 skip
      }

      const videos = youtubeResponse.data.items.map((item) => ({
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        video_url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnail: item.snippet.thumbnails.medium.url,
      }));

      sections.push({
        index: Number(index),
        query,
        videos,
      });
    }

    return res.json({ ok: true, sections });

  } catch (err) {
    console.error("🔥 GET YouTube Recommend Error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
