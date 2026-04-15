"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

type FileDropzoneProps = {
  accept: string;
  disabled?: boolean;
  onFiles: (files: FileList | File[]) => void;
  hint?: string;
  subhint?: string;
  className?: string;
};

/**
 * Zone drag & drop réutilisable (même principe que la livraison admin : bordure dorée en pointillés).
 */
export function FileDropzone({
  accept,
  disabled,
  onFiles,
  hint = "Glissez vos fichiers ici ou cliquez pour parcourir",
  subhint,
  className,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-colors",
        dragOver
          ? "border-astra-gold/60 bg-astra-gold-soft"
          : "border-astra-border hover:border-astra-gold/50",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (disabled || !e.dataTransfer.files?.length) return;
        onFiles(e.dataTransfer.files);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <Upload className="mb-3 h-8 w-8 text-astra-text-muted" aria-hidden />
      <p className="text-center text-sm text-astra-text-secondary">{hint}</p>
      {subhint ? (
        <p className="mt-1 text-center text-xs text-astra-text-muted">{subhint}</p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
