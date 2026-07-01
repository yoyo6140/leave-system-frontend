import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const cardVariants = cva("border border-border bg-white rounded-2xl", {
  variants: {
    variant: {
      default: "shadow-sm",
      elevated: "shadow-md hover:shadow-lg transition-shadow duration-200",
      flat: "",
      dashed: "border-dashed shadow-none",
    },
    padding: {
      none: "",
      sm: "p-4",
      default: "p-5",
      lg: "p-6",
      xl: "p-8",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "default",
  },
});

function Card({
  className,
  variant,
  padding,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="card"
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  );
}

export { Card, cardVariants };
