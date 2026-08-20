"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

export function SectionHeader({ title, subtitle, className }: { title: string; subtitle: string; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className={cn("text-center mb-12", className)}
    >
      <h2 className="text-3xl font-extrabold text-[rgb(var(--color-text))] md:text-4xl tracking-tight">{title}</h2>
      <p className="mt-3 text-[rgb(var(--color-text-secondary))] text-base max-w-lg mx-auto">{subtitle}</p>
    </motion.div>
  );
}
