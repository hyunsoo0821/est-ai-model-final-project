import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./LeaderBoard1.css";



// ⏱ detected_time(초)을 "MM:SS" 형식으로 변환
const formatTime = (seconds) => {
  if (!seconds && seconds !== 0) return "--:--";
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
};

export default function LeaderBoard1() {
  const [photos, setPhotos] = useState([]);
  const [ranking, setRanking] = useState([]);
  const { state } = useLocation();
  const sessionUUID = state?.sessionUUID;
  const navigate = useNavigate(); 

  // 📌 event_index=4인 데이터 조회
  const fetchRanking = async () => {
    try {
      const res = await fetch("http://localhost:5001/laugh-event/final");
      const json = await res.json();
  
      if (!json.ok || !Array.isArray(json.data)) {
        console.error("잘못된 응답:", json);
        return;
      }
  
      const sorted = json.data
        .sort((a, b) => b.detected_time - a.detected_time) // 높은 시간 = 1위
        .slice(0, 6) // ⭐ 상위 6개만 추출
        .map((row, idx) => ({
          rank: idx + 1,
          name: row.nickname || "익명",
          time: formatTime(row.detected_time),
        }));
  
      setRanking(sorted);
    } catch (err) {
      console.error("랭킹 불러오기 실패", err);
    }
  };
  
  

  // 📌 사진 4장 불러오기
  /*
  const fetchPhotos = async () => {
    try {
      const res = await fetch("http://localhost:5001/photos");
      const data = await res.json();
      setPhotos(data.photos);
    } catch (err) {
      console.error("사진 목록 불러오기 실패", err);
    }
  };*/

  useEffect(() => {
    fetchRanking();
    //fetchPhotos();
  }, []);

  // 📌 사진 업로드
  /*
const onFilesSelected = async (e) => {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  const formData = new FormData();
  files.forEach((file) => formData.append("photos", file));

  try {
    await fetch("http://localhost:5001/photos", {
      method: "POST",
      body: formData,
    });
    fetchPhotos();
  } catch (err) {
    console.error("업로드 실패", err);
  }
  e.target.value = "";
};


  const gridItems = [...photos, ...Array(Math.max(0, 4 - photos.length)).fill(null)];
*/
  return (
    <div className="page">
      
      {/* 📸 포토섹션 */}
      {/* 
      <section className="photo-section">
        
        <h2 className="sub-title">Behind</h2>

        <div className="photobooth-strip">
          <div className="strip-title">챌린지 비하인드 4컷</div>
                  
        <div className="controls" style={{ marginBottom: 8 }}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onFilesSelected}
            className="file-input"
          />
          <span className="hint">JPG/PNG 이미지를 최대 4장까지 표시합니다.</span>
        </div>
          <div className="photo-grid">
            {gridItems.map((src, idx) =>
              src ? (
                <div className="photo-card" key={idx}>
                  <img src={src} alt="" className="photo" />
                </div>
              ) : (
                <div className="photo-card" key={idx}>
                  <div className="photo-placeholder">촬영 대기</div>
                </div>
              )
            )}
          </div>
        </div>
        
      </section>
      */}
      {/* 🏆 명예의 전당 */}
      <section className="ranking-section">
        <h2 className="sub-title">웃참 챌린지 명예의 전당</h2>
        <div className="table-wrapper">
          <table className="ranking-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>이름</th>
                <th>기록</th>
              </tr>
            </thead>

            <tbody>
              {ranking.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ padding: 20, textAlign: "center", color: "#aaa" }}>
                    기록이 아직 없어요!
                  </td>
                </tr>
              ) : (
                ranking.map(({ rank, name, time }) => (
                  <tr key={rank} className={rank <= 3 ? `top-${rank}` : ""}>
                    <td>{rank}</td>
                    <td>{name}</td>
                    <td>{time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

          <section className="insight-section">
      <h2 className="sub-title">웃참 챌린지로 분석한 당신의 성향은?</h2>

      <p className="insight-desc">
        촬영된 웃음 반응을 기반으로 한 감정/반응 패턴 분석 보고서를 확인해보세요!
      </p>

      <button
        className="insight-btn"
        onClick={() => navigate(`/rereport/${sessionUUID}`)}
      >
        👉 성향 분석 보고서 보러가기
      </button>
            
    </section>


    </div>
  );
}
