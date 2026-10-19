import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean;
}

// 共用文字輸入框，傳入 error 可切換成錯誤樣式（紅框）
function Input({ className, type, error, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-lg border bg-background px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground disabled:pointer-events-none disabled:opacity-50",
        // normal
        !error &&
          "border-input focus-visible:border-blue-500 focus-visible:ring-3 focus-visible:ring-blue-500/20",
        // error
        error &&
          "border-red-500 ring-3 ring-red-500/20 focus-visible:border-red-500 focus-visible:ring-red-500/30",
        // aria-invalid fallback
        "aria-invalid:border-red-500 aria-invalid:ring-3 aria-invalid:ring-red-500/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
