import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Send, Sparkles } from "lucide-react";
import { useAuthContext } from "../context/AuthContext";
import { useToastContext } from "../context/ToastContext";

const BlogCreationPage = () => {
  const { backendUrl, accessToken } = useAuthContext();
  const { addToast } = useToastContext();
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitRemainingSeconds, setRateLimitRemainingSeconds] = useState(null);

  const getReadableTime = (seconds) => {
    const totalSeconds = Math.max(0, Math.floor(seconds));

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m ${secs}s`;
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${backendUrl}/blogs/generate?topic=${encodeURIComponent(topic)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to generate blog");
      }
      const data = await res.json();

      // redirect to BlogDetailPage where progress is handled
      if (data.success) {
        navigate(`/blog/${data.blog_id}`);
      } else {
        if (data.status_code === 429) {
          setRateLimitRemainingSeconds(data.remaining_seconds);
          console.error("Rate limit exceeded, refreshes in", data.remaining_seconds);
          addToast("Rate limit exceeded", "red", 3);
          return;
        } else {
          console.error("Failed to generate blog:", data.error);
          throw new Error("Failed to generate blog");
        }
      }
    } catch (error) {
      console.error("Error generating blog:", error);
      addToast("Failed to generate blog", "red", 3);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (rateLimitRemainingSeconds === null) return;

    const interval = setInterval(() => {
      setRateLimitRemainingSeconds((prev) => {
        if (prev === null) {
          return null;
        }
        if (prev <= 1) {
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimitRemainingSeconds]);

  return (
    <div className="mx-10 min-h-[80vh] flex items-center justify-center">
      <div className="bg-surface rounded-3xl p-8 lg:p-12 border border-slate-800 space-y-8 relative overflow-hidden">
        <div className="text-center space-y-4 relative z-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-primary/20">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight sm:text-5xl">
            What shall we{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">write?</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md mx-auto">
            Enter a topic and our AI agent will research and draft a high-quality blog post for you.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <Input
              placeholder="The Future of Sustainable Energy in 2025"
              className="text-lg py-7 bg-slate-900/50 border-slate-700 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-inner rounded-2xl"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <Button
            type="submit"
            className="w-full py-7 text-lg font-bold rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition group"
            disabled={!topic || isLoading || rateLimitRemainingSeconds !== null}
            isLoading={isLoading}
          >
            {isLoading ? "Summoning AI Agent..." : "Start Generation"}
            {!isLoading && <Send className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition" />}
          </Button>
        </form>

        {rateLimitRemainingSeconds !== null && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-5 text-red-400 text-sm animate-in fade-in slide-in-from-top-2 relative z-10">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="font-bold text-red-300 uppercase tracking-wider">Rate Limit Exceeded</span>
            </div>
            <p className="text-slate-300">Try again in {getReadableTime(rateLimitRemainingSeconds)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogCreationPage;
