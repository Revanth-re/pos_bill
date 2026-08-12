import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: url.port ? Number(url.port) : 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "owner@demo.shop" },
    update: {},
    create: { name: "Ramesh Kumar", email: "owner@demo.shop", passwordHash },
  });

  const business = await prisma.business.create({
    data: {
      name: "Sri Balaji Tiffin Center",
      phone: "9876543210",
      gstEnabled: true,
      taxInclusive: true,
      staff: { create: { userId: user.id, role: "OWNER" } },
      printers: { create: { name: "Browser Print", type: "BROWSER", isDefault: true } },
      expenseCategories: {
        create: [
          "Rent", "Electricity", "Gas", "Salary", "Raw Materials",
          "Transport", "Packaging", "Maintenance", "Marketing", "Other",
        ].map((name) => ({ name, isDefault: true })),
      },
    },
  });

  const categories = await Promise.all(
    ["Breakfast", "Lunch", "Beverages", "Snacks"].map((name, i) =>
      prisma.category.create({ data: { businessId: business.id, name, sortOrder: i } })
    )
  );

  const [breakfast, , beverages] = categories;

  await prisma.product.createMany({
    data: [
      { businessId: business.id, categoryId: breakfast.id, name: "Masala Dosa", sellingPrice: 80, purchasePrice: 26, gstPercent: 5, unit: "plate", currentStock: 100, minStock: 10 },
      { businessId: business.id, categoryId: breakfast.id, name: "Idli (2 pcs)", sellingPrice: 40, purchasePrice: 12, gstPercent: 5, unit: "plate", currentStock: 100, minStock: 10 },
      { businessId: business.id, categoryId: beverages.id, name: "Filter Coffee", sellingPrice: 20, purchasePrice: 6, gstPercent: 5, unit: "cup", currentStock: 200, minStock: 20 },
      { businessId: business.id, categoryId: beverages.id, name: "Tea", sellingPrice: 15, purchasePrice: 4, gstPercent: 5, unit: "cup", currentStock: 200, minStock: 20 },
    ],
  });

  console.log("Seeded business:", business.name);
  console.log("Login with owner@demo.shop / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
