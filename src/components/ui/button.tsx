import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary-light))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[rgb(var(--color-primary))] text-white hover:bg-[rgb(var(--color-primary-hover))] shadow-sm hover:shadow-md active:scale-[0.98]",
        secondary:
          "bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))] hover:bg-[rgba(var(--color-primary),0.15)]",
        outline:
          "border border-[rgb(var(--color-border))] bg-transparent text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface-elevated))] hover:text-[rgb(var(--color-primary))]",
        ghost:
          "text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-elevated))] hover:text-[rgb(var(--color-text))]",
        destructive:
          "bg-[rgb(var(--color-error))] text-white hover:bg-[rgb(var(--color-error))]/90",
        link: "text-[rgb(var(--color-primary))] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        className: cn(buttonVariants({ variant, size, className }), (children as React.ReactElement<Record<string, unknown>>).props.className as string),
        ref,
        ...props,
      });
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
