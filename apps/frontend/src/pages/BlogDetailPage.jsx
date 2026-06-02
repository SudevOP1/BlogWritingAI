import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, MessageSquare, Bookmark, ArrowLeft, Share2, FileText, CheckCircle2, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useAuthContext } from "../context/AuthContext.jsx";
import { useToastContext } from "../context/ToastContext.jsx";
import Button from "../components/ui/Button.jsx";
import Loader from "../components/ui/Loader.jsx";
import CommentsSection from "../components/CommentsSection.jsx";

const steps = [
  { id: "router", label: "Analyzing Topic" },
  { id: "research", label: "Researching Topic" },
  { id: "orchestrator", label: "Creating Outline" },
  { id: "worker", label: "Drafting Sections" },
  { id: "reducer", label: "Finalizing Content" },
];

const BlogDetailPage = () => {
  const { blogId } = useParams();
  const { backendUrl, accessToken, username } = useAuthContext();
  const { addToast } = useToastContext();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [isEditing, setIsEditing] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState("idle");
  const [showCompletionUI, setShowCompletionUI] = useState(false);

  const [authorUsername, setAuthorUsername] = useState(null);
  const [isAuthorLoading, setIsAuthorLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isLikesLoading, setIsLikesLoading] = useState(true);

  const handleBlogLike = async () => {
    if (!accessToken) {
      addToast("Please login to like the blog", "red", 3);
      navigate("/login", { state: { from: `/blogs/${blogId}` } });
      return;
    }

    // Optimistic update
    const oldIsLiked = isLiked;
    const oldLikes = blog.num_likes;
    setIsLiked(!oldIsLiked);
    setBlog((prev) => ({ ...prev, num_likes: oldIsLiked ? prev.num_likes - 1 : prev.num_likes + 1 }));

    try {
      const res = await fetch(`${backendUrl}/community/blogs/${blogId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to like");
      }
      const data = await res.json();
      if (!data.success) {
        console.error("Backend validation failed:", data.error);
        throw new Error("Failed to like");
      }
    } catch (error) {
      console.error("Error liking blog:", error);
      addToast("Failed to like blog", "red", 3);
      // Rollback
      setIsLiked(oldIsLiked);
      setBlog((prev) => ({ ...prev, num_likes: oldLikes }));
    }
  };

  const fetchIsLiked = async () => {
    if (!blog?.id) {
      return;
    }

    if (!accessToken) {
      setIsLiked(false);
      setIsLikesLoading(false);
      return;
    }

    setIsLikesLoading(true);
    try {
      const res = await fetch(`${backendUrl}/community/blogs/${blog.id}/is_liked`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to check like status");
      }
      const data = await res.json();
      if (!data.success) {
        console.error("Backend validation failed:", data.error);
        throw new Error("Failed to check like status");
      }
      setIsLiked(data.liked);
    } catch (error) {
      console.error("Error checking like status:", error);
      addToast("Failed to check like status", "red", 3);
    } finally {
      setIsLikesLoading(false);
    }
  };

  const fetchAuthorUsername = async () => {
    if (!blog?.author_id) {
      return;
    }
    setIsAuthorLoading(true);
    try {
      const res = await fetch(`${backendUrl}/users/${blog.author_id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch author");
      }
      const data = await res.json();
      if (data.success) {
        setAuthorUsername(data.user.username);
      } else {
        console.error("Backend validation failed:", data.error);
        throw new Error("Failed to fetch author");
      }
    } catch (error) {
      console.error("Error fetching author:", error);
      addToast("Failed to load author", "red", 3);
    } finally {
      setIsAuthorLoading(false);
    }
  };

  // websocket connection to get blog updates
  useEffect(() => {
    let ws = null;
    let isMounted = true;
    let hasFailed = false;

    const connectToBlog = () => {
      const wsUrl = backendUrl.replace(/^http/, "ws") + `/blogs/${blogId}`;
      ws = new WebSocket(wsUrl);
      let isFirstMessage = true;

      ws.onmessage = (event) => {
        if (!isMounted) {
          return;
        }
        const data = JSON.parse(event.data);

        if (data.type === "error") {
          hasFailed = true;
          setError(data.error);
          addToast(data.error, "red", 5);
          setIsEditing(false);
          ws.close();
          return;
        }

        if (data.type === "blog") {
          console.log(data.blog);
          setBlog(data.blog);
          setIsEditing(false);

          const status = data.blog?.status || "";
          const wasAlreadyDone = isFirstMessage && (status === "completed" || status === "failed");
          isFirstMessage = false;

          // Update current step based on status
          if (status.startsWith("processing: ")) {
            const node = status.replace("processing: ", "");
            setCurrentStep(node);
          } else if (status === "completed") {
            setCurrentStep("done");
            setIsEditing(false);
            // Only show completion UI if this is a live transition, not a reload
            if (!wasAlreadyDone) {
              setShowCompletionUI(true);
              setTimeout(() => {
                if (isMounted) setShowCompletionUI(false);
              }, 3000);
            }
          } else if (status === "failed") {
            setCurrentStep("failed");
            setIsEditing(false);
            // Only show failure UI if this is a live transition, not a reload
            if (!wasAlreadyDone) {
              setShowCompletionUI(true);
              setTimeout(() => {
                if (isMounted) setShowCompletionUI(false);
              }, 3000);
            }
          }
        }

        if (data.blog?.status === "completed" || data.blog?.status === "failed") {
          ws.close();
        }
      };

      ws.onerror = (err) => {
        if (!isMounted || hasFailed) {
          return;
        }

        console.error("WebSocket error:", err);
        hasFailed = true;
        addToast("Failed to connect to the blog service.", "red", 5);
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
  }, [blogId, backendUrl]);

  // fetch authorUsername, isLiked
  useEffect(() => {
    if (blog && (blog.status === "completed" || blog.status === "failed")) {
      fetchAuthorUsername();
      fetchIsLiked();
    }
  }, [blog?.id, blog?.status, accessToken]);

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

  if (!blog) {
    return <div className="text-center py-20">Blog not found</div>;
  }

  if (blog.status === "failed" && !showCompletionUI) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)] text-center px-4">
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">Blog Generation Failed</h2>
          <p className="text-slate-400">{blog.error_message}</p>
          <Link to="/" className="mt-6 inline-block text-primary hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // show generating UI if not finished, or if in the 3-second completion transition
  if (!(blog.status === "completed" || blog.status === "failed") || showCompletionUI) {
    const isCompleted = blog.status === "completed" && showCompletionUI;
    const isFailed = blog.status === "failed" && showCompletionUI;

    return (
      <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
        <Link to="/" className="flex flex-row gap-2 w-fit items-center text-slate-400 hover:text-white mb-6 transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Panel: Progress */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="bg-surface rounded-xl p-6 border border-slate-800 shadow-xl">
              {isCompleted ? (
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                  <h2 className="text-2xl font-semibold text-green-400">Blog Ready!</h2>
                </div>
              ) : isFailed ? (
                <h2 className="text-2xl font-semibold mb-2 text-red-400">Generation Failed</h2>
              ) : (
                <h2 className="text-2xl font-semibold mb-2">Generating Blog</h2>
              )}
              <p className="text-slate-400 mb-6">
                {isCompleted
                  ? "Your blog has been generated successfully."
                  : isFailed
                    ? "Something went wrong during generation."
                    : "AI is crafting your masterpiece. This might take a minute."}
              </p>

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
                  const isPast = currentStep === "done" || currentStep === "failed" || stepIndex > idx;
                  const isCurrent = step.id === currentStep;

                  return (
                    <div key={step.id} className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                        ${
                          isPast
                            ? isFailed
                              ? "border-red-500 bg-red-500/10"
                              : "border-green-500 bg-green-500/10"
                            : isCurrent
                              ? "border-primary bg-primary/10"
                              : "border-slate-700"
                        }`}
                      >
                        {isPast ? (
                          <CheckCircle2 className={`w-4 h-4 ${isFailed ? "text-red-500" : "text-green-500"}`} />
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

              {/* Completion banner */}
              {isCompleted && (
                <div className="mt-6 flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-green-400 text-sm font-medium">All steps completed successfully</span>
                </div>
              )}
              {isFailed && (
                <div className="mt-6 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                  <span className="text-red-400 text-sm font-medium">Generation encountered an error</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Content Preview */}
          <div className="w-full lg:w-2/3 flex flex-col bg-surface/50 rounded-xl border border-slate-800 overflow-hidden min-h-[500px]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-surface/80">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-medium">Live Preview</span>
              </div>
              {isCompleted && (
                <span className="text-xs text-green-400 font-medium bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">
                  ✓ Complete
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 lg:px-10 custom-scrollbar bg-slate-900/30">
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

  // normal return for generated blog
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col">
      {/* Back to Feed button */}
      <Link to="/" className="flex flex-row gap-2 w-fit items-center text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" />
        Back to Feed
      </Link>

      <span className="mt-7 inline-flex w-fit text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full tracking-wide">
        {blog.topic}
      </span>

      {/* title */}
      <h1 className="mt-4 text-4xl md:text-5xl font-bold text-white leading-tight">{blog.title}</h1>

      {/* author details and metadata */}
      <div className="mt-7 flex flex-row items-center justify-between border-y border-slate-800 py-4">
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleBlogLike} className="outline-none focus:outline-none">
              <Heart fill={isLiked ? "red" : "none"} className={`w-5 h-5 mr-2 ${isLiked ? "text-red-500" : ""}`} />
              {blog.num_likes || 0}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => document.getElementById("comments-section").scrollIntoView({ behavior: "smooth" })}
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              {blog.num_comments || 0}
            </Button>
            <Button variant="ghost" size="sm">
              <Bookmark className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* content */}
      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{blog.content?.replace(/^\s*#\s+.*?(\r\n|\n|$)/, "")}</ReactMarkdown>
      </div>

      {/* comments section */}
      <section className="pt-8 border-t border-slate-800" id="comments-section">
        <CommentsSection blogId={blogId} />
      </section>
    </div>
  );
};

export default BlogDetailPage;
