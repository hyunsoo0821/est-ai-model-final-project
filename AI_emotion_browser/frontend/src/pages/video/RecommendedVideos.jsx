import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Lauther.css";

const RecommendedVideos2 = () => {
  const { sessionUUID } = useParams();

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecommendations() {
      try {
        const res = await fetch(`http://localhost:5001/youtube/recommend/${sessionUUID}`);
        const json = await res.json();
  
        if (!json.ok) return;
  
        // 🔥 초기 전체 로딩
        setSections(prev => {
          const newList = [...prev];
          
          json.sections.forEach(sec => {
            const exists = newList.some(s => s.index === sec.index);
            if (!exists) newList.push(sec);
          });
  
          return newList.sort((a, b) => a.index - b.index);
        });
  
      } catch (err) {
        console.error("API ERROR:", err);
      } finally {
        setLoading(false);
      }
    }
  
    loadRecommendations(); // 최초 로딩
    const interval = setInterval(loadRecommendations, 10000); // 10초 폴링
  
    return () => clearInterval(interval);
  
  }, [sessionUUID]);

  if (loading && sections.length === 0) {
    return <p>추천 영상을 불러오는 중...</p>;
  }

  return (
    <div className="recommendation-container">
      <h2 className="title">🎉 추천 영상 목록</h2>

      {/* 🔥 index 1 → index 2 → index 3 식으로 카드가 계속 추가됨 */}
      {sections
        .sort((a, b) => a.index - b.index)
        .map(section => (
          <div key={section.index} className="recommend-section">
            <h3 className="subtitle">
              {section.index}차 웃음 기반 추천 (키워드: {section.query})
            </h3>

            <ul className="video-list">
              {section.videos.map((video, i) => (
                <li key={i} className="video-card">
                  <div className="video-number">{i + 1}</div>
                  <img src={video.thumbnail} className="thumbnail" />
                  <div className="video-info">
                    <a href={video.video_url} target="_blank" className="video-title">
                      {video.title}
                    </a>
                    <p className="video-channel">📺 {video.channel}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
};

export default RecommendedVideos2;
