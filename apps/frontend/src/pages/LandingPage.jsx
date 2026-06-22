import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

import Button from "../components/ui/Button";
import HowItWorks from "../components/HowItWorks";
import img from "../assets/img.png";

const LandingPage = () => {
  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section */}
      <div className="flex items-center min-h-[80vh] px-4 md:px-8 w-full border-b border-slate-800/50 bg-gradient-to-b from-background to-surface/20 py-16 lg:py-0">
        <div className="flex flex-col-reverse lg:flex-row justify-between items-center w-full max-w-7xl mx-auto gap-12 lg:gap-8">
          <div className="max-w-3xl text-center lg:text-left space-y-8">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
              <Sparkles className="mr-2 h-4 w-4" />
              AI-Powered Blog Generation
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
              Create compelling blogs in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">seconds.</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0">
              Enter a topic and let our advanced AI research, outline, and draft high-quality content for you. Perfectly formatted
              in Markdown.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link to="/create-blog" className="w-full sm:w-auto">
                <Button size="lg" variant="primary" className="w-full text-sm md:text-base group">
                  Start Generating
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/feed" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full text-sm md:text-base group">
                  Explore Feed
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
          <img
            src={img}
            alt="AI Blog Generation"
            className="w-full max-w-[300px] md:max-w-[400px] lg:max-w-[500px] object-contain drop-shadow-2xl"
          />
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
