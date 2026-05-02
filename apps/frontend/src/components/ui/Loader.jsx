import { Loader as LoaderIcon } from "lucide-react";

const Loader = ({ size = "md", className = "", ...props }) => {
  const baseStyles = `animate-spin`;

  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return <LoaderIcon className={`${sizes[size]} ${baseStyles} ${className}`} {...props} />;
};

export default Loader;
