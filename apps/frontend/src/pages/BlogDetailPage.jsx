import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, MessageSquare, Bookmark, ArrowLeft, Share2, FileText, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Button from "../components/ui/Button";
import { useAuthContext } from "../context/AuthContext";
import { useToastContext } from "../context/ToastContext";
import Loader from "../components/ui/Loader";

const steps = [
  { id: "router", label: "Analyzing Topic" },
  { id: "research", label: "Researching Topic" },
  { id: "orchestrator", label: "Creating Outline" },
  { id: "worker", label: "Drafting Sections" },
  { id: "reducer", label: "Finalizing Content" },
];

const BlogDetailPage = () => {
  const { blogId } = useParams();
  const { backendUrl } = useAuthContext();
  const [blog, setBlog] = useState(null);
  const [authorUsername, setAuthorUsername] = useState(null);
  const [isAuthorLoading, setIsAuthorLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState("idle");

  const { addToast } = useToastContext();
  const navigate = useNavigate();

  // websocket connection to get blog updates
  useEffect(() => {
    let ws = null;
    let isMounted = true;

    const connectToBlog = () => {
      const wsUrl = backendUrl.replace(/^http/, "ws") + `/blogs/${blogId}`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        if (!isMounted) return;
        const data = JSON.parse(event.data);

        if (data.type === "error") {
          setError(data.error);
          addToast(data.error, "error", 5);
          setIsEditing(false);
          return;
        }

        if (data.type === "blog") {
          setBlog(data.blog);
          setIsEditing(false);

          // Update current step based on status
          if (data.blog.status && data.blog.status.startsWith("processing: ")) {
            const node = data.blog.status.replace("processing: ", "");
            setCurrentStep(node);
          } else if (data.blog.status === "completed") {
            setCurrentStep("done");
          } else if (data.blog.status === "failed") {
            setCurrentStep("idle");
          }
        }

        if (data.blog?.is_generated) {
          ws.close();
        }
      };

      ws.onerror = (err) => {
        if (!isMounted) {
          return;
        }
        console.error("WebSocket error:", err);
        addToast("Failed to connect to the blog service.", "error", 5);
        setError("Failed to connect to the blog service.");
        setIsEditing(false);
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
      };
    };

    connectToBlog();

    return () => {
      isMounted = false;
      if (ws) {
        ws.close();
      }
    };
  }, [blogId, backendUrl, addToast]);

  // fetch author username
  useEffect(() => {
    const fetchAuthorUsername = async () => {
      if (!blog?.author_id) {
        return;
      }
      setIsAuthorLoading(true);
      try {
        const res = await fetch(`${backendUrl}/users/${blog.author_id}`);
        if (!res.ok) throw new Error("Failed to fetch author");
        const data = await res.json();
        if (data.success) setAuthorUsername(data.user.username);
      } catch (error) {
        console.error("Error fetching author:", error);
        addToast("Failed to load author", "error", 3);
      } finally {
        setIsAuthorLoading(false);
      }
    };

    fetchAuthorUsername();
  }, [blog]);

  if (isEditing) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Loader className="w-8 h-8 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)] text-center px-4">
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Blog</h2>
          <p className="text-slate-400">{error}</p>
          <Link to="/" className="mt-6 inline-block text-primary hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!blog) return <div className="text-center py-20">Blog not found</div>;

  // Show generating UI if not finished
  if (!blog.is_generated) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
        <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feed
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Panel: Progress */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="bg-surface rounded-xl p-6 border border-slate-800 shadow-xl">
              <h2 className="text-2xl font-semibold mb-2">Generating Blog</h2>
              <p className="text-slate-400 mb-6">AI is crafting your masterpiece. This might take a minute.</p>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Topic</label>
                <p className="text-white font-medium bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">{blog.topic}</p>
              </div>
            </div>

            {/* Progress Indicators */}
            <div className="bg-surface rounded-xl p-6 border border-slate-800 shadow-xl">
              <h3 className="font-semibold mb-4 text-lg">Generation Progress</h3>
              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const stepIndex = steps.findIndex((s) => s.id === currentStep);
                  const isPast = stepIndex > idx || currentStep === "done";
                  const isCurrent = step.id === currentStep;

                  return (
                    <div key={step.id} className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                        ${
                          isPast
                            ? "border-green-500 bg-green-500/10"
                            : isCurrent
                              ? "border-primary bg-primary/10"
                              : "border-slate-700"
                        }`}
                      >
                        {isPast ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : isCurrent ? (
                          <Loader className="w-4 h-4" />
                        ) : (
                          <span className="text-slate-500 text-sm">{idx + 1}</span>
                        )}
                      </div>
                      <span className={`text-sm ${isPast || isCurrent ? "text-slate-200" : "text-slate-500"}`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel: Content Preview */}
          <div className="w-full lg:w-2/3 flex flex-col bg-surface/50 rounded-xl border border-slate-800 overflow-hidden min-h-[500px]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-surface/80">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-medium">Live Preview</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-slate-900/30">
              {blog.content ? (
                <article className="markdown-body max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{blog.content}</ReactMarkdown>
                </article>
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-500 space-y-4">
                  <Loader className="w-12 h-12 text-primary/20" />
                  <p className="animate-pulse">Waking up the AI writers...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal return for generated blog
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-7">
      <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white transition-colors group">
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-2 group-hover:scale-130 transition" />
        Back to Feed
      </Link>

      <article className="flex flex-col gap-5">
        <header className="flex flex-col gap-8">
          {/* title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">{blog.title}</h1>

          {/* author details */}
          <div className="flex flex-row gap-4 items-center">
            <div
              className="flex flex-row gap-4 items-center cursor-pointer"
              onClick={() => authorUsername && navigate(`/user/${blog.author_id}`)}
            >
              {isAuthorLoading ? (
                <div className="flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-slate-800" />
                  <div className="h-5 bg-slate-800 rounded-md w-24" />
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-lg border border-primary/10">
                    {authorUsername?.[0]?.toUpperCase() || "A"}
                  </div>
                  <span className="text-primary text-xl font-medium">{authorUsername}</span>
                </div>
              )}
            </div>
            <p className="text-slate-500 text-md">{new Date(blog.created_at).toLocaleDateString()}</p>
          </div>

          {/* like, comment, bookmark, share buttons */}
          <div className="flex items-center justify-between border-y border-slate-800 py-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="">
                <Heart className={`w-5 h-5 mr-2`} />
                {/* {likesCount} */}
              </Button>
              <Button variant="ghost" size="sm">
                <MessageSquare className="w-5 h-5 mr-2" />
                {/* {blog.comments_count} */}
              </Button>
              <Button variant="ghost" size="sm">
                <Bookmark className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* content */}
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{blog.content?.replace(/^\s*#\s+.*?(\r\n|\n|$)/, "")}</ReactMarkdown>
        </div>
      </article>

      {/* comments section */}
      <section className="pt-8 border-t border-slate-800">
        <h3 className="text-2xl font-bold mb-6">Comments ({blog.comments_count || 0})</h3>
        <div className="bg-surface rounded-lg p-6 text-center text-slate-500">Comments feature coming soon.</div>
      </section>
    </div>
  );
};

export default BlogDetailPage;
