import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";

// GET /api/products/gallery — every distinct image already attached to a
// product in this business, newest first. Powers the "choose from gallery"
// picker so re-using a photo (e.g. two sizes of the same dish) doesn't
// require re-uploading the same file.
export async function GET() {
  try {
    const session = await requireSession();

    const products = await prisma.product.findMany({
      where: { businessId: session.businessId, imageUrl: { not: null } },
      select: { imageUrl: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const seen = new Set<string>();
    const images = products.filter((p) => {
      if (!p.imageUrl || seen.has(p.imageUrl)) return false;
      seen.add(p.imageUrl);
      return true;
    });

    return NextResponse.json({ images });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load the image gallery." }, { status: 500 });
  }
}
