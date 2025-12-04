import { BrowserRouter, Routes, Route } from "react-router-dom";

import NavigationBar from "./components/NavigationBar";
import HomePage from "./pages/Home/HomePage";
import HelpPage from "./pages/Help/HelpPage";
import ChallengePage from "./pages/Challenge/ChallengePage";
import SuccessPage from "./pages/Success/SuccessPage";
import FailPage from "./pages/Fail/FailPage";
import DecoratePage from "./pages/Decorate/DecoratePage";
import LeaderBoard from "./pages/LeaderBoard/LeaderBoard";
import LeaderBoard1 from "./pages/LeaderBoard/LeaderBoard1";

import LaughterFinalReport from "./pages/MBTI/LaughterFinalReport"
import Recommend from "./pages/video/RecommendedVideos"

import Lauther from "./pages/video/Lauther";
import Report from "./pages/MBTI/LautherReport.jsx"

export default function App() {
  return (
    <BrowserRouter>
      <NavigationBar />

      {/* 전체 페이지에 네비바 아래 여백 확보 */}
      <div style={{ paddingTop: "64px" }}>
        <Routes>
          {/* 기본 페이지 */}
          <Route path="/" element={<HomePage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/challenge" element={<ChallengePage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/fail" element={<FailPage />} />
          <Route path="/decorate" element={<DecoratePage />} />
          <Route path="/leaderboard" element={<LeaderBoard />} />
          <Route path="/leaderboard1" element={<LeaderBoard1 />} />
          <Route path="/recommend/:sessionUUID" element={<Recommend />} />
          <Route path="/rereport/:sessionUUID" element={<LaughterFinalReport />} />
          <Route path="/report" element={<Report />} />
        

          {/* 비디오 관련 */}
          <Route path="/lauther" element={<Lauther />} />

        </Routes>
      </div>
    </BrowserRouter>
  );
}
