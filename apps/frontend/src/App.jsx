import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

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
      <AuthProvider>
        <Routes>
          <Route    path="/"              element={<Layout />}>
            <Route  index                 element={<LandingPage />} />
            <Route  path="/login"         element={<LoginPage />} />
            <Route  path="/signup"        element={<SignupPage />} />
            <Route  path="/create-blog"   element={<ProtectedRoute><BlogCreationPage /></ProtectedRoute>} />
            <Route  path="/dashboard"     element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route  path="/blog/:id"      element={<ProtectedRoute><BlogDetailPage /></ProtectedRoute>} />
          </Route>
          <Route    path="*"              element={<BrokenURL />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
