import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]",
        secondary:
          "bg-[rgb(var(--color-surface-elevated))] text-[rgb(var(--color-text-secondary))]",
        success:
          "bg-[rgba(var(--color-success),0.1)] text-[rgb(var(--color-success))]",
        warning:
          "bg-[rgba(var(--color-warning),0.15)] text-[rgb(var(--color-warning))]",
        destructive:
          "bg-[rgba(var(--color-error),0.1)] text-[rgb(var(--color-error))]",
        outline:
          "border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-secondary))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
