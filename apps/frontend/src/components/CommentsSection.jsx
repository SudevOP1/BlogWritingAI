import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";

import { useAuthContext } from "../context/AuthContext.jsx";
import { useToastContext } from "../context/ToastContext.jsx";
import Comment from "./ui/Comment.jsx";
import Button from "./ui/Button.jsx";

const CommentsSection = ({ blogId }) => {
  const { backendUrl, accessToken, username } = useAuthContext();
  const { addToast } = useToastContext();
  const navigate = useNavigate();

  const [comments, setComments] = useState([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);

  const [commentText, setCommentText] = useState("");
  const [isCommentPostLoading, setIsCommentPostLoading] = useState(false);
  const [isCommentInputFocused, setIsCommentInputFocused] = useState(false);

  const fetchComments = async () => {
    setIsCommentsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/community/blogs/${blogId}/comments`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch comments");
      }
      const data = await res.json();
      if (data.success) {
        setComments(data.comments);
      } else {
        console.error("Backend validation failed:", data.error);
        throw new Error("Failed to fetch comments");
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      addToast("Failed to load comments", "red", 3);
    } finally {
      setIsCommentsLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) {
      return;
    }

    if (!accessToken) {
      addToast("Please login to comment", "red", 3);
      navigate("/login", { state: { from: `/blogs/${blogId}` } });
      return;
    }

    setIsCommentPostLoading(true);
    try {
      const res = await fetch(`${backendUrl}/community/blogs/${blogId}/comment`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ content: commentText.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to post comment");
      }

      const data = await res.json();

      if (data.success) {
        setComments((prev) => [data.comment, ...prev]);
        setCommentText("");
        setIsCommentInputFocused(false);
      } else {
        console.error("Backend validation failed:", data.error);
        throw new Error("Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      addToast("Failed to post comment", "red", 3);
    } finally {
      setIsCommentPostLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  return (
    <div className="flex flex-col">
      <h3 className="text-2xl font-bold mb-8">Comments ({comments.length || 0})</h3>

      {/* comment input */}
      <div className="flex gap-4">
        {username ? (
          <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0 flex items-center justify-center text-slate-400 font-bold">
            {username[0].toUpperCase()}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-400" />
          </div>
        )}

        <div className="flex-1 relative flex flex-col gap-2">
          <textarea
            rows={2}
            placeholder="Add a comment..."
            className="w-full bg-transparent border-b border-slate-700 focus:border-primary focus:outline-none py-2 pr-24
              transition-all duration-300 resize-none overflow-hidden placeholder:text-slate-500"
            onFocus={() => setIsCommentInputFocused(true)}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />{" "}
          {isCommentInputFocused && (
            <Button
              size="sm"
              className="z-100 rounded-full px-4 py-2 absolute right-2 top-1/2 -translate-y-1/2"
              disabled={!commentText.trim()}
              onClick={() => {
                handleCommentSubmit();
                setIsCommentInputFocused(false);
              }}
            >
              Comment
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 mt-4">
        {comments.map((comment) => (
          <Comment key={comment.id} comment={comment} blogId={blogId} />
        ))}
      </div>
    </div>
  );
};

export default CommentsSection;
