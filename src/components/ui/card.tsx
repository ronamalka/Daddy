import * as React from "react";
import { cn } from "@/lib/utils";

/** Card container with a light hover lift. */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-sm transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

/** Top padding block for a card's title and description. */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

/** Heading inside a card header. */
const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold text-[rgb(var(--color-text))]", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

/** Muted supporting text under a card title. */
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-[rgb(var(--color-text-muted))]", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

/** Main body of a card below the header. */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

/** Bottom row of a card, often used for actions. */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
