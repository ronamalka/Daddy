"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface DropdownMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}

export function DropdownMenu({
  open,
  onOpenChange,
  trigger,
  children,
  align = "start",
  className,
}: DropdownMenuProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onOpenChange]);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => onOpenChange(!open)}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl py-1",
              "bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))]",
              "shadow-lg",
              align === "end" ? "left-0" : "right-0",
              className
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "destructive";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors duration-150",
        variant === "destructive"
          ? "text-[rgb(var(--color-error))] hover:bg-[rgba(var(--color-error),0.05)]"
          : "text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-elevated))] hover:text-[rgb(var(--color-text))]",
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 border-t border-[rgb(var(--color-border-light))]" />;
}

export function DropdownMenuLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-4 py-2.5 border-b border-[rgb(var(--color-border-light))]",
        className
      )}
    >
      {children}
    </div>
  );
}
