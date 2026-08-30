"use client";

import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";

/** Counts up to a number when the element scrolls into view. */
export function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, value]);

  const display = Number.isInteger(value)
    ? Math.round(count).toLocaleString()
    : count.toFixed(1);
  return <span ref={ref}>{display}{suffix}</span>;
}
