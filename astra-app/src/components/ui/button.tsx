import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const variantStyles = {
  primary: "bg-astra-gold text-black hover:opacity-90",
  secondary:
    "bg-white/10 text-white hover:bg-white/15 border border-astra-border",
  ghost: "text-astra-text-secondary hover:text-white hover:bg-white/5",
  danger: "bg-red-500/15 text-red-400 hover:bg-red-500/25",
} as const;

const sizeStyles = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
} as const;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
  loading,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Chargement...
        </>
      ) : (
        children
      )}
    </button>
  );
}
