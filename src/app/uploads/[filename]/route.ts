import { readFile } from "fs/promises";
import { join, resolve, sep } from "path";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  attachmentContentType,
  isAllowedAttachmentFilename,
} from "@/lib/attachment-url";
import { uploadDir } from "@/lib/upload-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** True if resolvedPath is the upload directory itself or a file inside it. */
function isInsideUploadDir(dir: string, resolvedPath: string): boolean {
  return resolvedPath === dir || resolvedPath.startsWith(dir + sep);
}

/** Serves a stored chat or dispute file so both buyer and seller can open it. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename } = await params;
  const contentType = attachmentContentType(filename);
  if (!isAllowedAttachmentFilename(filename) || !contentType) {
    return new NextResponse(null, { status: 404 });
  }

  const dir = resolve(uploadDir());
  const filePath = resolve(join(dir, filename));
  if (!isInsideUploadDir(dir, filePath)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const data = await readFile(filePath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'none'; script-src 'none'",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
