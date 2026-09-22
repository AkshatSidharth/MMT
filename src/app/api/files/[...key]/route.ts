import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Authorising download endpoint for private files. Every object is checked
 * against the document row that owns it: patients reach only their own files,
 * admins reach all of them. Nothing here is cacheable by a shared cache.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Sign in required", { status: 401 });

  const { key: segments } = await params;
  const key = segments.map(decodeURIComponent).join("/");
  if (key.includes("..")) return new NextResponse("Not found", { status: 404 });

  const document = await db.getDocumentByKey(key);
  if (!document) return new NextResponse("Not found", { status: 404 });
  if (user.role !== "admin" && document.patient_id !== user.id) {
    return new NextResponse("Not found", { status: 404 });
  }

  const file = await db.readFile(key);
  if (!file) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(Buffer.from(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename="${document.title.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
