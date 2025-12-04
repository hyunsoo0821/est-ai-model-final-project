/**
 * controllers/emotionController.js
 * --------------------------------------------
 * laugh(웃음 점수) 값을 반환하는 간단한 컨트롤러
 *    현재는 테스트용 랜덤값을 반환.
 *
 * - 프론트에서 실시간 감정 평가 시 사용됨
 * - 나중에 Python Flask/FastAPI 서버와 통신하는
 *   로직도 이 파일에서 처리예정
 * --------------------------------------------
 */


export const getEmotion = (req, res) => {
    const value = Number((Math.random() * 0.8 + 0.1).toFixed(3));
    res.json({ laugh: value });
  };
  