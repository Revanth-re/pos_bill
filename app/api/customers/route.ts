import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    const customers = await prisma.customer.findMany({
      where: {
        businessId: session.businessId,
        ...(q
          ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] }
          : {}),
      },
      orderBy: { name: "asc" },
      take: 100,
    });

    return NextResponse.json({ customers });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load customers." }, { status: 500 });
  }
}

const customerSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(300).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "customers.manage");

    const parsed = customerSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid customer", issues: parsed.error.flatten() }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: { ...parsed.data, businessId: session.businessId, email: parsed.data.email || undefined },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to save the customer." }, { status: 500 });
  }
}
