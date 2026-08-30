"use client";

import { useParams } from "next/navigation";
import { MessengerInbox } from "@/components/inbox/messenger";

/** Shows a chat thread with one other user. */
export default function InboxThreadPage() {
  const params = useParams();
  const peerId = typeof params.userId === "string" ? params.userId : params.userId?.[0];
  return <MessengerInbox peerId={peerId} />;
}
