"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserCircle } from "@phosphor-icons/react";
import { RequestsView } from "@/components/home/requests-view";
import type { ServiceRequest } from "@/components/home/types";

/** Lists open service requests for sellers, or the signed-in buyer's own posts. */
export default function RequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState("");

  /** Loads open service requests, optionally filtered by district. */
  function loadRequests(district?: string) {
    setLoadingRequests(true);
    const params = new URLSearchParams();
    const nextDistrict = district !== undefined ? district : selectedDistrict;
    if (nextDistrict) params.set("district", nextDistrict);
    fetch(`/api/service-requests?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setRequests(Array.isArray(data) ? data : []);
        setLoadingRequests(false);
      })
      .catch(() => setLoadingRequests(false));
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoadingRequests(true);
    fetch("/api/service-requests")
      .then((res) => res.json())
      .then((data) => {
        setRequests(Array.isArray(data) ? data : []);
        setLoadingRequests(false);
      })
      .catch(() => setLoadingRequests(false));
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.2)] border-t-[rgb(var(--color-primary))]" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mb-4 inline-block rounded-full bg-[rgba(var(--color-primary),0.1)] p-4">
          <UserCircle className="h-8 w-8 text-[rgb(var(--color-primary))]" />
        </div>
        <h2 className="text-[20px] font-bold text-[rgb(var(--color-text))]">צריך להתחבר</h2>
        <p className="mt-2 text-[14px] text-[rgb(var(--color-text-secondary))]">
          כדי לראות בקשות שירות פתוחות, צריך קודם להתחבר
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-xl bg-[rgb(var(--color-primary))] px-6 py-3 text-[14px] font-bold text-white"
        >
          התחברות
        </Link>
      </div>
    );
  }

  return (
    <RequestsView
      requests={requests}
      loadingRequests={loadingRequests}
      selectedDistrict={selectedDistrict}
      setSelectedDistrict={setSelectedDistrict}
      loadRequests={loadRequests}
      resetSearch={() => router.push("/")}
    />
  );
}
