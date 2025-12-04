import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ padding: 40 }}>
      <h1>메인 페이지</h1>
      <p>AI 웃음 분석 리포트 보러가기</p>

      <Link
        to="/report"
        style={{
          display: "inline-block",
          padding: "12px 20px",
          background: "#6C5CE7",
          color: "#fff",
          borderRadius: 8,
          marginTop: 20,
          textDecoration: "none",
        }}
      >
        리포트 보기
      </Link>
    </div>
  );
}
