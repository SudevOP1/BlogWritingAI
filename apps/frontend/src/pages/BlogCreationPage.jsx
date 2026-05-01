import React, { useState } from "react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Send, Loader2, FileText, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const mockMarkdown = `
# This is a generated blog draft
Welcome to your new blog! The AI is currently typing this out...

## Key Points
- AI is fast
- Markdown is great
- Tailwind makes things pretty

### Here is some code
\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\`
`;

const BlogCreationPage = () => {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [currentStep, setCurrentStep] = useState("idle"); // idle, researching, outlining, drafting, done

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!topic) return;

    setIsGenerating(true);
    setCurrentStep("researching");
    setGeneratedContent("");

    // Mock generation process
    setTimeout(() => setCurrentStep("outlining"), 2000);
    setTimeout(() => setCurrentStep("drafting"), 4000);
    setTimeout(() => {
      setCurrentStep("done");
      setIsGenerating(false);
      setGeneratedContent(mockMarkdown);
    }, 6000);
  };

  const steps = [
    { id: "researching", label: "Researching topic" },
    { id: "outlining", label: "Creating outline" },
    { id: "drafting", label: "Drafting content" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-4rem)]">
      <div className="flex flex-col lg:flex-row gap-8 h-full">
        {/* Left Panel: Input & Controls */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-surface rounded-xl p-6 border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-semibold mb-2">Create New Blog</h2>
            <p className="text-slate-400 mb-6">Enter a topic and let our AI do the heavy lifting.</p>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Blog Topic</label>
                <Input
                  placeholder="e.g., The Future of Web Development..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <Button type="submit" className="w-full group" disabled={!topic || isGenerating} isLoading={isGenerating}>
                {isGenerating ? "Generating..." : "Generate Blog"}
                {!isGenerating && <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>
          </div>

          {/* Progress Indicators */}
          {(isGenerating || currentStep === "done") && (
            <div className="bg-surface rounded-xl p-6 border border-slate-800 shadow-xl flex-1">
              <h3 className="font-semibold mb-4 text-lg">Generation Progress</h3>
              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const stepIndex = steps.findIndex((s) => s.id === currentStep);
                  const isPast = stepIndex > idx || currentStep === "done";
                  const isCurrent = step.id === currentStep;

                  return (
                    <div key={step.id} className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                        ${
                          isPast
                            ? "border-green-500 bg-green-500/10"
                            : isCurrent
                              ? "border-primary bg-primary/10"
                              : "border-slate-700"
                        }`}
                      >
                        {isPast ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        ) : (
                          <span className="text-slate-500 text-sm">{idx + 1}</span>
                        )}
                      </div>
                      <span className={`text-sm ${isPast || isCurrent ? "text-slate-200" : "text-slate-500"}`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Output & Preview */}
        <div className="w-full lg:w-2/3 flex flex-col bg-surface/50 rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-surface/80">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-medium">Editor Preview</span>
            </div>
            {currentStep === "done" && (
              <Button size="sm" variant="outline">
                Save Draft
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
            {generatedContent ? (
              <article className="markdown-body max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedContent}</ReactMarkdown>
              </article>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                <FileText className="w-16 h-16 opacity-20" />
                <p>Your generated content will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCreationPage;
