import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, MessageSquare, Bookmark, ArrowLeft, Share2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Button from "../components/ui/Button";
import { Loader2 } from "lucide-react";

const mockBlog = {
  id: "1",
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

const BlogDetailPage = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    // Simulate API fetch
    const fetchBlog = async () => {
      setIsLoading(true);
      setTimeout(() => {
        setBlog(mockBlog);
        setIsLiked(mockBlog.is_liked);
        setLikesCount(mockBlog.likes_count);
        setIsLoading(false);
      }, 800);
    };
    fetchBlog();
  }, [id]);

  const toggleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!blog) return <div className="text-center py-20">Blog not found</div>;

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
              <Button variant="ghost" size="sm" onClick={toggleLike} className={isLiked ? "text-red-400 hover:text-red-300" : ""}>
                <Heart className={`w-5 h-5 mr-2 \${isLiked ? 'fill-current' : ''}`} />
                {likesCount}
              </Button>
              <Button variant="ghost" size="sm">
                <MessageSquare className="w-5 h-5 mr-2" />
                {blog.comments_count}
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
        <h3 className="text-2xl font-bold mb-6">Comments ({blog.comments_count})</h3>
        <div className="bg-surface rounded-lg p-6 text-center text-slate-500">Comments feature coming soon.</div>
      </section>
    </div>
  );
};

export default BlogDetailPage;
