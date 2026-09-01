import { describe, it, expect } from "vitest";
import {
  directMessageSchema,
  orderMessageSchema,
  markReadSchema,
  attachSender,
  messagePreviewText,
} from "@/lib/message-validation";

const CUID = "clxyz1234567890abcdefghij";
const UPLOAD_JPG = "/uploads/550e8400-e29b-41d4-a716-446655440000.jpg";
const UPLOAD_PDF = "/uploads/550e8400-e29b-41d4-a716-446655440000.pdf";

describe("directMessageSchema", () => {
  it("accepts receiverId + content as sent by the seller profile UI", () => {
    const result = directMessageSchema.safeParse({
      receiverId: CUID,
      content: "שלום, מעוניין בשירות",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.receiverId).toBe(CUID);
      expect(result.data.content).toBe("שלום, מעוניין בשירות");
    }
  });

  it("trims content", () => {
    const result = directMessageSchema.safeParse({
      receiverId: CUID,
      content: "  hello  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe("hello");
    }
  });

  it("rejects the old orderId UUID payload", () => {
    const result = directMessageSchema.safeParse({
      orderId: "550e8400-e29b-41d4-a716-446655440000",
      content: "hello",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a remote or scripted attachment URL", () => {
    const result = directMessageSchema.safeParse({
      receiverId: CUID,
      content: "hello",
      attachment: "https://evil.example/x",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a same-origin upload path with a caption", () => {
    const result = directMessageSchema.safeParse({
      receiverId: CUID,
      content: "הברז",
      attachment: UPLOAD_JPG,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.attachment).toBe(UPLOAD_JPG);
    }
  });

  it("accepts a photo-only message", () => {
    const result = directMessageSchema.safeParse({
      receiverId: CUID,
      attachment: UPLOAD_JPG,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe("");
      expect(result.data.attachment).toBe(UPLOAD_JPG);
    }
  });

  it("rejects empty or whitespace content", () => {
    expect(directMessageSchema.safeParse({ receiverId: CUID, content: "" }).success).toBe(false);
    expect(directMessageSchema.safeParse({ receiverId: CUID, content: "   " }).success).toBe(false);
  });

  it("rejects content over 5000 characters", () => {
    const result = directMessageSchema.safeParse({
      receiverId: CUID,
      content: "a".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing receiverId", () => {
    const result = directMessageSchema.safeParse({ content: "hello" });
    expect(result.success).toBe(false);
  });
});

describe("orderMessageSchema", () => {
  it("accepts content for order-thread chat", () => {
    const result = orderMessageSchema.safeParse({ content: "עדכון על ההזמנה" });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    expect(orderMessageSchema.safeParse({ content: "  " }).success).toBe(false);
  });

  it("rejects a javascript: attachment URL", () => {
    const result = orderMessageSchema.safeParse({
      content: "hello",
      attachment: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a PDF upload path on an order thread", () => {
    const result = orderMessageSchema.safeParse({
      content: "",
      attachment: UPLOAD_PDF,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.attachment).toBe(UPLOAD_PDF);
    }
  });
});

describe("markReadSchema", () => {
  it("accepts order-scoped mark-read", () => {
    const result = markReadSchema.safeParse({ orderId: CUID });
    expect(result.success).toBe(true);
  });

  it("accepts DM-scoped mark-read", () => {
    const result = markReadSchema.safeParse({ senderId: CUID });
    expect(result.success).toBe(true);
  });

  it("rejects an empty body so unread cannot be wiped globally", () => {
    const result = markReadSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("attachSender", () => {
  it("adds the sender shape the order chat UI reads", () => {
    const message = {
      id: "clmsg1",
      content: "hey",
      senderId: "cluser1",
      receiverId: "cluser2",
    };

    const enriched = attachSender(message, {
      id: "cluser1",
      name: "Avi",
      image: "https://cdn.example/a.png",
    });

    expect(enriched.sender).toEqual({
      id: "cluser1",
      name: "Avi",
      avatar: "https://cdn.example/a.png",
    });
    expect(enriched.content).toBe("hey");
  });

  it("falls back when the session has no name", () => {
    const enriched = attachSender({ id: "m1" }, { id: "u1", name: null });
    expect(enriched.sender.name).toBe("משתמש");
    expect(enriched.sender.avatar).toBeNull();
  });
});

describe("messagePreviewText", () => {
  it("prefers the caption when both caption and file exist", () => {
    expect(messagePreviewText("הברז", UPLOAD_JPG)).toBe("הברז");
  });

  it("labels a photo-only message", () => {
    expect(messagePreviewText("  ", UPLOAD_JPG)).toBe("תמונה");
  });

  it("labels a PDF-only message", () => {
    expect(messagePreviewText("", UPLOAD_PDF)).toBe("קובץ PDF");
  });
});
