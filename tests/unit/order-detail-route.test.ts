import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/gateway", () => ({
  proxyRequest: vi.fn(),
  GIGS_SERVICE: "http://gigs.test",
  ORDERS_SERVICE: "http://orders.test",
  USERS_SERVICE: "http://users.test",
  CHAT_SERVICE: "http://chat.test",
  REQUESTS_SERVICE: "http://requests.test",
}));

import { auth } from "@/lib/auth";
import { proxyRequest } from "@/lib/gateway";
import { GET } from "@/app/api/orders/[id]/route";

const mockedAuth = vi.mocked(auth);
const mockedProxy = vi.mocked(proxyRequest);

const seller = { id: "seller-1", email: "s@x.com", name: "יוסי", role: "SELLER" };
const buyer = { id: "buyer-1", email: "b@x.com", name: "דנה", role: "BUYER" };

beforeEach(() => {
  vi.clearAllMocks();
});

function getRequest() {
  return new Request("http://localhost/api/orders/ord-1");
}

function stubOrder(viewer: typeof seller | typeof buyer) {
  mockedAuth.mockResolvedValue({ user: viewer } as never);
  mockedProxy.mockImplementation(async (url: string, path: string) => {
    if (url === "http://orders.test") {
      return {
        data: {
          id: "ord-1",
          requestId: "req-1",
          buyerId: buyer.id,
          sellerId: seller.id,
          gigId: null,
          title: "הרכבת מדף",
          status: "PENDING",
          price: 250,
        },
        status: 200,
      };
    }
    if (url === "http://requests.test" && path === "/service-requests/req-1") {
      return {
        data: {
          request: {
            street: "הרצל 12",
            cityName: "חולון",
            floor: "4",
            streetVisible: true,
            hasStreet: true,
          },
        },
        status: 200,
      };
    }
    if (url === "http://users.test") {
      const id = path.replace("/sellers/", "");
      const person = id === seller.id ? seller : buyer;
      return { data: { id: person.id, name: person.name, avatar: null }, status: 200 };
    }
    if (url === "http://chat.test") return { data: [], status: 200 };
    return { data: null, status: 404 };
  });
}

describe("GET /api/orders/:id visit address", () => {
  it("attaches the request street for the assigned seller", async () => {
    stubOrder(seller);
    const res = await GET(getRequest(), { params: Promise.resolve({ id: "ord-1" }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.visit).toEqual({
      street: "הרצל 12",
      cityName: "חולון",
      districtName: null,
      floor: "4",
      streetVisible: true,
      hasStreet: true,
    });
  });

  it("hides the visit address from the buyer on the job", async () => {
    stubOrder(buyer);
    const res = await GET(getRequest(), { params: Promise.resolve({ id: "ord-1" }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.visit).toBeNull();
    expect(mockedProxy).not.toHaveBeenCalledWith("http://requests.test", expect.anything(), expect.anything());
  });
});
