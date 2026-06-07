import { useState, useEffect } from "react";
import { Sparkles, Star, PenTool, CheckCircle, Users, Compass, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext.jsx";
import { useToastContext } from "../context/ToastContext.jsx";
import FeedBlogCard from "../components/FeedBlogCard.jsx";
import Loader from "../components/ui/Loader.jsx";
import Button from "../components/ui/Button.jsx";

const FeedPage = () => {
  const { backendUrl, accessToken } = useAuthContext();
  const { addToast } = useToastContext();

  const [blogs, setBlogs] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [activeTab, setActiveTab] = useState("new"); // new, top, following
  const [loading, setLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const LIMIT = 10;

  // Fetch unique topics
  const fetchTopics = async () => {
    setTopicsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/blogs/topics`);
      if (!res.ok) throw new Error("Failed to fetch topics");
      const data = await res.json();
      if (data.success) {
        setTopics(data.topics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTopicsLoading(false);
    }
  };

  // Fetch blogs feed
  const fetchBlogs = async (reset = false) => {
    const currentSkip = reset ? 0 : skip;
    if (reset) {
      setLoading(true);
      setSkip(0);
    }

    setError(null);
    try {
      const topicParam = selectedTopic && selectedTopic !== "All" ? `&topic=${encodeURIComponent(selectedTopic)}` : "";
      const url = `${backendUrl}/blogs/feed?sort=${activeTab}&skip=${currentSkip}&limit=${LIMIT}${topicParam}`;

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

  useEffect(() => {
    fetchTopics();
  }, [backendUrl]);

  // Refetch when activeTab or selectedTopic changes
  useEffect(() => {
    fetchBlogs(true);
  }, [activeTab, selectedTopic, backendUrl]);

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
  };

  const loadMore = () => {
    fetchBlogs(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
      {/* Page Header / Subreddit Heading Style */}
      <div className="mb-6 flex flex-col gap-1 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/20 text-primary">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {selectedTopic === "All" ? "Feed" : `t/${selectedTopic}`}
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              {selectedTopic === "All"
                ? "Discover trending AI-generated blogs across all topics"
                : `Showing blogs tag-topic matching "${selectedTopic}"`}
            </p>
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
                  onClick={() => setActiveTab(id)}
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
            {selectedTopic !== "All" && (
              <button
                onClick={() => setSelectedTopic("All")}
                className="text-xs text-primary hover:text-primary-hover font-medium underline px-3 cursor-pointer"
              >
                Clear filter
              </button>
            )}
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
          ) : blogs.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-16 px-6 bg-surface/20 border border-slate-800 rounded-xl text-center">
              <BookOpen className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No blogs here yet</h3>
              <p className="text-slate-400 text-sm max-w-sm mb-6">
                {selectedTopic === "All"
                  ? "There are no published blogs in this feed. Start the trend by creating your own!"
                  : `Nobody has generated a blog about "${selectedTopic}" yet. Be the first to generate one!`}
              </p>
              <Link to="/create-blog">
                <Button size="sm">
                  <PenTool className="w-4 h-4 mr-2" /> Create Blog
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {blogs.map((blog) => (
                <FeedBlogCard key={blog.id} blog={blog} onTopicSelect={handleTopicSelect} />
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
