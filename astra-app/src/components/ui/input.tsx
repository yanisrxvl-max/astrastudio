import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...rest }: InputProps) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-astra-text-muted">
          {label}
        </label>
      )}
      <input
        className={cn(
          "h-11 w-full rounded-xl border border-astra-border bg-astra-bg px-4 text-white placeholder:text-astra-text-muted transition-colors focus:border-astra-gold focus:ring-1 focus:ring-astra-gold/30 focus:outline-none",
          error && "border-red-400",
          className
        )}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...rest }: TextareaProps) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-astra-text-muted">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "min-h-[100px] w-full resize-y rounded-xl border border-astra-border bg-astra-bg px-4 py-3 text-white placeholder:text-astra-text-muted transition-colors focus:border-astra-gold focus:ring-1 focus:ring-astra-gold/30 focus:outline-none",
          error && "border-red-400",
          className
        )}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({
  label,
  error,
  className,
  children,
  ...rest
}: SelectProps) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-astra-text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={cn(
            "h-11 w-full appearance-none rounded-xl border border-astra-border bg-astra-bg px-4 pr-10 text-white transition-colors focus:border-astra-gold focus:ring-1 focus:ring-astra-gold/30 focus:outline-none",
            error && "border-red-400",
            className
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-astra-text-muted" />
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
