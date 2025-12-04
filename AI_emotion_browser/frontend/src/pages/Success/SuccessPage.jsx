import React from "react";
import "./SuccessPage.css";

export default function SuccessPage() {
  return (
    <div className="success-wrapper">
      <h1 className="success-title">🎉 당신은 위대한 웃음참기의 달인입니다! 🎉</h1>

      <hr className="success-divider" />

      <p className="success-sub">
        당신은 끝까지 웃음을 지켜냈고,
      </p>

      <p className="success-sub">
        무엇보다 <strong>당신의 소중한 초상권을 지켜내었습니다...!</strong>
      </p>


      <p className="success-sub2">
      인간승리, 멘탈의 힘, 그리고 표정근육의 단련… 
      </p>

      <p className="success-sub2">
        당신의 승리는 전 세계 웃음참기 역사에 깊게 기록될 것입니다.
      </p>

      <hr className="success-divider" />

      <button
        className="success-btn"
        onClick={() => (window.location.href = "/challenge")}
      >
        🔁 다시 도전하기
      </button>
      <button
        className="lauther-btn"
        onClick={() => (window.location.href = "/lauther")}
      >
        <h1>추천 웃긴영상 보러가기</h1>
      </button>
        
    </div>
  );
}
