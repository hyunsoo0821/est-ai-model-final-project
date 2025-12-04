import React, { useState, useEffect, useRef } from "react";
import "./LeaderBoard.css";

export default function LaughChallengeHallOfFameUpload() {
    const ranking = [
        { rank: 1, name: "김민수", time: "02:35" },
        { rank: 2, name: "이지은", time: "01:58" },
        { rank: 3, name: "박철수", time: "01:42" },
        { rank: 4, name: "최영희", time: "01:15" },
        { rank: 5, name: "조현수", time: "00:59" },
        { rank: 6, name: "한서준", time: "00:45" },
    ];

    const [photos, setPhotos] = useState([]);
    const prevRef = useRef([]); // 이전 URL 목록 저장

    const onFilesSelected = (e) => {
        const files = Array.from(e.target.files || []);
        const imageFiles = files.filter((f) => /^image\//.test(f.type));
        const urls = imageFiles.map((f) => URL.createObjectURL(f));

        // ✅ 최신 이미지를 앞에 두고 4장만 유지
        setPhotos((prev) => {
            const next = [...urls, ...prev].slice(0, 4);
            return next;
        });

        // 같은 파일을 연속 업로드할 때 onChange 다시 트리거되도록 초기화
        e.target.value = "";
    };

    // ✅ photos 변경 시, "제거된" URL만 revoke
    useEffect(() => {
        const prev = prevRef.current;
        const removed = prev.filter((url) => !photos.includes(url));
        removed.forEach((url) => URL.revokeObjectURL(url));
        prevRef.current = photos;
    }, [photos]);

    // ✅ 컴포넌트 언마운트 시 남아있는 URL 모두 revoke
    useEffect(() => {
        return () => {
            prevRef.current.forEach((url) => URL.revokeObjectURL(url));
        };
    }, []);

    const gridItems = [
        ...photos,
        ...Array(Math.max(0, 4 - photos.length)).fill(null),
    ];

    return (
        <div className="page">
            {/* 포토부스 섹션 */}
            <section className="photo-section" aria-labelledby="behind-photos">
                <h2 id="behind-photos" className="sub-title">웃은표정</h2>

                <div className="photobooth-strip">
                    <div className="strip-title">챌린지 비하인드 4컷</div>

                    <div className="controls" style={{ marginBottom: 8 }}>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="file-input"
                            onChange={onFilesSelected}
                        />
                        <span className="hint">JPG/PNG 이미지를 최대 4장까지 표시합니다.</span>
                    </div>

                    <div className="photo-grid">
                        {gridItems.map((src, idx) =>
                            src ? (
                                <div className="photo-card" key={idx}>
                                    <img
                                        src={src}
                                        alt={`챌린지 비하인드 컷 ${idx + 1}`}
                                        className="photo"
                                    />
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

            {/* 명예의 전당 테이블 섹션 */}
            <section className="ranking-section" aria-labelledby="hof-ranking">
                <h2 id="hof-ranking" className="sub-title">웃참 챌린지 명예의 전당</h2>

                <div className="table-wrapper">
                    <table className="ranking-table" role="table">
                        <thead>
                            <tr>
                                <th scope="col" className="col-rank">순위</th>
                                <th scope="col">이름</th>
                                <th scope="col">기록</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ranking.map(({ rank, name, time }) => (
                                <tr key={rank} className={rank <= 3 ? `top-${rank}` : ""}>
                                    <td className="col-rank">
                                        <span className={`medal medal-${rank <= 3 ? rank : "other"}`}>
                                            {rank <= 3 ? "🏆" : ""}
                                        </span>
                                        {rank}
                                    </td>
                                    <td>{name}</td>
                                    <td>
                                        <span className="time-chip">{time}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}