import "./App.css";
import {
  BrowserRouter as Router,
  Navigate,
  Routes,
  Route,
  useSearchParams,
} from "react-router-dom";
import { useContext } from "react";

import LandingPage from "./Pages/landing";
import MeetingHome from "./Pages/MeetingHome";
import Authentication from "./Pages/authentication";
import AuthContext, { AuthProvider } from "./Contexts/AuthContext";
import VideoMeetComponent from "./Pages/VideoMeet";

function MeetingHomeRoute() {
  const { userData } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const isGuest = searchParams.get("guest") === "true";

  if (!userData && !isGuest) {
    return <Navigate to="/auth?mode=register" replace />;
  }

  return <MeetingHome />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/welcome" element={<LandingPage />} />
          <Route path="/auth" element={<Authentication />} />
          <Route path="/home" element={<MeetingHomeRoute />} />
          <Route path="/:url" element={<VideoMeetComponent />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;