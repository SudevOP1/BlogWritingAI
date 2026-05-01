import React, { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { PenSquare } from "lucide-react";

const SignupPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Connect to backend
    console.log("Signup:", { username, password });
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
              Username <span className="text-red-400">*</span>
            </label>
            <Input type="text" placeholder="johndoe" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Password <span className="text-red-400">*</span>
            </label>
            <Input type="password" placeholder="•••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <Button type="submit" className="w-full mt-6">
            Create Account
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
