import { NextResponse } from "next/server";
import { type ZodSchema } from "zod";
import { ZodError } from "zod";

const MAX_BODY_SIZE = 1_048_576; // 1MB

/** Parses and checks JSON with a Zod schema. Returns data or an error response. */
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return {
      error: NextResponse.json(
        { error: "הגוף גדול מדי. מקסימום 1MB." },
        { status: 413 }
      ),
    };
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return {
      error: NextResponse.json(
        { error: "גוף הבקשה לא תקין — נדרש JSON." },
        { status: 400 }
      ),
    };
  }

  try {
    const data = schema.parse(rawBody);
    return { data };
  } catch (err) {
    if (err instanceof ZodError) {
      const zodErr = err as ZodError;
      const messages = zodErr.issues.map((e) => {
        const path = (e.path as (string | number)[]).join(".");
        return path ? `${path}: ${e.message}` : e.message;
      });
      return {
        error: NextResponse.json(
          { error: "נתונים לא תקינים", details: messages },
          { status: 400 }
        ),
      };
    }
    return {
      error: NextResponse.json(
        { error: "שגיאה בעיבוד הבקשה" },
        { status: 400 }
      ),
    };
  }
}
