import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { readFile } from "fs/promises";
import { GET } from "@/app/uploads/[filename]/route";

const mockedAuth = vi.mocked(auth);
const mockedReadFile = vi.mocked(readFile);

const user = { id: "clseller1", email: "seller@example.com", name: "Dana", role: "SELLER" };
const FILENAME = "550e8400-e29b-41d4-a716-446655440000.jpg";

function getRequest() {
  return new Request(`http://localhost/uploads/${FILENAME}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedAuth.mockResolvedValue({ user } as never);
});

describe("GET /uploads/:filename", () => {
  it("returns 401 when logged out", async () => {
    mockedAuth.mockResolvedValue(null as never);
    const res = await GET(getRequest(), { params: Promise.resolve({ filename: FILENAME }) });
    expect(res.status).toBe(401);
    expect(mockedReadFile).not.toHaveBeenCalled();
  });

  it("returns 404 for a path-traversal filename", async () => {
    const res = await GET(getRequest(), {
      params: Promise.resolve({ filename: "../secret.jpg" }),
    });
    expect(res.status).toBe(404);
    expect(mockedReadFile).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing file", async () => {
    mockedReadFile.mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));
    const res = await GET(getRequest(), { params: Promise.resolve({ filename: FILENAME }) });
    expect(res.status).toBe(404);
  });

  it("returns the image bytes so a seller can open a chat photo", async () => {
    const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    mockedReadFile.mockResolvedValue(bytes);
    const res = await GET(getRequest(), { params: Promise.resolve({ filename: FILENAME }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    expect(res.headers.get("Content-Disposition")).toBe(`attachment; filename="${FILENAME}"`);
    const body = Buffer.from(await res.arrayBuffer());
    expect(body.equals(bytes)).toBe(true);
  });
});
