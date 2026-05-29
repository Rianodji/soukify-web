"use client";

import { cn } from "@/lib/utils";
import { forwardRef, useState } from "react";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  error?: string;
  onChange?: (normalized: string, display: string) => void;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, label, error, onChange, ...props }, ref) => {
    const [display, setDisplay] = useState("");

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
      const formatted = raw
        .replace(/^(\d{2})/, "$1 ")
        .replace(/^(\d{2} \d{2})/, "$1 ")
        .replace(/^(\d{2} \d{2} \d{2})/, "$1 ")
        .trim();
      setDisplay(formatted);
      onChange?.(raw.length === 8 ? `+235${raw}` : raw, formatted);
    }

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-text-primary">{label}</label>
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
          <div className="flex items-center gap-1.5 pl-3 pr-2 shrink-0 border-r border-border mr-1">
            <span className="text-base leading-none">🇹🇩</span>
            <span className="text-sm font-medium text-text-secondary">+235</span>
          </div>
          <input
            ref={ref}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="66 12 34 56"
            value={display}
            onChange={handleChange}
            className={cn(
              "flex-1 h-full bg-transparent px-3 text-sm text-text-primary placeholder:text-text-disabled outline-none tracking-wide",
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    );
  },
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
