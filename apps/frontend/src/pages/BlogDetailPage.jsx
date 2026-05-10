import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, MessageSquare, Bookmark, ArrowLeft, Share2, FileText, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Button from "../components/ui/Button";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "../context/AuthContext";
import { useToastContext } from "../context/ToastContext";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState("idle");

  const { addToast } = useToastContext();

  const mockBlog = {
    blogId: "1",
    title: "The Future of Agentic AI in Software Engineering",
    content: `
# Introduction to Agentic AI
Agentic AI is revolutionizing how we write code. Instead of simple autocomplete, these agents can reason, plan, and execute multi-step tasks across complex codebases.

## Why it matters
The transition from passive tools to active agents means:
- Faster development cycles
- Fewer boilerplate errors
- More time for architectural decisions

### Example Code
\`\`\`javascript
const agent = new DeveloperAgent({
  skills: ['React', 'Node', 'Python'],
  autonomyLevel: 'high'
});

await agent.buildFeature('Login Page');
\`\`\`

> "The future of coding is managing agents, not writing syntax." - AI Enthusiast

Let's embrace the future!
  `,
    author: { username: "AI_Researcher" },
    created_at: new Date().toISOString(),
    likes_count: 124,
    comments_count: 32,
    is_liked: false,
    is_bookmarked: false,
  };

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
          setIsLoading(false);
          return;
        }

        if (data.type === "blog") {
          setBlog(data.blog);
          setIsLoading(false);

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
        setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
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
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
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
                <span className="font-medium">Live Generation Preview</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-slate-400 font-medium uppercase tracking-tighter">Live Updates</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-slate-900/30">
              {blog.content ? (
                <article className="markdown-body max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{blog.content}</ReactMarkdown>
                </article>
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-500 space-y-4">
                  <Loader2 className="w-12 h-12 text-primary/20 animate-spin" />
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Feed
      </Link>

      <article>
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">{blog.title}</h1>

          <div className="flex items-center justify-between border-y border-slate-800 py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-lg">
                {blog.author?.username?.[0]?.toUpperCase() || "A"}
              </div>
              <div>
                <p className="text-white font-medium">{blog.author?.username || "Anonymous"}</p>
                <p className="text-slate-500 text-sm">{new Date(blog.created_at).toLocaleDateString()}</p>
              </div>
            </div>

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

        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{blog.content}</ReactMarkdown>
        </div>
      </article>

      {/* Simple Comments Section Stub */}
      <section className="mt-16 pt-8 border-t border-slate-800">
        <h3 className="text-2xl font-bold mb-6">Comments ({blog.comments_count || 0})</h3>
        <div className="bg-surface rounded-lg p-6 text-center text-slate-500">Comments feature coming soon.</div>
      </section>
    </div>
  );
};

export default BlogDetailPage;
