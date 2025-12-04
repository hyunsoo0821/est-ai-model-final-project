// NicknameModal.jsx
import React from "react";
import "../pages/Challenge/ChallengePage.css"; // 스타일을 그대로 공유한다면 그대로 import

export default function NicknameModal({ nickname, setNickname, onSubmit }) {
  return (
    <div className="nickname-modal">
      <div className="modal-box">
        <h2>닉네임을 입력해주세요</h2>
        
        <input
          type="text"
          className="nickname-input"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임"
        />

        <button className="modal-btn" onClick={onSubmit}>
          확인
        </button>
      </div>
    </div>
  );
}
