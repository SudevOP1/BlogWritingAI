import React, { forwardRef } from 'react';

const Input = forwardRef(({ className = '', error, ...props }, ref) => {
  return (
    <div className="flex flex-col w-full">
      <input
        ref={ref}
        className={`flex h-10 w-full rounded-md border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${
          error ? 'border-red-500 focus:ring-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-red-400 text-xs mt-1">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
