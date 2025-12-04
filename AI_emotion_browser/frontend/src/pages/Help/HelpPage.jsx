import React from "react";
import "./HelpPage.css";

export default function HelpPage() {
  return (
    <div className="help-wrapper">
      <div className="help-card">

        <h1 className="help-title">도움말</h1>

        <section className="help-section">
          <h2 className="help-subtitle">🔧 만든 사람</h2>
          <ul className="help-list">
            <li><strong>문은서</strong> — 기획 / UI·UX 디자인 / 프론트/백엔드 개발</li>
            <li>김병국 — 테스트 및 피드백</li>
            <li>양새롬 — 테스트 및 피드백</li>
            <li>조현수 — 영상모델(파이썬) 코드 테스트 및 활용/프론트엔드</li>
            <li>김선아 — 테스트 및 피드백</li>
          </ul>
        </section>

        <section className="help-section">
          <h2 className="help-subtitle">🎮 게임 방법</h2>
          <ul className="help-list">
            <li>1. 홈 화면에서 <strong>“시작하기”</strong> 버튼을 누릅니다.</li>
            <li>2. 화면에 재생되는 영상 또는 이미지에 집중합니다.</li>
            <li>3. 웃음 감지 AI가 표정을 분석합니다.</li>
            <li>4. <strong>웃는 순간 즉시 게임 종료!</strong></li>
          </ul>
        </section>

      </div>
    </div>
  );
}
