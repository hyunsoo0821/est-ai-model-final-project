import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import "./LaughterFinalReport.css";

/* ----------------------------
    MBTI 계산 (성향 1개만 추출)
-----------------------------*/
function getMBTIFromLabels(labels) {
  if (!labels || labels.length === 0) return null;

  const count = {
    병맛: 0,
    슬랩스틱: 0,
    팩트폭격: 0,
    공감: 0,
    상황개그: 0,
  };

  
  labels.forEach((lbl) => {
    if (count[lbl] !== undefined) count[lbl]++;
  });

  const maxCount = Math.max(...Object.values(count));
  const bestLabel = Object.keys(count).find(
    (key) => count[key] === maxCount
  );

  const mapToType = {
    병맛: "N성향",
    슬랩스틱: "S성향",
    팩트폭격: "T성향",
    공감: "F성향",
    상황개그: "P성향",
  };

  return mapToType[bestLabel] ?? null;
}

export default function LaughterFinalReport() {
  const { sessionUUID } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [summaryList, setSummaryList] = useState([]);
  const [labels, setLabels] = useState([]);
  const [tags, setTags] = useState([]);
  const [dominantLabel, setDominantLabel] = useState("");
  const [laughCount, setLaughCount] = useState(0);
  const [nickname, setNickname] = useState("");
  const [labelCount, setLabelCount] = useState({
    병맛: 0,
    슬랩스틱: 0,
    팩트폭격: 0,
    공감: 0,
    상황개그: 0,
  });
  

  /* ----------------------------
      MBTI 프로필 (5가지 형태)
  -----------------------------*/
  const mbtiProfiles = {
    T성향: {
      title: "🎯 논리 폭격 개그마스터",
      desc: "어떤 상황에서도 포인트를 정확히 찌르는 촌철살인형. 날카로운 구조적 웃음을 선호해요!",
    },
    N성향: {
      title: "🔮 발명형 병맛 천재",
      desc: "기괴한 병맛 아이디어로 웃음을 터뜨리는 천재형 개그러예요!",
    },
    F성향: {
      title: "❤️ 공감형 힐링 개그러",
      desc: "공감 기반의 부드러운 웃음과 따뜻한 분위기를 좋아하는 힐링형 개그러!",
    },
    S성향: {
      title: "⚡ 액션형 슬랩스틱러",
      desc: "빠르고 직관적인 슬랩스틱 개그를 보면 바로 빵! 터지는 타입.",
    },
    P성향: {
      title: "🌟 감각형 상황개그러",
      desc: "표정·타이밍·상황에서 오는 웃음에 강한, 감각적 개그러!",
    },
  };

  const getMBTIProfile = (mbti) =>
    mbtiProfiles[mbti] ?? {
      title: "데이터 부족",
      desc: "웃음 데이터가 충분하지 않아 성향 분석을 생성할 수 없어요!",
    };

  /* ----------------------------
      API 로드
  -----------------------------*/
  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch(`http://localhost:5001/report/${sessionUUID}`);
        const json = await res.json();

        if (!json.ok) {
          setLoading(false);
          return;
        }

        const data = json.data;
        setSummaryList(data.summary || []);
        setLabels(data.labels || []);
        setTags(data.tags || []);
        setLaughCount(data.laughCount || 0);
        setDominantLabel(data.dominantLabel || null);
        setNickname(data.nickname || "");
        setLabelCount(data.labelCount || {});
      } catch (err) {
        console.error("🔥 Report API 호출 실패:", err);
      }
      setLoading(false);
    }
    loadReport();
  }, [sessionUUID]);

  /* ----------------------------
      MBTI 자동 계산
  -----------------------------*/
  const mbti = useMemo(() => getMBTIFromLabels(labels), [labels]);
  const profile = getMBTIProfile(mbti);

  /* ----------------------------
      Radar Chart (5개 항목)
  -----------------------------*/
  const radarData = useMemo(() => {
    const groups = ["병맛", "슬랩스틱", "팩트폭격", "공감", "상황개그"];
  
    // 레이더 차트 max 스케일용 (최대값 찾기)
    const maxValue = Math.max(...Object.values(labelCount), 1);
    const fullMark = Math.max(maxValue, 4); // 👉 최소 4 이상

    return groups.map((label) => ({
      subject: label,
      value: labelCount[label] || 0,
      fullMark,
    }));
  }, [labelCount]);
  

  if (loading) return <div className="loading">보고서 생성 중...</div>;

  return (
    <div className="report-container">
      {/* 헤더 */}
      <section className="section header-section">
        <h1 className="main-title">당신의 유머 성향 분석</h1>
        <p className="subtitle">{nickname}님의 웃음 데이터를 기반으로 생성된 보고서입니다.</p>
      </section>

      {/* 🔥 레이더 차트 */}
      <section className="section radar-section">
        <div className="radar-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid />
              <PolarAngleAxis
                  dataKey="subject"
                  tickFormatter={(value, index) => {
                    // 데이터 5개만 출력
                    return index < 5 ? value : "";
                  }}
                />
              <Radar
                name="Reaction"
                dataKey="value"
                stroke="#FF6B6B"
                fill="#FF6B6B"
                fillOpacity={0.45}
              />
            </RadarChart>
          </ResponsiveContainer>

          {/* 중앙 라벨 영역 */}
          <div className="radar-center-label">
            {dominantLabel ?? "데이터 없음"}
          </div>
        </div>

        <p className="radar-caption">
          {dominantLabel ? (
            <>
              <strong>{dominantLabel}</strong> 요소에서 가장 크게 반응했어요!
            </>
          ) : (
            <>아직 웃음 데이터가 부족해 분석할 요소가 없어요 😢</>
          )}
        </p>
      </section>

      {/* 세부 분석 */}
      <section className="section detail-section">
        <h2 className="section-title">당신이 웃은 장면 요약</h2>

        <ul className="summary-list">
          {summaryList.map((item, index) => (
            <li key={index} className="summary-item">
              {index + 1}. {item}
            </li>
          ))}
        </ul>

        <p className="laugh-count">
          전체 웃은 횟수 : <strong>{laughCount}번</strong>
        </p>

        <div className="mbti-result">
          <h3>{profile.title}</h3>
          <p>{profile.desc}</p>
        </div>

        <div className="mbti-highlight">
          {mbti ? (
            <>
              가장 즐기는 유머 성향은 <span className="mbti">{mbti}</span> 입니다.
            </>
          ) : (
            <span className="no-data">데이터가 부족해 성향을 분석할 수 없어요 😢</span>
          )}
        </div>
      </section>

      {/* 태그 */}
      <section className="section recommend-section">
        <h2 className="section-title">Key Tags</h2>

        <div className="tag-list">
          {tags.map((tag, i) => (
            <span key={i} className="tag-item">#{tag}</span>
          ))}
        </div>

        <button className="recommend-btn" onClick={() => navigate(`/recommend/${sessionUUID}`)}>
          맞춤 콘텐츠 추천받기
        </button>
      </section>
    </div>
  );
}
