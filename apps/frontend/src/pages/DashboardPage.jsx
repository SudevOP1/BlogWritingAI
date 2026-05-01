import React, { useState } from "react";
import { BookOpen, Bookmark, Clock, CheckCircle2 } from "lucide-react";
import Button from "../components/ui/Button";

// Temporary mock data
const myBlogs = [
  { id: "1", title: "Getting Started with LangGraph", status: "published", date: "2023-10-25" },
  { id: "2", title: "Why Markdown is the Best Writing Format", status: "draft", date: "2023-10-26" },
];

const bookmarkedBlogs = [{ id: "3", title: "The Future of Agentic AI in Software Engineering", author: "AI_Researcher" }];

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState("my-blogs");

  return (
    <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
      <div className="mb-8 border-b border-slate-800 pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Dashboard</h1>
          <p className="text-slate-400">Manage your generated blogs and saved content.</p>
        </div>
        <Button variant="primary" onClick={() => (window.location.href = "/studio")}>
          Generate New Blog
        </Button>
      </div>

      <div className="flex gap-8 flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 hide-scrollbar">
            <button
              onClick={() => setActiveTab("my-blogs")}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors whitespace-nowrap ${
                activeTab === "my-blogs"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-slate-400 hover:bg-surface hover:text-white"
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span>My Blogs</span>
            </button>

            <button
              onClick={() => setActiveTab("bookmarks")}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors whitespace-nowrap ${
                activeTab === "bookmarks"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-slate-400 hover:bg-surface hover:text-white"
              }`}
            >
              <Bookmark className="w-5 h-5" />
              <span>Bookmarks</span>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-surface border border-slate-800 rounded-xl p-6 min-h-[500px]">
          {activeTab === "my-blogs" && (
            <div>
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-primary" />
                Your Generated Blogs
              </h2>

              <div className="space-y-4">
                {myBlogs.map((blog) => (
                  <div
                    key={blog.id}
                    className="p-4 border border-slate-700 rounded-lg flex items-center justify-between hover:border-slate-500 transition-colors bg-background/50"
                  >
                    <div>
                      <h3 className="font-medium text-lg mb-1">{blog.title}</h3>
                      <div className="flex items-center text-sm text-slate-500 space-x-4">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {blog.date}
                        </span>

                        <span className="flex items-center">
                          {blog.status === "published" ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />
                              Published
                            </>
                          ) : (
                            <span className="text-yellow-500">Draft</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      {blog.status === "draft" && <Button size="sm">Publish</Button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "bookmarks" && (
            <div>
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Bookmark className="w-5 h-5 mr-2 text-primary" />
                Saved for Later
              </h2>

              <div className="space-y-4">
                {bookmarkedBlogs.map((blog) => (
                  <div
                    key={blog.id}
                    className="group p-4 border border-slate-700 rounded-lg flex items-center justify-between hover:border-slate-500 transition-colors bg-background/50 cursor-pointer"
                    onClick={() => (window.location.href = `/blog/${blog.id}`)}
                  >
                    <div>
                      <h3 className="font-medium text-lg mb-1 group-hover:text-primary transition-colors">{blog.title}</h3>
                      <p className="text-sm text-slate-500">By {blog.author}</p>
                    </div>

                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                      <Bookmark className="w-5 h-5 fill-current text-primary" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
