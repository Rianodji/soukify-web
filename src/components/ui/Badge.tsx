import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default:   "bg-primary-100 text-primary-800",
        success:   "bg-success-light text-success",
        warning:   "bg-warning-light text-warning",
        error:     "bg-error-light text-error",
        gold:      "bg-accent-100 text-accent-700",
        neutral:   "bg-border text-text-secondary",
        outline:   "border border-border text-text-secondary bg-white",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
