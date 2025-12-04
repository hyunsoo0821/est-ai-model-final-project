export default function FingerGuide() {
    return (
      <div className="finger-overlay">
        <div
          className="finger-popup"
          style={{
            top: "12px",   // 브라우저 바 기준
            left: "50px",  // 카메라 아이콘 근처
          }}
        >
          <span className="finger-emoji">👆</span>
          <p>여기에서 “허용”을 눌러주세요!</p>
        </div>
      </div>
    );
  }
  