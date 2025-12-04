import { useEffect } from "react";
import "./HomePage.css";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-wrapper">
      <div className="home-card">

        <h1 className="home-title">웃참 챌린지</h1>

        <div className="home-buttons">
          <button className="game-btn primary" onClick={() => navigate("/challenge")}>
            시작하기 ▶
          </button>
          <button className="game-btn secondary" onClick={() => navigate("/help")}>
            도움말 ❔
          </button>
        </div>

      </div>
    </div>
  );
}
