"use client";

import { useEffect } from "react";
import { installCsrfInterceptor } from "@/lib/csrf";

export function CsrfProvider() {
  useEffect(() => {
    installCsrfInterceptor();
  }, []);
  return null;
}
