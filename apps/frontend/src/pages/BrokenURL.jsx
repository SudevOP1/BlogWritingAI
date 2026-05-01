import { Unlink } from "lucide-react";

const BrokenURL = () => {
  return (
    <div className="flex flex-col gap-5 items-center justify-center w-full min-h-screen">
      <div className="max-w-xl w-full border border-slate-700/80 rounded-xl p-12 flex flex-col items-center gap-6">
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-red-600 text-white">
          <Unlink size={40} />
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-extrabold">
            <span className="text-red-500">404! </span>
            Page not found
          </h1>
          <p className="mt-2 text-gray-300">OOPS! We couldn't find the page you're looking for.</p>
        </div>
      </div>
    </div>
  );
};

export default BrokenURL;
