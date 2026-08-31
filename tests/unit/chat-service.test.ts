import { describe, it, expect } from "vitest";
import {
  createInMemoryRepo,
  sendMessage,
  listMessages,
  listConversations,
  unreadCount,
  markRead,
} from "../../services/chat/src/chat";

const buyer = "seed-user-buyer1";
const seller = "seed-user-seller1";
const stranger = "seed-user-buyer2";
const orderId = "ord-1";

describe("chat service send/receive", () => {
  it("lets a buyer and a dad exchange order-thread messages", async () => {
    const repo = createInMemoryRepo();

    const fromBuyer = await sendMessage(repo, {
      senderId: buyer,
      receiverId: seller,
      content: "אפשר מחר בבוקר?",
      orderId,
    });
    expect(fromBuyer.ok).toBe(true);
    if (!fromBuyer.ok) return;
    expect(fromBuyer.status).toBe(201);
    expect(fromBuyer.data.senderId).toBe(buyer);
    expect(fromBuyer.data.receiverId).toBe(seller);
    expect(fromBuyer.data.orderId).toBe(orderId);

    const fromSeller = await sendMessage(repo, {
      senderId: seller,
      receiverId: buyer,
      content: "בטח, תשע בבוקר.",
      orderId,
    });
    expect(fromSeller.ok).toBe(true);

    const buyerView = await listMessages(repo, { userId: buyer, orderId });
    const sellerView = await listMessages(repo, { userId: seller, orderId });
    expect(buyerView.ok && sellerView.ok).toBe(true);
    if (!buyerView.ok || !sellerView.ok) return;

    expect(buyerView.data.map((m) => m.content)).toEqual([
      "אפשר מחר בבוקר?",
      "בטח, תשע בבוקר.",
    ]);
    expect(sellerView.data.map((m) => m.content)).toEqual(buyerView.data.map((m) => m.content));
  });

  it("does not show an order thread to someone who is not a party", async () => {
    const repo = createInMemoryRepo();
    await sendMessage(repo, {
      senderId: buyer,
      receiverId: seller,
      content: "private",
      orderId,
    });

    const outsider = await listMessages(repo, { userId: stranger, orderId });
    expect(outsider.ok).toBe(true);
    if (!outsider.ok) return;
    expect(outsider.data).toEqual([]);
  });

  it("lets an admin read an order thread they are not a party of", async () => {
    const repo = createInMemoryRepo();
    await sendMessage(repo, {
      senderId: buyer,
      receiverId: seller,
      content: "admin can see this",
      orderId,
    });

    const adminView = await listMessages(repo, {
      userId: "seed-user-admin",
      role: "ADMIN",
      orderId,
    });
    expect(adminView.ok).toBe(true);
    if (!adminView.ok) return;
    expect(adminView.data).toHaveLength(1);
  });

  it("supports seller-profile DMs that are not tied to an order", async () => {
    const repo = createInMemoryRepo();

    const sent = await sendMessage(repo, {
      senderId: buyer,
      receiverId: seller,
      content: "יש לך מקום ביום חמישי?",
    });
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;
    expect(sent.data.orderId).toBeNull();

    const thread = await listMessages(repo, { userId: seller, withUser: buyer });
    expect(thread.ok).toBe(true);
    if (!thread.ok) return;
    expect(thread.data).toHaveLength(1);
    expect(thread.data[0].content).toBe("יש לך מקום ביום חמישי?");
  });

  it("tracks unread count and mark-read per order", async () => {
    const repo = createInMemoryRepo();
    await sendMessage(repo, {
      senderId: seller,
      receiverId: buyer,
      content: "התחלתי לעבוד",
      orderId,
    });

    const before = await unreadCount(repo, buyer);
    expect(before.ok && before.data.count).toBe(1);

    const marked = await markRead(repo, { userId: buyer, orderId });
    expect(marked.ok && marked.data.marked).toBe(1);

    const after = await unreadCount(repo, buyer);
    expect(after.ok && after.data.count).toBe(0);
  });

  it("rejects empty content, self-messages, and unscoped mark-read", async () => {
    const repo = createInMemoryRepo();

    const empty = await sendMessage(repo, {
      senderId: buyer,
      receiverId: seller,
      content: "   ",
    });
    expect(empty).toMatchObject({ ok: false, status: 400 });

    const self = await sendMessage(repo, {
      senderId: buyer,
      receiverId: buyer,
      content: "hello me",
    });
    expect(self).toMatchObject({ ok: false, status: 400, error: "Cannot message yourself" });

    const unscoped = await markRead(repo, { userId: buyer });
    expect(unscoped).toMatchObject({ ok: false, status: 400 });
  });

  it("persists an allowlisted photo and rejects a remote URL", async () => {
    const repo = createInMemoryRepo();
    const path = "/uploads/550e8400-e29b-41d4-a716-446655440000.jpg";

    const photo = await sendMessage(repo, {
      senderId: buyer,
      receiverId: seller,
      content: "",
      attachment: path,
    });
    expect(photo.ok).toBe(true);
    if (!photo.ok) return;
    expect(photo.data.content).toBe("");
    expect(photo.data.attachment).toBe(path);

    const remote = await sendMessage(repo, {
      senderId: buyer,
      receiverId: seller,
      content: "look",
      attachment: "https://evil.example/x.jpg",
    });
    expect(remote).toMatchObject({ ok: false, status: 400, error: "Invalid attachment" });
  });

  it("keeps every message between two people in a single conversation", async () => {
    const repo = createInMemoryRepo();
    await sendMessage(repo, {
      senderId: buyer,
      receiverId: seller,
      content: "היי, ראיתי את הפרופיל",
    });
    await sendMessage(repo, {
      senderId: buyer,
      receiverId: seller,
      content: "אפשר מחר בבוקר?",
      orderId,
    });
    await sendMessage(repo, {
      senderId: buyer,
      receiverId: seller,
      content: "וגם לגבי ההתמקחות",
      orderId: "ord-4",
    });
    await sendMessage(repo, {
      senderId: stranger,
      receiverId: seller,
      content: "שאלה אחרת",
    });

    const buyerInbox = await listConversations(repo, buyer);
    expect(buyerInbox.ok).toBe(true);
    if (!buyerInbox.ok) return;
    expect(buyerInbox.data).toHaveLength(1);
    expect(buyerInbox.data[0].otherUserId).toBe(seller);
    expect(buyerInbox.data[0].lastMessage.content).toBe("וגם לגבי ההתמקחות");

    const sellerInbox = await listConversations(repo, seller);
    expect(sellerInbox.ok).toBe(true);
    if (!sellerInbox.ok) return;
    expect(sellerInbox.data.map((c) => c.otherUserId).sort()).toEqual([buyer, stranger].sort());
    const danaThread = sellerInbox.data.find((c) => c.otherUserId === buyer);
    expect(danaThread?.unreadCount).toBe(3);

    const thread = await listMessages(repo, { userId: seller, withUser: buyer });
    expect(thread.ok).toBe(true);
    if (!thread.ok) return;
    expect(thread.data).toHaveLength(3);

    const marked = await markRead(repo, { userId: seller, senderId: buyer });
    expect(marked.ok && marked.data.marked).toBe(3);
    const after = await unreadCount(repo, seller);
    expect(after.ok && after.data.count).toBe(1);
  });
});
