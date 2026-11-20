import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { normalizeIndianMobile, MOBILE_ERROR } from "@/lib/phone";

const registerSchema = z.object({
  ownerName: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(72),
  businessName: z.string().min(1).max(120),
  phone: z.string().min(1, "Mobile number is required").max(20),
});

const DEFAULT_EXPENSE_CATEGORIES = [
  "Rent",
  "Electricity",
  "Gas",
  "Salary",
  "Raw Materials",
  "Transport",
  "Packaging",
  "Maintenance",
  "Marketing",
  "Other",
];

const DEFAULT_CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Snacks", "Beverages", "Desserts"];

export async function POST(req: Request) {
  try {
    const parsed = registerSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid signup details", issues: parsed.error.flatten() }, { status: 400 });
    }
    const { ownerName, email, password, businessName } = parsed.data;
    // Mobile number is required: a real-looking Indian mobile, not used by another account.
    const phone = normalizeIndianMobile(parsed.data.phone);
    if (!phone) return NextResponse.json({ error: MOBILE_ERROR }, { status: 400 });
    const phoneTaken = await prisma.user.findFirst({ where: { phone }, select: { id: true } });
    if (phoneTaken) {
      return NextResponse.json({ error: "This mobile number already has a Billo account. Please log in, or use a different number." }, { status: 409 });
    }

    const existing = await prisma.user.findFirst({ where: { email: { equals: email.trim(), mode: "insensitive" } }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: "This email already has a Billo account. Please log in, or sign up with a different email." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: ownerName, email: email.toLowerCase(), phone, passwordHash },
      });

      const business = await tx.business.create({
        data: { name: businessName, phone },
      });

      await tx.staff.create({
        data: { businessId: business.id, userId: user.id, role: "OWNER" },
      });

      // Sensible defaults so a brand-new shop isn't staring at an empty
      // categories screen before their first sale — spec §21 empty states
      // still apply for products, but categories are cheap to pre-seed.
      await tx.category.createMany({
        data: DEFAULT_CATEGORIES.map((name, i) => ({ businessId: business.id, name, sortOrder: i })),
      });
      await tx.expenseCategory.createMany({
        data: DEFAULT_EXPENSE_CATEGORIES.map((name) => ({ businessId: business.id, name, isDefault: true })),
      });
      await tx.printer.create({
        data: { businessId: business.id, name: "Browser Print", type: "BROWSER", isDefault: true },
      });
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if ((err as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "This email already has a Billo account. Please log in, or sign up with a different email." }, { status: 409 });
    }
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Unable to create your account. Please try again." }, { status: 500 });
  }
}
