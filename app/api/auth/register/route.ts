import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const registerSchema = z.object({
  ownerName: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(72),
  businessName: z.string().min(1).max(120),
  phone: z.string().max(20).optional(),
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
    const { ownerName, email, password, businessName, phone } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
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
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Unable to create your account. Please try again." }, { status: 500 });
  }
}
