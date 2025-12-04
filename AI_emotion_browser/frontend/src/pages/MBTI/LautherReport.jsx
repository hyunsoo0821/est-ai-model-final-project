import React, { useEffect, useMemo, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Smile, Award, Zap, ChevronRight, AlertTriangle } from 'lucide-react';
import "./LautherReport.css";

const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:5001';

const includesAny = (text, keywords) => keywords.some((kw) => String(text || '').includes(kw));

// Supabase 데이터 객체에서 label (index 4)와 tags (index 3) 추출을 시도하는 헬퍼 함수
const extractLabelAndTags = (item) => {
    let label = '';
    let tags = [];

    // 'tags' 필드가 배열일 경우에만 인덱스 접근 시도
    if (Array.isArray(item.tags)) {
        // index 4를 label로 사용 (요청 사항)
        if (item.tags.length > 4) {
            label = item.tags[4];
        }
        // index 3의 요소를 tags로 사용 (요청 사항: 3가지 태그를 담고 있다고 가정)
        if (item.tags.length > 3) {
            // 여기서는 index 3의 요소 자체가 분석에 사용할 태그 3가지 배열이라고 가정합니다.
            // 만약 item.tags[3]이 문자열이라면 [item.tags[3]]으로 감싸야 합니다.
            // 데이터 구조의 모호성 때문에 안전하게 첫 3개 요소를 가져옵니다.
            tags = item.tags.slice(0, 3);
        }
    } else {
        // tags 필드가 배열이 아닐 경우, 기존 로직에서 사용되던 label/tags 필드를 사용
        label = item.label || '';
        tags = item.tags || '';
    }

    return { label, tags };
};

// 성향 분석 로직 (N, T, F, S, P 기반)
const pickMbtiByLabel = (label = '', tags = '') => {
  const tagStr = Array.isArray(tags) ? tags.join(' ') : String(tags || '');
  const text = `${label} ${tagStr}`;
  if (includesAny(text, ['반전', '풍자', '병맛'])) return 'N 성향 (병맛/창의적)'; // N
  if (includesAny(text, ['팩트폭격', '사이다', '직설'])) return 'T 성향 (팩트폭격/논리)'; // T
  if (includesAny(text, ['귀여움', '감동', '공감', '일상유머'])) return 'F 성향 (공감/감성)'; // F
  if (includesAny(text, ['슬랩스틱', '예측불가능', '당황', '활동'])) return 'S 성향 (슬랩스틱/활동)'; // S
  if (includesAny(text, ['즉흥', '전염성', '상황개그', '돌발'])) return 'P 성향 (상황개그/즉흥)'; // P
  return 'I 성향 (분석/내향)';
};

const MBTIBadge = ({ label, tags }) => {
  const mbti = pickMbtiByLabel(label, tags);
  let tone = '#636e72';
  if (mbti.startsWith('N')) tone = '#6C5CE7';
  else if (mbti.startsWith('T')) tone = '#FF7675';
  else if (mbti.startsWith('F')) tone = '#00B894';
  else if (mbti.startsWith('S')) tone = '#FFA500';
  else if (mbti.startsWith('P')) tone = '#0984E3';
  else if (mbti.startsWith('I')) tone = '#B3B3B3';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 10px',
      borderRadius: 999,
      background: `${tone}22`,
      color: '#2d3436',
      border: `1px solid ${tone}`,
      fontSize: 12,
      fontWeight: 600,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: tone }} />
      {mbti}
    </span>
  );
};

const formatTimeHMSS = (seconds) => {
  const s = Math.floor(Number(seconds) || 0);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};

