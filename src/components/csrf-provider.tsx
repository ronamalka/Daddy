"use client";

import { useEffect } from "react";
import { installCsrfInterceptor } from "@/lib/csrf";

/** Installs the CSRF header on fetch calls. Renders nothing. */
export function CsrfProvider() {
  useEffect(() => {
    installCsrfInterceptor();
  }, []);
  return null;
}
