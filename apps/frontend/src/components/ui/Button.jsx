import React from "react";
import { Loader2 } from "lucide-react";
import Loader from "./Loader";

const Button = ({ children, variant = "primary", size = "md", isLoading = false, className = "", ...props }) => {
  const baseStyles = `inline-flex items-center justify-center font-medium transition-colors
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background
    disabled:opacity-50 disabled:pointer-events-none rounded-lg cursor-pointer`;

  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover focus:ring-primary disabled:bg-disabled",
    secondary: "bg-surface text-white hover:bg-surface-hover focus:ring-slate-500",
    outline: "border border-slate-700 hover:bg-surface focus:ring-slate-500 text-slate-200",
    ghost: "hover:bg-surface text-slate-300 hover:text-white focus:ring-slate-500",
  };

  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-11 px-8 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader size={size} className="mr-2" />}
      {children}
    </button>
  );
};

export default Button;
