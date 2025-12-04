// React 컴포넌트 내부
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

const LaughChallenge = () => {
    const webcamRef = useRef(null);
    const [gauge, setGauge] = useState(0); // 웃음 게이지 (0~100)
    const [model, setModel] = useState(null);

    // 1. MediaPipe 모델 로드 (초기 1회)
    useEffect(() => {
        const loadModel = async () => {
            const loadedModel = await faceLandmarksDetection.load(
                faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
                { maxFaces: 1 }
            );
            setModel(loadedModel);
            console.log("FaceMesh Model Loaded");
        };
        loadModel();
    }, []);

    // 2. 실시간 감지 루프
    useEffect(() => {
        const detect = async () => {
            if (
                typeof webcamRef.current !== "undefined" &&
                webcamRef.current !== null &&
                webcamRef.current.video.readyState === 4 &&
                model
            ) {
                const video = webcamRef.current.video;
                const predictions = await model.estimateFaces({ input: video });

                if (predictions.length > 0) {
                    const mesh = predictions[0].scaledMesh;

                    // MediaPipe FaceMesh 랜드마크 인덱스
                    // 윗입술: 13, 아랫입술: 14, 입꼬리 좌: 61, 입꼬리 우: 291
                    const topLip = mesh[13];
                    const bottomLip = mesh[14];
                    const leftCorner = mesh[61];
                    const rightCorner = mesh[291];

                    // 입 높이 및 너비 계산
                    const mouthHeight = Math.abs(topLip[1] - bottomLip[1]);
                    const mouthWidth = Math.abs(leftCorner[0] - rightCorner[0]);

                    // MAR (Mouth Aspect Ratio) - 웃으면 높이가 커지거나 너비가 넓어짐
                    const mar = mouthHeight / mouthWidth;

                    // 웃음 임계값 로직 (튜닝 필요)
                    // 보통 무표정일 때 0.1~0.2, 웃으면 0.4~0.5 이상
                    let score = 0;
                    if (mar > 0.3) {
                        // 0.3 ~ 0.6 사이를 0~100%로 매핑
                        score = Math.min(100, Math.max(0, (mar - 0.3) * 333));
                    }

                    setGauge(score);

                    // *중요* 여기서 서버(Python)로 API를 쏘거나, 
                    // 100%가 되면 "탈락" 처리하는 로직을 추가하면 됩니다.
                    if (score > 80) {
                        console.log("웃음 감지! 탈락 위험!");
                    }
                }
            }
        };

        const intervalId = setInterval(detect, 100); // 0.1초마다 감지
        return () => clearInterval(intervalId);
    }, [model]);

    return (
        <div>
            <Webcam
                ref={webcamRef}
                style={{ width: 640, height: 480 }}
            />
            {/* 게이지 바 UI */}
            <div style={{ width: '640px', height: '20px', backgroundColor: '#ddd', marginTop: '10px' }}>
                <div
                    style={{
                        height: '100%',
                        width: `${gauge}%`,
                        backgroundColor: gauge > 80 ? 'red' : 'green',
                        transition: 'width 0.1s ease-out'
                    }}
                />
            </div>
            <h3>웃음 강도: {Math.round(gauge)}%</h3>
        </div>
    );
};

export default LaughChallenge;