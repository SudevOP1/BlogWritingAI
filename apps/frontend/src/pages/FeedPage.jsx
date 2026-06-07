import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Sparkles, Star, PenTool, CheckCircle, Users, Compass, BookOpen } from "lucide-react";

import { useAuthContext } from "../context/AuthContext.jsx";
import { useToastContext } from "../context/ToastContext.jsx";
import FeedBlogCard from "../components/FeedBlogCard.jsx";
import Loader from "../components/ui/Loader.jsx";
import Button from "../components/ui/Button.jsx";

const FeedPage = () => {
  const { backendUrl, accessToken } = useAuthContext();
  const { addToast } = useToastContext();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = ["new", "top", "following"].includes(tabParam) ? tabParam : "new";

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync / validate tab in URL
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (!["new", "top", "following"].includes(currentTab)) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("tab", "new");
          return next;
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);

  const handleTabChange = (id) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", id);
      return next;
    });
  };

  // Pagination
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const LIMIT = 10;

  // Fetch blogs feed
  const fetchBlogs = async (reset = false) => {
    const currentSkip = reset ? 0 : skip;
    if (reset) {
      setLoading(true);
      setSkip(0);
    }

    setError(null);
    try {
      const url = `${backendUrl}/blogs/feed?sort=${activeTab}&skip=${currentSkip}&limit=${LIMIT}`;

      const headers = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("Failed to fetch feed");

      const data = await res.json();
      if (data.success) {
        if (reset) {
          setBlogs(data.blogs);
        } else {
          setBlogs((prev) => [...prev, ...data.blogs]);
        }
        setTotal(data.total);
        setHasMore(currentSkip + LIMIT < data.total);
        setSkip(currentSkip + LIMIT);
      } else {
        throw new Error(data.error || "Failed to fetch feed");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load blogs. Please try again later.");
      addToast(err.message || "Failed to load blogs", "red", 4);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when activeTab changes
  useEffect(() => {
    fetchBlogs(true);
  }, [activeTab, backendUrl]);

  const loadMore = () => {
    fetchBlogs(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-[80vh]">
      {/* Page Header / Subreddit Heading Style */}
      <div className="mb-6 flex flex-col gap-1 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/20 text-primary">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Feed</h1>
            <p className="text-xs md:text-sm text-slate-400">Discover trending AI-generated blogs</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Feed + Sidebar */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Left Side: Sorting and Feed Cards */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Sorting Bar */}
          <div className="flex items-center justify-between bg-surface/30 border border-slate-800/80 p-2 rounded-xl backdrop-blur-sm">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "new", label: "New", icon: Sparkles },
                { id: "top", label: "Top", icon: Star },
                { id: "following", label: "Following", icon: Users },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition duration-200 cursor-pointer ${
                    activeTab === id
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Feed Content */}
          {loading && skip === 0 ? (
            <div className="flex flex-col justify-center items-center py-20 bg-surface/20 border border-slate-800 rounded-xl">
              <Loader className="w-8 h-8 text-primary" />
              <p className="text-slate-500 text-sm mt-4">Loading your feed...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-xl text-center">
              <p className="font-semibold mb-2">Error Loading Feed</p>
              <p className="text-xs text-slate-400 mb-4">{error}</p>
              <Button size="sm" onClick={() => fetchBlogs(true)}>
                Retry
              </Button>
            </div>
          ) : activeTab === "following" && !accessToken ? (
            <div className="flex flex-col justify-center items-center py-16 px-6 bg-surface/20 border border-slate-800 rounded-xl text-center">
              <Users className="w-12 h-12 text-primary/60 mb-4 animate-pulse" />
              <h3 className="text-lg font-bold text-white mb-2">Keep up with your favorite authors</h3>
              <p className="text-slate-400 text-sm max-w-sm mb-6">
                Log in to see post feeds from authors you follow and get personalized updates.
              </p>
              <Link to="/login">
                <Button size="sm">Sign In</Button>
              </Link>
            </div>
          ) : blogs.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-16 px-6 bg-surface/20 border border-slate-800 rounded-xl text-center">
              <BookOpen className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                {activeTab === "following" ? "Feed is empty" : "No blogs here yet"}
              </h3>
              <p className="text-slate-400 text-sm max-w-sm mb-6">
                {activeTab === "following"
                  ? "You aren't following anyone yet, or the authors you follow haven't posted anything."
                  : "There are no published blogs in this feed. Start the trend by creating your own!"}
              </p>
              {activeTab === "following" ? (
                <Button size="sm" onClick={() => handleTabChange("new")}>
                  Discover Authors
                </Button>
              ) : (
                <Link to="/create-blog">
                  <Button size="sm">
                    <PenTool className="w-4 h-4 mr-2" /> Create Blog
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {blogs.map((blog) => (
                <FeedBlogCard key={blog.id} blog={blog} />
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" onClick={loadMore} className="w-full md:w-auto">
                    {loading ? <Loader className="w-4 h-4 mr-2" /> : null}
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Sidebar */}
        <div className="flex flex-col gap-6 w-full md:w-sm">
          {/* Create Blog Widget */}
          <div className="bg-surface/30 border border-slate-800/80 rounded-xl p-6 backdrop-blur-sm shadow-lg">
            <h3 className="font-bold text-white flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Generate New Post</span>
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-5">
              Enter any topic and watch BlogAI research, structure, and draft a high-quality blog using state-of-the-art agent
              workflows.
            </p>
            <Link to="/create-blog" className="block">
              <Button className="w-full group">
                Create Blog
                <PenTool className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition" />
              </Button>
            </Link>
          </div>

          {/* About Widget */}
          <div className="bg-surface/30 border border-slate-800/80 rounded-xl p-6 backdrop-blur-sm text-xs leading-relaxed text-slate-500">
            <h3 className="font-bold text-white flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span className="text-base">Welcome to BlogAI Feed</span>
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              This is the community dashboard. Here you can see, like, and discuss AI-crafted blogs from creators around the
              globe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
