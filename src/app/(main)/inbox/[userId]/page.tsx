"use client";

import { useParams } from "next/navigation";
import { MessengerInbox } from "@/components/inbox/messenger";

export default function InboxThreadPage() {
  const params = useParams();
  const peerId = typeof params.userId === "string" ? params.userId : params.userId?.[0];
  return <MessengerInbox peerId={peerId} />;
}
