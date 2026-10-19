import * as React from "react";
import { cn } from "@/lib/utils";

// 表單欄位的外層容器，統一標籤與輸入框間的間距
function Field({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  );
}

// 表單欄位的標籤文字
function FieldLabel({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="field-label"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  );
}

export { Field, FieldLabel };
