import { motion } from "framer-motion";
import { Search, Globe, PenTool, CheckCircle, CircleQuestionMark, ListTodo, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "./ui/Button";

const steps = [
  {
    title: "Topic Analysis",
    description: "The AI analyzes your topic and determines the best approach for high-quality content.",
    icon: Search,
    color: "from-cyan-300 to-blue-500",
  },
  {
    title: "Smart Research",
    description: "It performs deep internet research to gather the latest information and evidence.",
    icon: Globe,
    color: "from-fuchsia-300 to-violet-500",
  },
  {
    title: "Strategic Planning",
    description: "An orchestrator creates a detailed structure and section-by-section plan.",
    icon: ListTodo,
    color: "from-yellow-300 to-orange-500",
  },
  {
    title: "AI Writing",
    description: "Specialized agents write each section with precision, following the strategy.",
    icon: PenTool,
    color: "from-lime-300 to-emerald-500",
  },
  {
    title: "Final Polish",
    description: "The blog is compiled into a perfectly formatted Markdown file, ready for you.",
    icon: CheckCircle,
    color: "from-pink-300 to-rose-500",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 max-w-6xl mx-auto px-8 relative overflow-hidden" id="how-it-works">
      {/* Background blobs for premium look */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-flex flex-row items-center justify-center gap-2 rounded-full border border-primary/30
              bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4"
          >
            <CircleQuestionMark className="w-4 h-4" />
            Process
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white tracking-tight"
          >
            How it <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Works</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-slate-400 text-lg max-w-2xl mx-auto"
          >
            Our multi-agent AI pipeline collaborates in real-time to transform your ideas into professional, research-backed blog
            posts.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-slate-800 -z-10" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative flex flex-col items-center text-center group"
            >
              {/* Step Icon Container */}
              <div className="mb-6 relative">
                <div
                  className={`w-24 h-24 rounded-[22px] bg-gradient-to-br ${step.color} p-0.5 shadow-2xl
                    group-hover:scale-110 transition duration-500 ease-out`}
                >
                  <div
                    className="w-full h-full bg-slate-900 rounded-[20px] flex items-center
                      justify-center relative overflow-hidden"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${step.color}
                        opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                    />
                    <step.icon className="w-10 h-10 text-white relative z-10" />
                  </div>
                </div>

                {/* Step Number Badge */}
                <div
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-surface/70 backdrop-blur-xs
                    border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shadow-xl
                    transition duration-500 ease-out group-hover:translate-x-1 group-hover:-translate-y-1"
                >
                  0{index + 1}
                </div>
              </div>

              <div className="space-y-3 px-2">
                <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
              </div>

              {/* Progress arrow for mobile */}
              {index < steps.length - 1 && <div className="md:hidden my-4 text-slate-800">↓</div>}
            </motion.div>
          ))}
        </div>

        {/* Improved Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-24 relative"
        >
          <div className="bg-surface/40 border border-slate-800 rounded-[32px] p-10 md:p-16 overflow-hidden relative backdrop-blur-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="text-center md:text-left space-y-2">
                <h3 className="text-xl md:text-3xl font-bold text-white tracking-tight">
                  Stop writing, start{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">generating.</span>
                </h3>
                <p className="text-slate-400 text-sm md:text-lg max-w-xl">
                  Join creators who are using AI to produce high-quality, research-backed content in a fraction of the time.
                </p>
              </div>
              <Link to="/create-blog">
                <Button size="md" className="px-6 py-4 rounded-2xl group text-xl h-auto">
                  Start Creating Now
                  <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
