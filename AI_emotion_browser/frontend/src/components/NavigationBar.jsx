import { Link, useLocation } from "react-router-dom";
import "./NavigationBar.css";

export default function NavigationBar({ sessionUUID }) {
  const location = useLocation();

  // 🔥 state를 통해 넘어온 UUID도 우선 적용
  const fallbackUUID = location.state?.sessionUUID;

  // 최종 UUID (없으면 undefined → 그대로 URL에 포함)
  const finalUUID = sessionUUID ?? fallbackUUID;

  return (
    <nav className="nav">
      <div className="nav-left">
        <Link to="/" className="nav-logo">😂 웃참 챌린지</Link>
      </div>

      <div className="nav-right">
        <Link to="/" className="nav-item">홈</Link>

        {/* 명예의 전당 (state만 전달하면 됨) */}
        <Link
          to="/leaderboard1"
          className="nav-item"
          state={{ sessionUUID: finalUUID }}
        >
          명예의 전당
        </Link>

        {/* 🔥 성향분석 → 항상 /rereport/:sessionUUID 로 이동 */}
        <Link
          to={`/rereport/${finalUUID}`}   // ← undefined도 그대로 들어감
          className="nav-item"
          state={{ sessionUUID: finalUUID }}
        >
          성향 분석
        </Link>

        <Link to="/challenge" className="nav-item">챌린지</Link>
        <Link to="/help" className="nav-item">도움말</Link>
      </div>
    </nav>
  );
}
