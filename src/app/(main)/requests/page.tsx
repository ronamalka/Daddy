"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { OpenRequestsTeaser } from "@/components/home/open-requests-teaser";
import { RequestsView } from "@/components/home/requests-view";
import type { RequestTeaser, ServiceRequest } from "@/components/home/types";

/** Lists open service requests for sellers, or the signed-in buyer's own posts. Guests see a public teaser. */
export default function RequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [teasers, setTeasers] = useState<RequestTeaser[]>([]);
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
    if (status === "loading") return;
    if (status !== "authenticated") {
      setLoadingRequests(true);
      fetch("/api/service-requests/teaser")
        .then((res) => res.json())
        .then((data) => {
          setTeasers(Array.isArray(data) ? data : []);
          setLoadingRequests(false);
        })
        .catch(() => setLoadingRequests(false));
      return;
    }
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
      <OpenRequestsTeaser
        teasers={teasers}
        loading={loadingRequests}
        canOpenDetail={false}
        signedIn={false}
        alwaysShow
      />
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
