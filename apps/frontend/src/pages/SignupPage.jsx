import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Eye, EyeOff, PenSquare } from "lucide-react";
import { useAuthContext } from "../context/AuthContext";

const SignupPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const { accessToken, signupUser, loading } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (accessToken) {
      navigate("/dashboard");
    }
  }, [accessToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signupUser(username, displayName, password, "/login");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="w-full max-w-md bg-surface border border-slate-800 rounded-xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary p-2 rounded-xl mb-4">
            <PenSquare className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create an account</h2>
          <p className="text-slate-400 mt-2">Start generating amazing blogs today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Name <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              placeholder="John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Username <span className="text-red-400">*</span>
            </label>
            <Input type="text" placeholder="johndoe" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Input
                type={passwordVisible ? "text" : "password"}
                placeholder="•••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {passwordVisible ? (
                <EyeOff
                  className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                />
              ) : (
                <Eye
                  className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                />
              )}
            </div>
          </div>

          <Button type="submit" className="w-full mt-6" isLoading={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-slate-400 mt-6 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:text-primary-hover font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
