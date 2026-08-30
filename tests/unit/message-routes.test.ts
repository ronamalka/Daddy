import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/gateway", () => ({
  proxyRequest: vi.fn(),
  ORDERS_SERVICE: "http://orders.test",
  CHAT_SERVICE: "http://chat.test",
  USERS_SERVICE: "http://users.test",
  GIGS_SERVICE: "http://gigs.test",
}));

import { auth } from "@/lib/auth";
import { proxyRequest } from "@/lib/gateway";
import { POST as postDm } from "@/app/api/messages/route";
import { POST as postOrderMessage } from "@/app/api/orders/[id]/messages/route";
import { POST as postMarkRead } from "@/app/api/messages/mark-read/route";

const mockedAuth = vi.mocked(auth);
const mockedProxy = vi.mocked(proxyRequest);

const user = { id: "cluser1", email: "avi@example.com", name: "Avi", role: "BUYER" };

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedAuth.mockResolvedValue({ user } as never);
});

describe("POST /api/messages", () => {
  it("returns 401 when logged out", async () => {
    mockedAuth.mockResolvedValue(null as never);
    const res = await postDm(jsonRequest("http://localhost/api/messages", {
      receiverId: "clseller1",
      content: "hi",
    }));
    expect(res.status).toBe(401);
    expect(mockedProxy).not.toHaveBeenCalled();
  });

  it("proxies receiverId to the chat service", async () => {
    mockedProxy.mockResolvedValue({ data: { id: "clmsg1" }, status: 201 });
    const res = await postDm(jsonRequest("http://localhost/api/messages", {
      receiverId: "clseller1",
      content: "hi",
    }));
    expect(res.status).toBe(201);
    expect(mockedProxy).toHaveBeenCalledWith(
      "http://chat.test",
      "/messages",
      expect.objectContaining({
        method: "POST",
        body: { receiverId: "clseller1", content: "hi" },
      })
    );
  });

  it("returns 400 for the old orderId payload", async () => {
    const res = await postDm(jsonRequest("http://localhost/api/messages", {
      orderId: "550e8400-e29b-41d4-a716-446655440000",
      content: "hi",
    }));
    expect(res.status).toBe(400);
    expect(mockedProxy).not.toHaveBeenCalled();
  });
});

describe("POST /api/orders/:id/messages", () => {
  it("checks order membership then posts to the chat service with a sender the UI can render", async () => {
    mockedProxy.mockImplementation(async (url: string, path: string, options?: { method?: string }) => {
      if (url === "http://orders.test" && path === "/orders/clorder1") {
        return {
          data: { id: "clorder1", buyerId: "cluser1", sellerId: "clseller1" },
          status: 200,
        };
      }
      if (url === "http://chat.test" && options?.method === "POST") {
        return {
          data: {
            id: "clmsg1",
            content: "hey",
            senderId: "cluser1",
            receiverId: "clseller1",
            orderId: "clorder1",
          },
          status: 201,
        };
      }
      return { data: null, status: 500 };
    });

    const res = await postOrderMessage(
      jsonRequest("http://localhost/api/orders/clorder1/messages", { content: "hey" }),
      { params: Promise.resolve({ id: "clorder1" }) }
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.sender).toEqual({
      id: "cluser1",
      name: "Avi",
      avatar: null,
    });
    expect(body.content).toBe("hey");
    expect(mockedProxy).toHaveBeenCalledWith(
      "http://chat.test",
      "/messages",
      expect.objectContaining({
        method: "POST",
        body: { content: "hey", orderId: "clorder1", receiverId: "clseller1" },
      })
    );
  });

  it("does not post to chat when the caller is not on the order", async () => {
    mockedProxy.mockResolvedValue({
      data: { id: "clorder1", buyerId: "someone-else", sellerId: "clseller1" },
      status: 200,
    });
    const res = await postOrderMessage(
      jsonRequest("http://localhost/api/orders/clorder1/messages", { content: "hey" }),
      { params: Promise.resolve({ id: "clorder1" }) }
    );
    expect(res.status).toBe(403);
    expect(mockedProxy).toHaveBeenCalledTimes(1);
    expect(mockedProxy).toHaveBeenCalledWith("http://orders.test", "/orders/clorder1", expect.anything());
  });
});

describe("POST /api/messages/mark-read", () => {
  it("rejects an unscoped mark-read", async () => {
    const res = await postMarkRead(jsonRequest("http://localhost/api/messages/mark-read", {}));
    expect(res.status).toBe(400);
    expect(mockedProxy).not.toHaveBeenCalled();
  });

  it("forwards an order-scoped mark-read", async () => {
    mockedProxy.mockResolvedValue({ data: { marked: 2 }, status: 200 });
    const res = await postMarkRead(jsonRequest("http://localhost/api/messages/mark-read", {
      orderId: "clorder1",
    }));
    expect(res.status).toBe(200);
    expect(mockedProxy).toHaveBeenCalledWith(
      "http://chat.test",
      "/messages/mark-read",
      expect.objectContaining({
        body: { orderId: "clorder1" },
      })
    );
  });
});
