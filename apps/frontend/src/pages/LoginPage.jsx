import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { PenSquare } from "lucide-react";
import { useAuthContext } from "../context/AuthContext";

const LoginPage = () => {
  const [username, setusername] = useState("");
  const [password, setPassword] = useState("");

  const { accessToken, loginUser, loading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (accessToken) {
      navigate(location.state?.from || "/feed");
    }
  }, [accessToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await loginUser(username, password, location.state?.from || "/feed");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="w-full max-w-md bg-surface border border-slate-800 rounded-xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary p-2 rounded-xl mb-4">
            <PenSquare className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome back</h2>
          <p className="text-slate-400 mt-2">Login to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Username <span className="text-red-400">*</span>
            </label>
            <Input type="text" placeholder="Username" value={username} onChange={(e) => setusername(e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Password <span className="text-red-400">*</span>
            </label>
            <Input type="password" placeholder="•••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <Button type="submit" className="w-full mt-6" isLoading={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-slate-400 mt-6 text-sm">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:text-primary-hover font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
