"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed inset-y-0 right-0 z-50 w-[85%] max-w-sm",
              "bg-[rgb(var(--color-surface))] shadow-2xl"
            )}
          >
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 left-4 rounded-full p-2 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface-elevated))] hover:text-[rgb(var(--color-text))] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="h-full overflow-y-auto px-6 py-16">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
