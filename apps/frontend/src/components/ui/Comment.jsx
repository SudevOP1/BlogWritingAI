import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { useToastContext } from "../../context/ToastContext.jsx";
import Button from "./Button.jsx";

const Comment = ({ comment, isReply = false, blogId }) => {
  const { backendUrl, accessToken, username } = useAuthContext();
  const { addToast } = useToastContext();
  const navigate = useNavigate();

  const [replies, setReplies] = useState([]);
  const [numReplies, setNumReplies] = useState(comment.num_replies || 0);
  const [showReplies, setShowReplies] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isReplyPostLoading, setIsReplyPostLoading] = useState(false);

  const [liked, setLiked] = useState(comment.liked || false);
  const [likesCount, setLikesCount] = useState(comment.num_likes || 0);

  const handleLike = async () => {
    if (!accessToken) {
      addToast("Please login to like comments", "red", 3);
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/community/comments/${comment.id}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to like comment");
      }

      const data = await res.json();
      if (data.success) {
        setLiked(data.liked);
        setLikesCount((prev) => (data.liked ? prev + 1 : prev - 1));
      } else {
        throw new Error(data.error || "Failed to like comment");
      }
    } catch (error) {
      console.error("Error liking comment:", error);
      addToast("Failed to like comment", "red", 3);
    }
  };

  const handleFetchReplies = async () => {
    if (isLoadingReplies) return;

    setIsLoadingReplies(true);
    try {
      const res = await fetch(`${backendUrl}/community/comments/${comment.id}/replies`, {
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch replies");
      }

      const data = await res.json();
      if (data.success) {
        setReplies(data.comments);
        setShowReplies(true);
      } else {
        throw new Error(data.error || "Failed to fetch replies");
      }
    } catch (error) {
      console.error("Error fetching replies:", error);
      addToast("Failed to load replies", "red", 3);
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const toggleRepliesVisibility = () => {
    if (showReplies) {
      setShowReplies(false);
    } else {
      if (replies.length === 0 && numReplies > 0) {
        handleFetchReplies();
      } else {
        setShowReplies(true);
      }
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;

    if (!accessToken) {
      addToast("Please login to reply", "red", 3);
      navigate("/login");
      return;
    }

    setIsReplyPostLoading(true);
    try {
      const res = await fetch(`${backendUrl}/community/blogs/${blogId}/comment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: replyText.trim(),
          parent_id: comment.id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to post reply");
      }

      const data = await res.json();
      if (data.success) {
        const newReply = {
          ...data.comment,
          liked: false,
          num_likes: 0,
          num_replies: 0,
        };

        if (numReplies > 0 && replies.length === 0) {
          try {
            const fetchRes = await fetch(`${backendUrl}/community/comments/${comment.id}/replies`, {
              headers: {
                Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
              },
            });
            if (fetchRes.ok) {
              const fetchData = await fetchRes.json();
              if (fetchData.success) {
                setReplies([...fetchData.comments, newReply]);
              } else {
                setReplies([newReply]);
              }
            } else {
              setReplies([newReply]);
            }
          } catch (e) {
            setReplies([newReply]);
          }
        } else {
          setReplies((prev) => [...prev, newReply]);
        }

        setNumReplies((prev) => prev + 1);
        setShowReplies(true);
        setReplyText("");
        setIsReplying(false);
        addToast("Reply posted", "green", 3);
      } else {
        throw new Error(data.error || "Failed to post reply");
      }
    } catch (error) {
      console.error("Error posting reply:", error);
      addToast("Failed to post reply", "red", 3);
    } finally {
      setIsReplyPostLoading(false);
    }
  };

  const userInitial = comment.username ? comment.username[0].toUpperCase() : "U";

  return (
    <div className={`flex gap-4 ${isReply ? "ml-12 mt-4" : ""}`}>
      <div
        className={`${isReply ? "w-8 h-8 text-sm" : "w-10 h-10"} rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center text-slate-400 font-bold`}
      >
        {userInitial}
      </div>
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-200">@{comment.username || "anonymous"}</span>
          <span className="text-xs text-slate-500">{new Date(comment.created_at || Date.now()).toLocaleDateString()}</span>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{comment.content}</p>

        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs transition-colors group/like ${
              liked ? "text-red-500 hover:text-red-400" : "text-slate-500 hover:text-red-400"
            }`}
          >
            <Heart className={`w-4 h-4 group-hover/like:fill-red-400/20 ${liked ? "fill-red-500 text-red-500" : ""}`} />
            <span className="font-medium">{likesCount}</span>
          </button>
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="text-xs text-slate-500 hover:text-primary font-bold transition-colors uppercase tracking-wider"
          >
            Reply
          </button>
        </div>

        {isReplying && (
          <div className="mt-4 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center text-slate-400 font-bold text-xs">
              {username ? username[0].toUpperCase() : "U"}
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <textarea
                rows={1}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full bg-transparent border-b border-slate-700 focus:border-primary focus:outline-none py-1.5 text-sm resize-none placeholder:text-slate-500 text-slate-100"
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyText("");
                  }}
                  className="rounded-full px-3 py-1 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim() || isReplyPostLoading}
                  className="rounded-full px-3 py-1 text-xs"
                >
                  {isReplyPostLoading ? "Replying..." : "Reply"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {numReplies > 0 && (
          <div className="mt-2">
            <button
              onClick={toggleRepliesVisibility}
              className="flex items-center gap-2 text-primary text-sm font-semibold hover:bg-primary/10 px-4 py-1.5 rounded-full transition-all duration-200"
            >
              <div
                className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-primary transition-transform duration-200 ${
                  showReplies ? "rotate-180" : ""
                }`}
              />
              {isLoadingReplies
                ? "Loading replies..."
                : showReplies
                  ? "Hide replies"
                  : `View ${numReplies} reply${numReplies > 1 ? "ies" : ""}`}
            </button>

            {showReplies && replies.length > 0 && (
              <div className="flex flex-col gap-2 mt-2 animate-in fade-in slide-in-from-left-2 duration-300">
                {replies.map((reply) => (
                  <Comment key={reply.id} comment={reply} isReply={true} blogId={blogId} />
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
