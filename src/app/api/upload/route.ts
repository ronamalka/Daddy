import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import {
  validateUpload,
  validateTotalSize,
  stripExifFromJpeg,
  uploadDir,
} from "@/lib/upload-security";

const UPLOAD_BASE_URL = process.env.UPLOAD_BASE_URL || "/uploads";

/** Saves uploaded files after size and type checks. Requires a signed-in user. */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "בקשה לא תקינה. יש לשלוח קובץ." },
      { status: 400 }
    );
  }

  const files = formData.getAll("file");
  if (files.length === 0) {
    return NextResponse.json(
      { error: "לא נבחר קובץ." },
      { status: 400 }
    );
  }

  const fileObjects = files.filter((f): f is File => f instanceof File);
  if (fileObjects.length === 0) {
    return NextResponse.json(
      { error: "לא נבחר קובץ." },
      { status: 400 }
    );
  }

  const totalError = validateTotalSize(fileObjects);
  if (totalError) {
    return NextResponse.json({ error: totalError }, { status: 400 });
  }

  const dir = uploadDir();
  await mkdir(dir, { recursive: true });

  const results: { url: string; name: string }[] = [];

  for (const file of fileObjects) {
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = new Uint8Array(arrayBuffer);

    const validation = validateUpload(
      { name: file.name, size: file.size, type: file.type },
      inputBuffer
    );

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    let outputBuffer: Buffer;
    if (validation.detectedType === "image/jpeg") {
      outputBuffer = Buffer.from(stripExifFromJpeg(inputBuffer));
    } else {
      outputBuffer = Buffer.from(inputBuffer);
    }

    const filePath = join(dir, validation.sanitizedName!);
    await writeFile(filePath, outputBuffer);

    results.push({
      url: `${UPLOAD_BASE_URL}/${validation.sanitizedName}`,
      name: validation.sanitizedName!,
    });
  }

  return NextResponse.json({ files: results }, { status: 200 });
}
