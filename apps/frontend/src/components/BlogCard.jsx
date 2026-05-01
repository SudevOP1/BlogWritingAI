import React from 'react';
import { Heart, MessageSquare, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';

const BlogCard = ({ blog }) => {
  return (
    <div className="bg-surface border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-colors group cursor-pointer flex flex-col h-full">
      <Link to={`/blog/${blog.id}`} className="flex-1 p-6 flex flex-col">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">
            {blog.author?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="text-sm">
            <p className="text-slate-200 font-medium">{blog.author?.username || 'Anonymous'}</p>
            <p className="text-slate-500 text-xs">{new Date(blog.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {blog.title}
        </h3>
        
        <p className="text-slate-400 text-sm mb-6 flex-1 line-clamp-3">
          {blog.content.replace(/#|\*|\[|\]/g, '').substring(0, 150)}...
        </p>
        
        <div className="flex items-center justify-between text-slate-500 pt-4 border-t border-slate-800/50">
          <div className="flex items-center space-x-4 text-sm">
            <span className="flex items-center hover:text-red-400 transition-colors">
              <Heart className="w-4 h-4 mr-1.5" />
              {blog.likes_count || 0}
            </span>
            <span className="flex items-center hover:text-blue-400 transition-colors">
              <MessageSquare className="w-4 h-4 mr-1.5" />
              {blog.comments_count || 0}
            </span>
          </div>
          <button className="hover:text-primary transition-colors p-1" aria-label="Bookmark">
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </Link>
    </div>
  );
};

export default BlogCard;
