import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Bookmark, FileText } from "lucide-react";

import { useAuthContext } from "../context/AuthContext.jsx";
import { useToastContext } from "../context/ToastContext.jsx";
import Loader from "../components/ui/Loader.jsx";
import BlogCard from "../components/BlogCard.jsx";

const ProfilePage = () => {
  const { userId } = useParams();
  const { backendUrl, accessToken, username } = useAuthContext();
  const { addToast } = useToastContext();

  const [activeTab, setActiveTab] = useState("blogs");
  const [userDetails, setUserDetails] = useState(null);
  const [blogs, setBlogs] = useState([]);

  const [userDetailsLoading, setUserDetailsLoading] = useState(true);
  const [blogsLoading, setBlogsLoading] = useState(true);

  const fetchUserDetails = async () => {
    if (!userId) {
      return;
    }

    setUserDetailsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/users/${userId}/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch user details");
      }
      const data = await res.json();
      if (!data.success) {
        console.error("Backend validation failed:", data.error);
        throw new Error("Failed to fetch user details");
      }
      setUserDetails(data.user);
    } catch (error) {
      console.error("Error fetching user details:", error);
      addToast("Failed to fetch user details", "red", 3);
    } finally {
      setUserDetailsLoading(false);
    }
  };

  const fetchBlogs = async () => {
    if (!userId) {
      return;
    }

    setBlogsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/users/${userId}/blogs/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch blogs");
      }
      const data = await res.json();
      if (!data.success) {
        console.error("Backend validation failed:", data.error);
        throw new Error("Failed to fetch blogs");
      }
      setBlogs(data.blogs);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      addToast("Failed to fetch blogs", "red", 3);
    } finally {
      setBlogsLoading(false);
    }
  };

  // fetch userDetails & blogs
  useEffect(() => {
    fetchUserDetails();
    fetchBlogs();
  }, []);

  if (userDetailsLoading || blogsLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Loader className="w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Back */}
      <Link to="/" className="flex flex-row gap-2 w-fit items-center text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" />
        Back to Feed
      </Link>

      {/* main user details */}
      <div className="bg-surface rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-6">
          {/* profile picture & follow btn */}
          <div className="mb-4 flex items-end justify-between">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-3xl font-bold text-white shadow-xl border-4 border-surface">
              {userDetails?.display_name?.[0].toUpperCase()}
            </div>

            {username !== userDetails?.username && (
              <button className="mt-2 px-4 py-2 rounded-lg border border-slate-700 text-sm font-medium text-slate-300 hover:border-primary/50 hover:text-white transition-all">
                Follow
              </button>
            )}
          </div>

          {/* displayName & username */}
          <div className="space-y-1 mb-4">
            <h1 className="text-2xl font-bold text-white">{userDetails?.display_name}</h1>
            <p className="text-slate-400 text-sm">@{userDetails?.username}</p>
          </div>

          {/* bio */}
          <p className="text-slate-300 text-sm leading-relaxed mb-5 max-w-xl">{userDetails?.bio}</p>

          {/* stats */}
          <div className="flex flex-wrap gap-3">
            {Object.entries({
              Blogs: userDetails?.num_blogs,
              Followers: userDetails?.num_followers,
              Following: userDetails?.num_following,
            }).map(([label, value], id) => (
              <div
                key={id}
                className="flex flex-col items-center gap-0.5 px-5 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 min-w-20"
              >
                <span className="text-xl font-bold text-white">{value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}</span>
                <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* blog filter tabs */}
      <div className="flex border-b border-slate-800 gap-1">
        {[
          { id: "blogs", label: "Blogs", icon: FileText },
          { id: "liked", label: "Liked", icon: Heart },
          { id: "saved", label: "Saved", icon: Bookmark },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${
              activeTab === id ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {id === "blogs" && (
              <span className="ml-1 text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">{userDetails.num_blogs}</span>
            )}
          </button>
        ))}
      </div>

      {/* blogs */}
      <>
        {activeTab === "blogs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        )}

        {activeTab === "liked" && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
            <Heart className="w-10 h-10 opacity-20" />
            <p className="text-sm">No liked blogs to show yet.</p>
          </div>
        )}

        {activeTab === "saved" && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
            <Bookmark className="w-10 h-10 opacity-20" />
            <p className="text-sm">No saved blogs to show yet.</p>
          </div>
        )}
      </>
    </div>
  );
};

export default ProfilePage;
