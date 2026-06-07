import { useState } from "react";
import { Heart, MessageSquare, Bookmark, Share2, Calendar, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext.jsx";
import { useToastContext } from "../context/ToastContext.jsx";

function FeedBlogCard({ blog, onTopicSelect }) {
  const { backendUrl, accessToken } = useAuthContext();
  const { addToast } = useToastContext();
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(blog.is_liked);
  const [likesCount, setLikesCount] = useState(blog.num_likes);
  const [isBookmarked, setIsBookmarked] = useState(blog.is_bookmarked);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const timeAgo = (iso) => {
    if (!iso) {
      return "";
    }
    const timeDiff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(timeDiff / 60000);
    if (minutes < 1) {
      return "just now";
    }
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    if (days === 1) {
      return "yesterday";
    }
    if (days < 30) {
      return `${days}d ago`;
    }
    const months = Math.floor(days / 30);
    if (months < 12) {
      return `${months}mo ago`;
    }
    return `${Math.floor(months / 12)}y ago`;
  };

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!accessToken) {
      addToast("Please login to upvote", "red", 3);
      navigate("/login");
      return;
    }

    // Optimistic update
    const oldIsLiked = isLiked;
    const oldLikes = likesCount;
    setIsLiked(!oldIsLiked);
    setLikesCount(oldIsLiked ? oldLikes - 1 : oldLikes + 1);

    try {
      const res = await fetch(`${backendUrl}/community/blogs/${blog.id}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!data.success) throw new Error();
    } catch (err) {
      // Rollback
      setIsLiked(oldIsLiked);
      setLikesCount(oldLikes);
      addToast("Failed to update vote", "red", 3);
    }
  };

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!accessToken) {
      addToast("Please login to bookmark", "red", 3);
      navigate("/login");
      return;
    }

    if (bookmarkLoading) return;
    setBookmarkLoading(true);

    const targetUrl = `${backendUrl}/users/bookmarks/${blog.id}`;
    const method = isBookmarked ? "DELETE" : "POST";
    const oldIsBookmarked = isBookmarked;

    // Optimistic update
    setIsBookmarked(!oldIsBookmarked);

    try {
      const res = await fetch(targetUrl, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!data.success) throw new Error();
      addToast(isBookmarked ? "Bookmark removed" : "Bookmark saved", "green", 2);
    } catch (err) {
      setIsBookmarked(oldIsBookmarked);
      addToast("Failed to update bookmark", "red", 3);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/blog/${blog.id}`;
    navigator.clipboard.writeText(shareUrl);
    addToast("Copied link to clipboard!", "green", 2);
  };

  return (
    <div
      onClick={() => navigate(`/blog/${blog.id}`)}
      className="group flex flex-row bg-surface/40 backdrop-blur-sm rounded-xl border border-slate-800 hover:border-primary/40 hover:bg-surface/60 transition duration-300 shadow-md hover:shadow-primary/5 cursor-pointer overflow-hidden mb-4"
    >
      {/* Left Like Sidebar */}
      <div
        className="w-11 md:w-12 flex-shrink-0 bg-slate-900/40 flex flex-col items-center py-4 border-r border-slate-800/60 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleLike}
          className={"p-1.5 rounded-lg transition duration-200 cursor-pointer hover:bg-primary/10"}
          title="Like"
        >
          <Heart className={`w-6 h-6 stroke-[2.5] ${isLiked ? "text-red-500 fill-red-500" : "text-primary"}`} />
        </button>
        <span className={`text-xs md:text-sm font-bold transition duration-200 ${isLiked ? "text-red-500" : "text-primary"}`}>
          {likesCount}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 md:p-6 flex flex-col gap-3">
        {/* Meta Info Header */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (blog.topic && onTopicSelect) {
                onTopicSelect(blog.topic);
              }
            }}
            className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded"
          >
            {blog.topic}
          </div>
          <span className="text-slate-700">•</span>
          <span className="text-slate-400">Posted by</span>
          <Link
            to={`/user/${blog.author_id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 font-medium text-slate-300 hover:text-primary transition"
          >
            <User className="w-3 h-3" />
            {blog.author_username}
          </Link>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Calendar className="w-3 h-3" />
            {timeAgo(blog.created_at)}
          </span>
        </div>

        {/* Blog Title */}
        <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-primary transition duration-300 leading-snug">
          {blog.title}
        </h3>

        {/* Text Excerpt Teaser */}
        {blog.excerpt && (
          <p className="text-slate-300 text-sm leading-relaxed line-clamp-3 group-hover:text-slate-200 transition duration-300">
            {blog.excerpt}
          </p>
        )}

        <div className="flex items-center text-xs font-semibold text-slate-400 border-t border-slate-800/40">
          <Link
            to={`/blog/${blog.id}#comments-section`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 hover:text-white transition"
          >
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <span>{blog.num_comments} Comments</span>
          </Link>

          <button
            onClick={handleBookmark}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 transition cursor-pointer ${
              isBookmarked ? "text-primary hover:text-primary-hover" : "hover:text-white"
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : "text-slate-500"}`} />
            <span>{isBookmarked ? "Saved" : "Save"}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 hover:text-white transition cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeedBlogCard;
