import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/products/upload-image — multipart form upload, field name "file".
 *
 * Stores under /public/uploads/products so the file is served as a normal
 * static asset. This is fine for local development and a single-server
 * deployment; on Vercel or any deploy target with a read-only/ephemeral
 * filesystem, swap this for a cloud storage upload (S3, Cloudinary, UploadThing)
 * — the response contract (returning { url }) stays the same either way, so
 * nothing else in the app needs to change.
 */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "products.create");

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json({ error: "Only JPG, PNG, or WEBP images are allowed" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
    }

    const ext = ALLOWED_TYPES[file.type];
    const filename = `${randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/products/${filename}` }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error("Image upload error:", err);
    return NextResponse.json({ error: "Unable to upload the image. Please try again." }, { status: 500 });
  }
}
