"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-white hover:bg-brand-hover active:scale-[0.98] focus-visible:ring-brand shadow-sm hover:shadow-brand",
        secondary:
          "bg-white text-text-primary border border-border hover:bg-primary-50 hover:border-brand active:scale-[0.98] focus-visible:ring-brand",
        ghost:
          "text-text-secondary hover:text-text-primary hover:bg-primary-50 focus-visible:ring-brand",
        danger:
          "bg-error text-white hover:bg-red-700 active:scale-[0.98] focus-visible:ring-error",
        link:
          "text-brand underline-offset-4 hover:underline p-0 h-auto focus-visible:ring-brand",
        gold:
          "bg-gold text-white hover:bg-accent-700 active:scale-[0.98] focus-visible:ring-gold shadow-sm",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {children}
    </button>
  ),
);

Button.displayName = "Button";

export { Button, buttonVariants };
