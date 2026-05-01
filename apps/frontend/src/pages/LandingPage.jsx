import React from "react";
import Button from "../components/ui/Button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import HowItWorks from "../components/HowItWorks";

const LandingPage = () => {
  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 w-full border-b border-slate-800/50 bg-gradient-to-b from-background to-surface/20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
            <Sparkles className="mr-2 h-4 w-4" />
            AI-Powered Blog Generation
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
            Create compelling blogs in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">seconds.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            Enter a topic and let our advanced AI research, outline, and draft high-quality content for you. Perfectly formatted
            in Markdown.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/create-blog">
              <Button size="lg" className="w-full sm:w-auto group">
                Start Generating
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Feed Section */}
      <div className="w-full bg-background" id="feed">
        <HowItWorks />
      </div>
    </div>
  );
};

export default LandingPage;
