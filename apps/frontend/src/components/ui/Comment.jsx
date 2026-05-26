import { useState } from "react";
import { Heart } from "lucide-react";

const Comment = ({ comment, isReply = false }) => {
  const [showReplies, setShowReplies] = useState(false);

  return (
    <div className={`flex gap-4 ${isReply ? "ml-12 mt-4" : ""}`}>
      <div
        className={`${isReply ? "w-8 h-8 text-sm" : "w-10 h-10"} rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center text-slate-400 font-bold`}
      >
        {comment.username[0].toUpperCase()}
      </div>
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-200">@{comment.username}</span>
          <span className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleDateString()}</span>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{comment.content}</p>

        <div className="flex items-center gap-4 mt-2">
          <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors group/like">
            <Heart className="w-4 h-4 group-hover/like:fill-red-400/20" />
            <span className="font-medium">0</span>
          </button>
          <button className="text-xs text-slate-500 hover:text-primary font-bold transition-colors uppercase tracking-wider">
            Reply
          </button>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-2 text-primary text-sm font-semibold hover:bg-primary/10 px-4 py-1.5 rounded-full transition-all duration-200"
            >
              <div
                className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-primary transition-transform duration-200 ${showReplies ? "rotate-180" : ""}`}
              />
              {showReplies ? "Hide replies" : `View ${comment.replies.length} replies`}
            </button>

            {showReplies && (
              <div className="flex flex-col gap-2 mt-2 animate-in fade-in slide-in-from-left-2 duration-300">
                {comment.replies.map((reply) => (
                  <Comment key={reply.id} comment={reply} isReply={true} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comment;
