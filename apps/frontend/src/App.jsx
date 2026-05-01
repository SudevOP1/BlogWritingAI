import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import BrokenURL from "./pages/BrokenURL.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import BlogCreationPage from "./pages/BlogCreationPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import BlogDetailPage from "./pages/BlogDetailPage.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/create-blog" element={<BlogCreationPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/blog/:id" element={<BlogDetailPage />} />
        </Route>
        <Route path="*" element={<BrokenURL />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
