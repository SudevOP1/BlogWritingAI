import { useState, createContext, useContext, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { useToastContext } from "./ToastContext.jsx";

const AuthContext = createContext();

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const backendUrl = window.location.hostname === "localhost" ? "http://127.0.0.1:8000" : "https://blogwritingai.onrender.com";
  const frontendUrl =
    window.location.hostname === "localhost" ? "http://127.0.0.1:8000" : "https://sudevop1.github.io/BlogWritingAI";
  const navigate = useNavigate();
  const { addToast } = useToastContext();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [displayName, setDisplayName] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUserId = localStorage.getItem("userId");
    const storedUsername = localStorage.getItem("username");
    const storedDisplayName = localStorage.getItem("displayName");

    if (token) {
      try {
        const decoded = jwtDecode(token);

        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          // Token expired, clear it
          localStorage.removeItem("accessToken");
          localStorage.removeItem("username");
          localStorage.removeItem("userId");
          localStorage.removeItem("displayName");
          setAccessToken(null);
          setUser(null);
          setUserId(null);
          setUsername(null);
          setDisplayName(null);
        } else {
          setAccessToken(token);
          setUser(decoded);
          if (storedUsername) {
            setUsername(storedUsername);
          }
          if (storedUserId) {
            setUserId(storedUserId);
          }
          if (storedDisplayName) {
            setDisplayName(storedDisplayName);
          }
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        localStorage.removeItem("displayName");
      }
    }
    setLoading(false);
  }, []);

  const signupUser = async (username = "", displayName = "", password = "") => {
    setLoading(true);

    try {
      const response = await fetch(backendUrl + "/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          display_name: displayName,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addToast("Signup successful! Please login to continue.", "green", 5);
        navigate("/login");
      } else {
        addToast("Signup failed: " + data.error, "red", 5);
      }
    } catch (error) {
      console.error("/auth/signup error:", error);
      addToast("Something went wrong. please try again", "red", 5);
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (username = "", password = "", navigateTo = "/feed") => {
    setLoading(true);

    try {
      const response = await fetch(backendUrl + "/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const token = data.access_token;
        const decoded = jwtDecode(token);

        setAccessToken(token);
        setUser(decoded);
        setUserId(data.id);
        setUsername(username);
        setDisplayName(data.display_name);

        localStorage.setItem("accessToken", token);
        localStorage.setItem("userId", data.id);
        localStorage.setItem("username", username);
        localStorage.setItem("displayName", data.display_name);

        addToast(`Login successful, Welcome ${data.display_name}`, "green", 4);
        navigate(navigateTo);
      } else {
        addToast("Login failed: " + (data.error || "invalid credentials"), "red", 5);
      }
    } catch (error) {
      console.error("/auth/login error:", error);
      addToast("Something went wrong. please try again", "red", 5);
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    setAccessToken(null);
    setUser(null);
    setUserId(null);
    setUsername(null);
    setDisplayName(null);

    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("displayName");

    addToast("Logged out!", "green", 3);
    navigate("/login");
  };

  const contextData = {
    user: user,
    userId: userId,
    username: username,
    displayName: displayName,
    backendUrl: backendUrl,
    frontendUrl: frontendUrl,
    accessToken: accessToken,
    signupUser: signupUser,
    loginUser: loginUser,
    logoutUser: logoutUser,
    loading: loading,
  };

  return (
    <AuthContext.Provider value={contextData}>
      {loading ? (
        <div className="flex justify-center items-center h-screen bg-gray-950">
          <p className="text-lg text-gray-400">Loading...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export default AuthContext;
