import { useState } from "react";
import { Heart, MessageSquare, Bookmark, Calendar, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

function BlogCard({ blog }) {
  const timeAgo = (iso) => {
    const timeDiff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(timeDiff / 86_400_000);
    if (days === 0) {
      return "Today";
    }
    if (days === 1) {
      return "Yesterday";
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

  return (
    <Link
      to={`/blog/${blog.id}`}
      className="group block bg-surface rounded-xl border border-slate-800 hover:border-primary/40 transition duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
    >
      <div className="p-6 flex flex-col gap-4">
        {/* tag */}
        <span className="self-start text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full tracking-wide">
          {blog.topic}
        </span>

        {/* title */}
        <h3 className="text-lg font-bold text-white group-hover:text-primary transition leading-snug">{blog.title}</h3>

        {/* footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-800/80">
          {/* date */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {timeAgo(blog.created_at)}
            </span>
          </div>

          {/* likes, comments, bookmarks buttons */}
          <div className="relative w-24 h-5 overflow-hidden">
            <div
              className="absolute inset-0 flex items-center justify-end gap-3 transition-all duration-300 ease-out
                opacity-100 translate-y-0 group-hover:opacity-0 group-hover:-translate-y-2 pointer-events-none"
            >
              <span className="flex items-center gap-1">
                <Heart className={`w-3.5 h-3.5 ${blog.is_liked ? "text-red-500 fill-red-500" : ""}`} />
                {blog.num_likes}
              </span>

              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                {blog.num_comments}
              </span>

              <span className="flex items-center gap-1">
                <Bookmark className={`w-3.5 h-3.5 ${blog.is_bookmarked ? "text-blue-500 fill-blue-500" : ""}`} />
                {blog.num_bookmarks}
              </span>
            </div>

            {/* open link button on hover */}
            <div
              className="absolute inset-0 flex items-center justify-end transition-all duration-300 ease-out
                opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none"
            >
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default BlogCard;
