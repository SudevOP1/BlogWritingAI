import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import BrokenURL from "./pages/BrokenURL.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import BlogDetailPage from "./pages/BlogDetailPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import BlogCreationPage from "./pages/BlogCreationPage.jsx";
import FeedPage from "./pages/FeedPage.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route    path="/"                    element={<Layout />}>
              <Route  index                       element={<LandingPage />} />
              <Route  path="/login"               element={<LoginPage />} />
              <Route  path="/signup"              element={<SignupPage />} />
              <Route  path="/blog/:blogId"        element={<BlogDetailPage />} />
              <Route  path="/user/:userId"        element={<ProfilePage />} />
              <Route  path="/create-blog"         element={<ProtectedRoute><BlogCreationPage /></ProtectedRoute>} />
              <Route  path="/feed"                element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
              <Route  path="*"                    element={<BrokenURL />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
