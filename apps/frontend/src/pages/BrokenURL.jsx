import { Link } from "react-router-dom";
import { Unlink } from "lucide-react";
import Button from "../components/ui/Button";

const BrokenURL = () => {
  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full px-4">
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

        <Link to="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default BrokenURL;
