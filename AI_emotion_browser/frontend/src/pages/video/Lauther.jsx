
import './Lauther.css';

const videoList = [
  {
    id: 1,
    title: "한번에 제압하는 강형욱😱ㄷㄷ #강형욱 #개는훌륭하다 #shorts",
    channel: "KBS Entertain",
    link: "https://www.youtube.com/watch?v=h7GLO4XzuR4"
  },
  {
    id: 2,
    title: "나도 고기 주세요!” 😂 검은 댕댕이의 배신감 폭발 순간 🐾 | 웃긴 강아지 영상",
    channel: "또세상",
    link: "https://www.youtube.com/watch?v=pg9y0OUx3yI"
  },
  {
    id: 3,
    title: "숟가락을보고 화가난 강아지, 이유가 귀여움 폭발! #FunnyDog #CuteDogReaction",
    channel: "미소아라TT",
    link: "https://www.youtube.com/watch?v=h_IssI_qIGc"
  },
  {
    id: 4,
    title: "짖는 소리 조절 가능한 강아지ㅋㅋㅋ",
    channel: "SBS TV동물농장x애니멀봐",
    link: "https://www.youtube.com/watch?v=0QRiOw86ExI"
  },
  {
    id: 5,
    title: "주인의 수박 장난에 삐진 강아지🤣",
    channel: "애니멀봐유",
    link: "https://www.youtube.com/watch?v=TpOd21PjJYQ"
  }
];

const RecommendedVideos = () => {
  return (
    <div className="recommendation-container">
      <div className="header-box">
        <h2 className="title">🎉 추천 영상 목록</h2>
        <span className="subtitle">(키워드: 웃긴 강아지 폭발 반응, 총 {videoList.length}개)</span>
      </div>
      
      <ul className="video-list">
        {videoList.map((video, index) => (
          <li key={video.id} className="video-card">
            <div className="video-number">{index + 1}</div>
            <div className="video-info">
              <a 
                href={video.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="video-title"
              >
                {video.title}
              </a>
              <p className="video-channel">📺 채널: {video.channel}</p>
            </div>
            <a 
              href={video.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="play-button"
            >
              재생 ▶
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecommendedVideos;