"use client";

import { OTPInput } from "input-otp";
import { cn } from "@/lib/utils";

interface SlotProps {
  char: string | null;
  isActive: boolean;
  hasFakeCaret: boolean;
}

function OtpSlot({ char, isActive, error }: SlotProps & { error?: boolean }) {
  return (
    <div
      className={cn(
        "relative h-14 w-12 rounded-xl border-2 text-xl font-bold",
        "flex items-center justify-center",
        "transition-all duration-150 select-none",
        error
          ? "border-error bg-error-light"
          : isActive
            ? "border-brand ring-2 ring-brand/20 bg-primary-50 scale-105"
            : char
              ? "border-brand bg-white text-text-primary"
              : "border-border bg-white",
      )}
    >
      {char ?? (isActive ? (
        <span className="animate-pulse text-brand text-2xl leading-none font-thin">|</span>
      ) : null)}
    </div>
  );
}

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  maxLength?: number;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, error, maxLength = 6, disabled }: OtpInputProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <OTPInput
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        disabled={disabled}
        containerClassName="flex items-center gap-2 sm:gap-3"
        render={({ slots }) => (
          <>
            {slots.map((slot, i) => (
              <OtpSlot key={i} {...slot} error={error} />
            ))}
          </>
        )}
      />
      {error && (
        <p className="text-sm text-error">Code incorrect. Veuillez réessayer.</p>
      )}
    </div>
  );
}
