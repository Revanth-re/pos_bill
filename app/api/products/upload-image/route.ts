import { NextResponse } from "next/server";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";
import { cloudinary } from "@/lib/cloudinary";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/products/upload-image — multipart form upload, field name "file".
 *
 * Uploads to Cloudinary rather than local disk. Local disk storage doesn't
 * survive on Vercel (each invocation gets a fresh, ephemeral filesystem —
 * a photo saved to /public/uploads in one request is gone by the next),
 * so this is required for images to actually persist in production, not
 * just a nicety. Images are scoped per business under a folder so two
 * shops' galleries never mix.
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
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, or WEBP images are allowed" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: `pos/${session.businessId}/products`,
      resource_type: "image",
      // Cap stored dimensions and let Cloudinary auto-pick format/quality —
      // product photos never need to be larger than this for a POS tile.
      transformation: [{ width: 1200, height: 1200, crop: "limit" }, { fetch_format: "auto", quality: "auto" }],
    });

    return NextResponse.json({ url: result.secure_url }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error("Cloudinary upload error:", err);
    return NextResponse.json({ error: "Unable to upload the image. Please try again." }, { status: 500 });
  }
}
