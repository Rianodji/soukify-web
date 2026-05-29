import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon";
}

const sizes = {
  sm: { icon: 28, text: "text-lg" },
  md: { icon: 36, text: "text-2xl" },
  lg: { icon: 44, text: "text-3xl" },
  xl: { icon: 56, text: "text-4xl" },
};

export function SoukifyLogo({ className, size = "md", variant = "full" }: LogoProps) {
  const { icon, text } = sizes[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Gradient background circle */}
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0d9488" />
            <stop offset="1" stopColor="#0f766e" />
          </linearGradient>
          <linearGradient id="accentGrad" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fbbf24" />
            <stop offset="1" stopColor="#d97706" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="12" fill="url(#logoGrad)" />
        {/* S letter stylized */}
        <path
          d="M13 16.5C13 14 15 12 18.5 12C21.5 12 23.5 13.5 24 15.5H21C20.7 14.8 19.8 14 18.5 14C17 14 15.5 14.8 15.5 16.5C15.5 18 16.8 18.8 19 19.5C22 20.5 27 21.5 27 25.5C27 28.5 24.5 30 21 30C17.5 30 15 28 14.5 25.5H17.5C17.8 27 19.2 28 21 28C23 28 24.5 27 24.5 25.5C24.5 23.5 22.8 23 20 22C17 21 13 19.5 13 16.5Z"
          fill="white"
        />
        {/* Gold dot accent */}
        <circle cx="31" cy="11" r="5" fill="url(#accentGrad)" />
        <path d="M29.5 11L30.5 12L32.5 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {variant === "full" && (
        <span className={cn("font-bold tracking-tight text-text-primary", text)}>
          Souki<span className="text-brand">fy</span>
        </span>
      )}
    </div>
  );
}
