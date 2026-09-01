"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Repeat } from "@phosphor-icons/react";
import {
  FREQUENCY_LABELS_HE,
  STANDING_STATUS_LABELS_HE,
  type StandingFrequency,
  type StandingStatus,
} from "@/lib/standing-job";
import { DAY_LABELS_HE, minutesToTimeLabel } from "@/lib/availability";

type StandingListItem = {
  id: string;
  title: string;
  frequency: StandingFrequency;
  weekday: number;
  startMin: number;
  status: StandingStatus;
  buyerId: string;
  sellerId: string;
  orders?: { id: string; status: string; slotStart: string | null }[];
};

/** Lists standing jobs the user buys or provides. */
export default function StandingJobsPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<StandingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/standing-jobs")
      .then((res) => res.json())
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-[15px] text-[rgb(var(--color-text-secondary))]">
        התחבר כדי לצפות בעבודות קבועות.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-[32px] font-bold text-[rgb(var(--color-text))]">עבודות קבועות</h1>
      <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">
        ביקורים חוזרים עם אותו אבא. אפשר להשהות או לבטל רק את העתיד.
      </p>

      {jobs.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] py-16 text-center">
          <Repeat className="mx-auto mb-3 h-10 w-10 text-[rgb(var(--color-primary))]" />
          <p className="text-[16px] font-medium text-[rgb(var(--color-text))]">אין עדיין עבודה קבועה</p>
          <p className="mt-1 text-[14px] text-[rgb(var(--color-text-muted))]">
            אחרי ביקור שהושלם, או ממחירון האבא, אפשר לקבוע חזרה שבועית.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/standing-jobs/${job.id}`}
                className="block rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 hover:border-[rgba(var(--color-primary-light),0.3)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-[rgb(var(--color-text))]">{job.title}</h2>
                    <p className="mt-1 text-[13px] text-[rgb(var(--color-text-secondary))]">
                      {FREQUENCY_LABELS_HE[job.frequency]} · יום {DAY_LABELS_HE[job.weekday]} · {minutesToTimeLabel(job.startMin)}
                    </p>
                  </div>
                  <span className="rounded-full bg-[rgb(var(--color-bg))] px-3 py-1 text-[12px] font-semibold text-[rgb(var(--color-text-secondary))]">
                    {STANDING_STATUS_LABELS_HE[job.status]}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
