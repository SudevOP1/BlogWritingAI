import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Bookmark, FileText } from "lucide-react";

import { useAuthContext } from "../context/AuthContext.jsx";
import { useToastContext } from "../context/ToastContext.jsx";
import Loader from "../components/ui/Loader.jsx";
import BlogCard from "../components/BlogCard.jsx";

const ProfilePage = () => {
  const { userId } = useParams();
  const { backendUrl, accessToken, username, userId: currentUserId } = useAuthContext();
  const { addToast } = useToastContext();

  const [activeTab, setActiveTab] = useState("blogs");
  const [userDetails, setUserDetails] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [likedBlogs, setLikedBlogs] = useState([]);
  const [savedBlogs, setSavedBlogs] = useState([]);

  const [userDetailsLoading, setUserDetailsLoading] = useState(true);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [likedBlogsLoading, setLikedBlogsLoading] = useState(false);
  const [savedBlogsLoading, setSavedBlogsLoading] = useState(false);

  // Modal states for Followers/Following lists
  const [modalType, setModalType] = useState(null); // 'followers', 'following', or null
  const [modalUsers, setModalUsers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchUserDetails = async () => {
    if (!userId) {
      return;
    }

    setUserDetailsLoading(true);
    try {
      const headers = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      const res = await fetch(`${backendUrl}/users/${userId}`, {
        method: "GET",
        headers,
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
      const headers = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      const res = await fetch(`${backendUrl}/users/${userId}/blogs`, {
        method: "GET",
        headers,
      });
      if (!res.ok) {
        throw new Error("Failed to fetch blogs");
      }
      const data = await res.json();
      if (!data.success) {
        console.error("Backend validation failed:", data.error);
        throw new Error("Failed to fetch blogs");
      }
      setBlogs(data.blogs || []);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      addToast("Failed to fetch blogs", "red", 3);
    } finally {
      setBlogsLoading(false);
    }
  };

  const fetchLikedBlogs = async () => {
    if (!accessToken) return;
    setLikedBlogsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/users/liked`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch liked blogs");
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error("Failed to fetch liked blogs");
      }
      setLikedBlogs(data.blogs || []);
    } catch (error) {
      console.error("Error fetching liked blogs:", error);
      addToast("Failed to fetch liked blogs", "red", 3);
    } finally {
      setLikedBlogsLoading(false);
    }
  };

  const fetchSavedBlogs = async () => {
    if (!accessToken) return;
    setSavedBlogsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/users/bookmarks`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch saved blogs");
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error("Failed to fetch saved blogs");
      }
      setSavedBlogs(data.blogs || []);
    } catch (error) {
      console.error("Error fetching saved blogs:", error);
      addToast("Failed to fetch saved blogs", "red", 3);
    } finally {
      setSavedBlogsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!accessToken) {
      addToast("Please login to follow creators", "red", 3);
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/community/${userId}/follow`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to toggle follow status");
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to toggle follow status");
      }

      setUserDetails((prev) => {
        if (!prev) return prev;
        const newFollowingState = data.following;
        return {
          ...prev,
          is_following: newFollowingState,
          num_followers: prev.num_followers + (newFollowingState ? 1 : -1),
        };
      });

      addToast(data.following ? `Followed @${userDetails.username}` : `Unfollowed @${userDetails.username}`, "green", 3);
    } catch (error) {
      console.error("Error toggling follow:", error);
      addToast(error.message || "Failed to update follow status", "red", 3);
    }
  };

  const openFollowModal = async (type) => {
    setModalType(type);
    setModalUsers([]);
    setModalLoading(true);
    try {
      const res = await fetch(`${backendUrl}/community/${userId}/${type}`, {
        method: "GET",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch ${type}`);
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(`Failed to fetch ${type}`);
      }
      setModalUsers(data[type] || []);
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      addToast(`Failed to load ${type}`, "red", 3);
    } finally {
      setModalLoading(false);
    }
  };

  // fetch userDetails & blogs
  useEffect(() => {
    fetchUserDetails();
    fetchBlogs();
    if (userId === currentUserId) {
      fetchLikedBlogs();
      fetchSavedBlogs();
    } else {
      setLikedBlogs([]);
      setSavedBlogs([]);
      setActiveTab("blogs");
    }
  }, [userId, accessToken, currentUserId]);

  if (userDetailsLoading || blogsLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader className="w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Back */}
      <Link to="/feed" className="flex flex-row gap-2 w-fit items-center text-slate-400 hover:text-white transition">
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
              <button
                onClick={handleFollowToggle}
                className={`mt-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                  userDetails?.is_following
                    ? "bg-primary/20 border-primary text-primary hover:bg-primary/30"
                    : "border-slate-700 text-slate-300 hover:border-primary/50 hover:text-white"
                }`}
              >
                {userDetails?.is_following ? "Following" : "Follow"}
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
            <div className="flex flex-col items-center gap-0.5 px-5 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 min-w-20">
              <span className="text-xl font-bold text-white">
                {userDetails?.num_blogs >= 1000 ? `${(userDetails.num_blogs / 1000).toFixed(1)}k` : userDetails?.num_blogs}
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Blogs</span>
            </div>

            <button
              onClick={() => openFollowModal("followers")}
              className="flex flex-col items-center gap-0.5 px-5 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 min-w-20 hover:bg-slate-700/50 hover:border-primary/30 transition-all text-center cursor-pointer"
            >
              <span className="text-xl font-bold text-white">
                {userDetails?.num_followers >= 1000
                  ? `${(userDetails.num_followers / 1000).toFixed(1)}k`
                  : userDetails?.num_followers}
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Followers</span>
            </button>

            <button
              onClick={() => openFollowModal("following")}
              className="flex flex-col items-center gap-0.5 px-5 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 min-w-20 hover:bg-slate-700/50 hover:border-primary/30 transition-all text-center cursor-pointer"
            >
              <span className="text-xl font-bold text-white">
                {userDetails?.num_following >= 1000
                  ? `${(userDetails.num_following / 1000).toFixed(1)}k`
                  : userDetails?.num_following}
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Following</span>
            </button>
          </div>
        </div>
      </div>

      {/* blog filter tabs */}
      <div className="flex border-b border-slate-800 gap-1">
        {[
          { id: "blogs", label: "Blogs", icon: FileText },
          ...(userId === currentUserId
            ? [
                { id: "liked", label: "Liked", icon: Heart },
                { id: "saved", label: "Saved", icon: Bookmark },
              ]
            : []),
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px cursor-pointer ${
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

      {/* blogs content render */}
      <>
        {activeTab === "blogs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {blogs.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
                <FileText className="w-10 h-10 opacity-20" />
                <p className="text-sm">No blogs published yet.</p>
              </div>
            ) : (
              blogs.map((blog) => <BlogCard key={blog.id} blog={blog} />)
            )}
          </div>
        )}

        {activeTab === "liked" &&
          (likedBlogsLoading ? (
            <div className="flex justify-center py-10">
              <Loader className="w-6 h-6 text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {likedBlogs.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
                  <Heart className="w-10 h-10 opacity-20" />
                  <p className="text-sm">No liked blogs to show yet.</p>
                </div>
              ) : (
                likedBlogs.map((blog) => <BlogCard key={blog.id} blog={blog} />)
              )}
            </div>
          ))}

        {activeTab === "saved" &&
          (savedBlogsLoading ? (
            <div className="flex justify-center py-10">
              <Loader className="w-6 h-6 text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {savedBlogs.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
                  <Bookmark className="w-10 h-10 opacity-20" />
                  <p className="text-sm">No saved blogs to show yet.</p>
                </div>
              ) : (
                savedBlogs.map((blog) => <BlogCard key={blog.id} blog={blog} />)
              )}
            </div>
          ))}
      </>

      {/* Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-lg font-bold text-white capitalize">{modalType}</h3>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer text-sm font-semibold"
              >
                Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-96 overflow-y-auto space-y-4">
              {modalLoading ? (
                <div className="flex justify-center py-8">
                  <Loader className="w-6 h-6 text-primary" />
                </div>
              ) : modalUsers.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-4">No {modalType} found.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {modalUsers.map((u) => (
                    <Link
                      key={u.id}
                      to={`/user/${modalType === "followers" ? u.follower_id : u.following_id}`}
                      onClick={() => setModalType(null)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-800 hover:border-primary/30 hover:bg-slate-800/60 transition"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                        {u.display_name?.[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{u.display_name}</p>
                        <p className="text-xs text-slate-400 truncate">@{u.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
