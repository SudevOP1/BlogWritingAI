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
  const backendUrl = "http://127.0.0.1:8000";
  const navigate = useNavigate();
  const { addToast } = useToastContext();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          // Token expired, clear it
          localStorage.removeItem("accessToken");
          setAccessToken(null);
          setUser(null);
        } else {
          setAccessToken(token);
          setUser(decoded);
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        localStorage.removeItem("accessToken");
      }
    }
    setLoading(false);
  }, []);

  const signupUser = async (username = "", password = "") => {
    setLoading(true);

    try {
      const response = await fetch(backendUrl + "/auth/signup", {
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
        addToast("Signup successful! Please login to continue.", "green", 5);
        navigate("/login");
      } else {
        addToast("Signup failed: " + (data.error || "invalid credentials"), "red", 5);
      }
    } catch (error) {
      console.error("/auth/signup error:", error);
      addToast("Something went wrong. please try again", "red", 5);
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (username = "", password = "", navigateTo = "/") => {
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
        setUsername(username);
        localStorage.setItem("accessToken", token);
        localStorage.setItem("username", username);

        addToast(`Login successful, Welcome ${decoded.username}`, "green", 4);
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
    setUsername(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("username");

    addToast("Logged out!", "green", 3);
    navigate("/login");
  };

  const contextData = {
    user: user,
    username: username,
    backendUrl: backendUrl,
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