const LautherReport = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState({
    mbti: '분석 중...',
    desc: '데이터를 불러오고 있습니다.',
    topTag: 'N/A',
    avgIntensity: 0,
    bestMoment: null,
  });

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // Supabase 연동 코드 (실제 Supabase 클라이언트 사용 시 이 부분을 수정해야 합니다)
        // 예: const { data, error } = await supabase.from('laugh_event').select('*');
        const res = await fetch(`${API_BASE}/laugh-event`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e?.message || 'API 오류');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!events.length) {
      setAnalysis({
        mbti: '분석 불가',
        desc: '웃음 데이터가 부족합니다.',
        topTag: '없음',
        avgIntensity: 0,
        bestMoment: null,
      });
      return;
    }

    // 최고의 웃음 순간: detected_time이 가장 짧은 이벤트 (즉, 가장 강렬하게 반응한 순간)
    const bestMomentByDuration = events.reduce((p, c) =>
      (Number(p?.detected_time) || Infinity) < (Number(c?.detected_time) || Infinity) ? p : c, null
    );

    let target = bestMomentByDuration;

    // target에서 label과 tags 추출 (요청된 인덱스 기반으로 수정)
    const { label: targetLabel, tags: targetTags } = extractLabelAndTags(target);
    
    // 만약 인덱스 추출이 실패하면, 기존 필드를 가진 이벤트를 찾습니다.
    if (!targetLabel && !targetTags.length) {
      const withTags = events.find((e) => e.tags || e.label);
      if (withTags) target = withTags;
    }
    
    // 최종 target에서 label과 tags 추출
    const { label: finalLabel, tags: finalTags } = extractLabelAndTags(target);

    // topTag 결정 로직: tags (index 3)의 첫 번째 요소 혹은 label (index 4) 사용
    let topTag = '알 수 없음';
    if (Array.isArray(finalTags) && finalTags.length > 0) {
      // tags (index 3)가 배열이고 요소가 있다면 첫 번째 요소 사용 (3가지 태그 중 하나)
      topTag = finalTags[0]; 
    } else if (finalLabel) {
      // label (index 4) 사용
      topTag = finalLabel;
    }

    const mbti = pickMbtiByLabel(finalLabel, finalTags);

    const times = events.map((e) => Number(e?.detected_time) || 0);
    const avg = times.reduce((a, v) => a + v, 0) / times.length;
    const avgPct = Number(((avg / Math.max(...times, 1)) * 100).toFixed(1));

    setAnalysis({
      mbti,
      desc: `사용자님은 '${topTag}' 요소에 가장 강하게 반응했습니다.`,
      topTag,
      avgIntensity: avgPct,
      bestMoment: bestMomentByDuration,
    });
  }, [events]);

  // 4. 레이더 차트 데이터 (5가지 핵심 성향 기반)
  const radarData = useMemo(() => {
    const intensity = (key) => analysis.mbti.includes(key.substring(0, 1)) ? 5 : analysis.mbti.includes('I 성향') ? 2 : 3;

    return [
      { subject: 'N 성향 (병맛)', A: intensity('N 성향'), fullMark: 5 },
      { subject: 'T 성향 (팩트폭격)', A: intensity('T 성향'), fullMark: 5 },
      { subject: 'F 성향 (공감)', A: intensity('F 성향'), fullMark: 5 },
      { subject: 'S 성향 (슬랩스틱)', A: intensity('S 성향'), fullMark: 5 },
      { subject: 'P 성향 (상황개그)', A: intensity('P 성향'), fullMark: 5 },
    ];
  }, [analysis.mbti]);

  const handleRecommendClick = () => (window.location.href = "/report");

  // MBTIBadge에 전달할 label/tags도 인덱스 기반으로 추출
  const bestMomentData = analysis.bestMoment ? extractLabelAndTags(analysis.bestMoment) : { label: '', tags: [] };

  return (
    <div className="report-container">
      <div className="glass-panel">
        <header className="report-header">
          <h1>웃음영상기반 성향 분석 리포트 <Smile /></h1>
          <p className="subtitle">게임 느낌으로 재미로 봐주세요!</p>
        </header>

        {loading && <div className="card"><p>데이터 분석 중...</p></div>}
        {!loading && error && <div className="card"><p className="error"><AlertTriangle /> {error}</p></div>}
        {!loading && !error && !events.length && <div className="card"><p>데이터 없음</p></div>}

        {!loading && !error && events.length > 0 && (
          <div className="dashboard-grid">
            {/* 분석 결과 (제일 첫 번째) */}
            <div className="card result-card primary-result-card">
              <div className="badge">종합 분석 결과</div>
              <h2>{analysis.mbti}</h2>
              <p className="description">{analysis.desc}</p>
              <div className="stat-row">
                <div className="stat-item">
                  <Zap />
                  <span>주요 반응 태그: <strong>{analysis.topTag}</strong></span>
                </div>
              </div>
            </div>
            
            {/* 웃음 유발 요소 분석 (시각화)  */}
            <div className="card chart-card">
              <h3>웃음 유발 요소 분석</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#e0e0e0" />
                    <PolarAngleAxis dataKey="subject" stroke="#333" fontSize={12} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar dataKey="A" stroke="#0984E3" strokeWidth={2} fill="#0984E3" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 최고의 웃음 순간 */}
            <div className="card best-moment-card">
              <h3><Award /> 최고의 짧은 웃음 순간</h3>
              {analysis.bestMoment ? (
                <div className="moment-content">
                  <div className="time-badge">
                    {formatTimeHMSS(analysis.bestMoment.detected_time)} 초에 **가장 강하게** 웃었습니다
                  </div>
                  <div className="moment-desc">
                    "{bestMomentData.label || bestMomentData.tags[0] || analysis.topTag}"
                  </div>
                  <MBTIBadge label={bestMomentData.label} tags={bestMomentData.tags} />
                  <p className="comment">닉네임: {analysis.bestMoment.nickname || '익명'}</p>
                </div>
              ) : <p>데이터 부족</p>}
            </div>

            {/* 맞춤 추천 보러가기 */}
            <div className="card recommend-card clickable-card" onClick={handleRecommendClick}>
              <div className="recommend-content">
                <div className="recommend-left">
                  <h4>맞춤 추천 보러가기</h4>
                  <p>웃음 취향 기반 추천 콘텐츠 제공</p>
                </div>
                <ChevronRight size={28} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LautherReport;