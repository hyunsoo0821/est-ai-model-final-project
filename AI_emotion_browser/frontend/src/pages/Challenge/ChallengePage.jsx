import React, { useEffect, useRef, useState } from "react";
import "./ChallengePage.css";
import NicknameModal from "../../components/NicknameModal.jsx";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

export default function ChallengePage() {
  const navigate = useNavigate();

  /* ----------------------------🧩 STATE ---------------------------- */
  const [step, setStep] = useState("nickname"); 
  const [nickname, setNickname] = useState("");
  const [timer, setTimer] = useState(180);
  const [hearts, setHearts] = useState(4);
  const [capturedImages, setCapturedImages] = useState([]);

  const sessionUUID = useRef(uuidv4()).current;

  /* ----------------------------🧩 REF ---------------------------- */
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const iframeRef = useRef(null);

  const isProcessingRef = useRef(false);
  const laughCooldownRef = useRef(false);
  const iframePlayedRef = useRef(false);

  const startTSRef = useRef(null);

  /* ----------------------------📸 업로드 ---------------------------- */
  async function uploadCapturedImages() {
    if (capturedImages.length === 0) return [];
  
    const formData = new FormData();
    formData.append("session_uuid", sessionUUID);
  
    for (let i = 0; i < capturedImages.length; i++) {
      const blob = await (await fetch(capturedImages[i])).blob();
      formData.append("photos", blob, `capture_${i}.jpg`);
    }
  
    try {
      const res = await fetch("http://localhost:5001/photos", {
        method: "POST",
        body: formData,
      });
  
      const data = await res.json();
      console.log("📤 업로드 완료:", data);
  
      return data.urls;
    } catch (err) {
      console.error("🚨 이미지 업로드 실패:", err);
      return [];
    }
  }
  
  /* ----------------------------🔥 실시간 분석 ---------------------------- */
  async function sendFrameToPython() {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      if (laughCooldownRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d");
      canvas.width = 640;
      canvas.height = 640;
      ctx.drawImage(video, 0, 0, 640, 640);

      const base64 = canvas.toDataURL("image/jpeg");

      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) return;

      const data = await res.json();

      if (data.emotion !== "laugh") return;

      // cooldown ON
      laughCooldownRef.current = true;
      setTimeout(() => (laughCooldownRef.current = false), 600);

      /* ----------------------------⭐ 핵심 변경 ----------------------------
         setHearts는 순수 상태 업데이트만 한다.
         그리고 "이 시점에서 base64와 timestamp를 별도 ref에 저장"한다.
      --------------------------------------------------------------------*/
      lastEventDataRef.current = {
        base64,
        detectedTime: Math.floor((Date.now() - startTSRef.current) / 1000)
      };

      setHearts((prev) => prev - 1);

      // 캡처 저장 (side effect X)
      setCapturedImages((prev) =>
        prev.length < 4 ? [...prev, base64] : prev
      );

    } catch (err) {
      console.error("❌ 처리 오류:", err);
    } finally {
      isProcessingRef.current = false;
    }
  }

  /* ⭐ laugh 이벤트 정보 저장용 ref */
  const lastEventDataRef = useRef(null);


  /* ----------------------------🔥 laugh-event POST를 여기로 분리 ---------------------------- */
  useEffect(() => {
    if (step !== "running") return;
    if (hearts >= 4) return; // 초기값 4 → 감지 시점 3, 2, 1, 0 에만 실행

    const eventIndex = 4 - hearts;
    const eventData = lastEventDataRef.current;
    if (!eventData) return;

    const { detectedTime } = eventData;

    console.log("🎯 laugh-event POST 실행!", eventIndex, detectedTime);

    fetch("http://localhost:5001/laugh-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_uuid: sessionUUID,
        nickname,
        event_index: eventIndex,
        detected_time: detectedTime,
        start_time: Math.max(detectedTime - 1, 0),
        end_time: detectedTime + 1,
      }),
    });

    if (hearts === 0) {
      setStep("upload-fail");
    }
  }, [hearts]);

  /* ----------------------------🎥 웹캠 ---------------------------- */
  async function startWebcam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("웹캠 오류:", err);
    }
  }

  /* ----------------------------▶ 시작 버튼 ---------------------------- */
  const handleNicknameSubmit = () => {
    if (nickname.trim().length > 0) setStep("start");
  };

  const handleStartChallenge = () => {
    startTSRef.current = Date.now();
    setStep("running");

    setTimeout(() => {
      if (iframeRef.current && !iframePlayedRef.current) {
        iframePlayedRef.current = true;
        iframeRef.current.src =
          "https://www.youtube.com/embed/kRGYSo4fV2M?autoplay=1&controls=0&modestbranding=1&rel=0";
      }
    }, 200);
  };

  /* ----------------------------⏱ EFFECT ---------------------------- */
  useEffect(() => {
    if (step === "running") startWebcam();
  }, [step]);

  // 타이머 0초 → success
  useEffect(() => {
    if (step !== "running") return;

    if (timer <= 0) {
      setStep("upload-success");
      return;
    }

    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  // 200ms 루프
  useEffect(() => {
    if (step !== "running") return;

    const loop = setInterval(sendFrameToPython, 200);
    return () => clearInterval(loop);
  }, [step]);

  /* ----------------------------📤 업로드 단계 처리 ---------------------------- */
  useEffect(() => {
    if (!step.startsWith("upload")) return;
  
    async function finalize() {
      const uploaded = await uploadCapturedImages();
  
      fetch(`http://localhost:5001/finish/${sessionUUID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: uploaded }),
      }).catch(err => console.error("finishSession error:", err));
  
      if (step === "upload-success") {
        navigate("/success", { state: { nickname, images: uploaded } });
      } else if (step === "upload-fail") {
        navigate("/fail", { state: { nickname, images: uploaded, sessionUUID }} );
      }
    }
  
    finalize();
  }, [step]);

  /* ----------------------------🖥 UI ---------------------------- */
  const minutes = String(Math.floor(timer / 60)).padStart(2, "0");
  const seconds = String(timer % 60).padStart(2, "0");

  return (
    <div className="challenge-wrapper">
      {step === "nickname" && <div className="blur-layer" />}

      {step === "nickname" && (
        <NicknameModal
          nickname={nickname}
          setNickname={setNickname}
          onSubmit={handleNicknameSubmit}
        />
      )}

      <div className="challenge-content">
        {step === "start" && (
          <div className="start-overlay">
            <button
              className="start-challenge-btn"
              onClick={handleStartChallenge}
            >
              챌린지 시작하기
            </button>
          </div>
        )}

        {step === "running" && (
          <>
            <div className="left-section">
              <div className="timer-container">
                <div className="timer-title">⏱ 타이머</div>
                <div className="timer-value">
                  {minutes}:{seconds}
                </div>
              </div>

              <div className="heart-container">
                {Array.from({ length: hearts }).map((_, i) => (
                  <span key={i} className="heart">
                    ❤️
                  </span>
                ))}
              </div>

              <div className="webcam-box">
                <video ref={videoRef} autoPlay muted playsInline />
              </div>
            </div>

            <div className="right-section">
              <iframe
                ref={iframeRef}
                className="youtube-frame"
                src="https://www.youtube.com/embed/kRGYSo4fV2M?controls=0&modestbranding=1&rel=0&mute=1"
                title="challenge-video"
                allow="autoplay; encrypted-media"
              />
            </div>

            <canvas ref={canvasRef} style={{ display: "none" }} />
          </>
        )}
      </div>
    </div>
  );
}
