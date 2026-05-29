"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, prefix, suffix, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "flex items-center h-12 rounded-lg border bg-white transition-all duration-150",
            "focus-within:ring-2 focus-within:ring-brand focus-within:border-brand",
            error
              ? "border-error focus-within:ring-error"
              : "border-border hover:border-brand",
          )}
        >
          {prefix && (
            <div className="flex items-center pl-3 pr-2 text-text-secondary shrink-0">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "flex-1 h-full bg-transparent px-3 text-sm text-text-primary placeholder:text-text-disabled outline-none",
              prefix && "pl-0",
              suffix && "pr-0",
              className,
            )}
            {...props}
          />
          {suffix && (
            <div className="flex items-center pl-2 pr-3 text-text-secondary shrink-0">
              {suffix}
            </div>
          )}
        </div>
        {(error || hint) && (
          <p className={cn("text-xs", error ? "text-error" : "text-text-secondary")}>
            {error ?? hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
