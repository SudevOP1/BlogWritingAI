import { useAuthContext } from "../context/AuthContext.jsx";
import HomePage from "./HomePage.jsx";
import LandingPage from "./LandingPage.jsx";

const MainPage = () => {
  const { accessToken } = useAuthContext();

  if (accessToken) {
    return <HomePage />;
  } else {
    return <LandingPage />;
  }
};

export default MainPage;
