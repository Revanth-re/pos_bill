"use client";

import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Plus, X, Search, Package, Utensils, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImagePicker } from "@/components/dashboard/ImagePicker";
import { RecipeEditorSheet } from "@/components/dashboard/RecipeEditorSheet";
import { formatINR, cn } from "@/lib/utils";
import { toast } from "@/stores/toastStore";

interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  categoryId: string | null;
  categoryName: string | null;
  unit: string;
  sellingPrice: number;
  purchasePrice: number;
  gstPercent: number;
  currentStock: number;
  minStock: number;
  status: "ACTIVE" | "INACTIVE";
  imageUrl: string | null;
}

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string().min(1),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().positive("Selling price must be greater than 0"),
  gstPercent: z.coerce.number().min(0).max(28),
  currentStock: z.coerce.number().min(0),
  minStock: z.coerce.number().min(0),
  imageUrl: z.string().nullable().optional(),
});
type ProductFormInput = z.input<typeof productSchema>;
type ProductFormValues = z.infer<typeof productSchema>;

function Thumbnail({ url, size = 44 }: { url: string | null; size?: number }) {
  if (!url) {
    return (
      <div
        className="flex shrink-0 items-center justify-center border-2 border-border bg-paper text-muted"
        style={{ width: size, height: size }}
      >
        <Package className="h-1/2 w-1/2" />
      </div>
    );
  }
  return (
    <Image
      src={url}
      alt=""
      width={size}
      height={size}
     
      className="shrink-0 border-2 border-border object-cover"
      style={{ width: size, height: size }}
    />
  );
}

export function ProductsScreen({
  initialProducts,
  categories,
  canEdit,
}: {
  initialProducts: ProductRow[];
  categories: { id: string; name: string }[];
  canEdit: boolean;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [recipeProduct, setRecipeProduct] = useState<{ id: string; name: string } | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter && p.categoryId !== categoryFilter) return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase()) && !(p.sku ?? "").toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [products, query, categoryFilter]);

  async function handleDelete(id: string) {
    if (!confirm("Remove this product from the menu?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((p) => p.filter((row) => row.id !== id));
      toast.success("Product removed");
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Products</h1>
          <p className="text-base text-muted">{products.length} products</p>
        </div>
        {canEdit && (
          <Button onClick={() => setFormOpen(true)}>
            <span className="inline-flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Add Product
            </span>
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex flex-1 items-center gap-2 border-2 border-border bg-surface px-3 touch-target">
          <Search className="h-5 w-5 text-muted shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product or SKU…"
            className="flex-1 bg-transparent py-2.5 text-base outline-none"
          />
        </div>
        <select
          value={categoryFilter ?? ""}
          onChange={(e) => setCategoryFilter(e.target.value || null)}
          className="touch-target border-2 border-border bg-surface px-3 text-base"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <p className="text-base text-muted mb-3">No products yet</p>
          {canEdit && <Button onClick={() => setFormOpen(true)}>Add Product</Button>}
        </div>
      ) : (
        <div className="overflow-x-auto border-2 border-border bg-surface">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b-2 border-border text-left text-sm font-bold text-muted">
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-right">Stock</th>
                <th className="p-3 text-right">GST</th>
                {canEdit && <th className="p-3" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const low = p.currentStock <= p.minStock;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Thumbnail url={p.imageUrl} />
                        <div>
                          <p className="font-bold text-ink">{p.name}</p>
                          {p.sku && <p className="text-sm text-muted">SKU: {p.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-ink-soft">{p.categoryName ?? "—"}</td>
                    <td className="p-3 text-right tabular font-bold">{formatINR(p.sellingPrice)}</td>
                    <td className={cn("p-3 text-right tabular", low && "text-danger font-bold")}>
                      {p.currentStock} {p.unit}
                      {low && " ⚠️"}
                    </td>
                    <td className="p-3 text-right tabular text-ink-soft">{p.gstPercent}%</td>
                    {canEdit && (
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="mr-3 inline-flex items-center gap-1 text-sm font-bold text-ink-soft hover:underline"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => setRecipeProduct({ id: p.id, name: p.name })}
                          className="mr-3 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline"
                        >
                          <Utensils className="h-3.5 w-3.5" /> Recipe
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-sm font-bold text-danger hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <AddProductSheet
          categories={categories}
          onClose={() => setFormOpen(false)}
          onCreated={(p) => {
            setProducts((prev) => [
              ...prev,
              {
                id: p.id,
                name: p.name,
                sku: p.sku ?? null,
                barcode: p.barcode ?? null,
                categoryId: p.categoryId ?? null,
                categoryName: categories.find((c) => c.id === p.categoryId)?.name ?? null,
                unit: p.unit,
                sellingPrice: p.sellingPrice,
                purchasePrice: p.purchasePrice,
                gstPercent: p.gstPercent,
                currentStock: p.currentStock,
                minStock: p.minStock,
                status: "ACTIVE",
                imageUrl: p.imageUrl ?? null,
              },
            ]);
            setFormOpen(false);
          }}
        />
      )}

      {editingProduct && (
        <EditProductSheet
          product={editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onSaved={(updated) => {
            setProducts((prev) => prev.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)));
            setEditingProduct(null);
          }}
        />
      )}

      {recipeProduct && (
        <RecipeEditorSheet
          productId={recipeProduct.id}
          productName={recipeProduct.name}
          onClose={() => setRecipeProduct(null)}
        />
      )}
    </div>
  );
}

function AddProductSheet({
  categories,
  onClose,
  onCreated,
}: {
  categories: { id: string; name: string }[];
  onClose: () => void;
  onCreated: (p: ProductFormValues & { id: string }) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { unit: "pc", gstPercent: 5, purchasePrice: 0, currentStock: 0, minStock: 0, imageUrl: null },
  });

  async function onSubmit(values: ProductFormValues) {
    setSubmitting(true);
    setServerError(null);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, imageUrl: values.imageUrl ?? undefined }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? "Unable to save the product.");
      return;
    }
    const body = await res.json();
    toast.success("Product saved");
    onCreated({ ...values, id: body.product.id });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-border bg-surface shadow-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-bold text-ink">Add Product</h2>
          <button onClick={onClose} className="touch-target rounded-full p-2 hover:bg-paper">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-4 space-y-4">
          <Controller
            name="imageUrl"
            control={control}
            render={({ field }) => <ImagePicker value={field.value ?? null} onChange={field.onChange} />}
          />

          <Field label="Product name" error={errors.name?.message}>
            <input {...register("name")} className="field" placeholder="Masala Dosa" />
          </Field>
          <Field label="Category">
            <select {...register("categoryId")} className="field">
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="SKU">
              <input {...register("sku")} className="field" />
            </Field>
            <Field label="Barcode">
              <input {...register("barcode")} className="field" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Selling price (₹)" error={errors.sellingPrice?.message}>
              <input type="number" step="0.01" {...register("sellingPrice")} className="field" />
            </Field>
            <Field label="Purchase price (₹)">
              <input type="number" step="0.01" {...register("purchasePrice")} className="field" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Unit">
              <input {...register("unit")} className="field" placeholder="pc" />
            </Field>
            <Field label="GST %">
              <input type="number" step="0.01" {...register("gstPercent")} className="field" />
            </Field>
            <Field label="Opening stock">
              <input type="number" step="0.01" {...register("currentStock")} className="field" />
            </Field>
          </div>
          <Field label="Minimum stock (for low-stock alerts)">
            <input type="number" step="0.01" {...register("minStock")} className="field" />
          </Field>

          {serverError && (
            <p className="border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{serverError}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "Saving…" : "Save Product"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function EditProductSheet({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: ProductRow;
  categories: { id: string; name: string }[];
  onClose: () => void;
  onSaved: (p: ProductRow) => void;
}) {
  const [name, setName] = useState(product.name);
  const [categoryId, setCategoryId] = useState(product.categoryId ?? "");
  const [sku, setSku] = useState(product.sku ?? "");
  const [barcode, setBarcode] = useState(product.barcode ?? "");
  const [sellingPrice, setSellingPrice] = useState(String(product.sellingPrice));
  const [purchasePrice, setPurchasePrice] = useState(String(product.purchasePrice));
  const [gstPercent, setGstPercent] = useState(String(product.gstPercent));
  const [minStock, setMinStock] = useState(String(product.minStock));
  const [imageUrl, setImageUrl] = useState<string | null>(product.imageUrl);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        categoryId: categoryId || undefined,
        sku: sku || undefined,
        barcode: barcode || undefined,
        sellingPrice: parseFloat(sellingPrice) || 0,
        purchasePrice: parseFloat(purchasePrice) || 0,
        gstPercent: parseFloat(gstPercent) || 0,
        minStock: parseFloat(minStock) || 0,
        imageUrl: imageUrl ?? undefined,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Unable to save changes.");
      return;
    }
    toast.success("Product updated");
    onSaved({
      ...product,
      name,
      categoryId: categoryId || null,
      categoryName: categories.find((c) => c.id === categoryId)?.name ?? null,
      sku: sku || null,
      barcode: barcode || null,
      sellingPrice: parseFloat(sellingPrice) || 0,
      purchasePrice: parseFloat(purchasePrice) || 0,
      gstPercent: parseFloat(gstPercent) || 0,
      minStock: parseFloat(minStock) || 0,
      imageUrl,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-border bg-surface shadow-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-bold text-ink">Edit Product</h2>
          <button onClick={onClose} className="touch-target rounded-full p-2 hover:bg-paper">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <ImagePicker value={imageUrl} onChange={setImageUrl} />

          <Field label="Product name">
            <input value={name} onChange={(e) => setName(e.target.value)} className="field" />
          </Field>
          <Field label="Category">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field">
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="SKU">
              <input value={sku} onChange={(e) => setSku(e.target.value)} className="field" />
            </Field>
            <Field label="Barcode">
              <input value={barcode} onChange={(e) => setBarcode(e.target.value)} className="field" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Selling price (₹)">
              <input type="number" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} className="field" />
            </Field>
            <Field label="Purchase price (₹)">
              <input type="number" step="0.01" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="field" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="GST %">
              <input type="number" step="0.01" value={gstPercent} onChange={(e) => setGstPercent(e.target.value)} className="field" />
            </Field>
            <Field label="Minimum stock">
              <input type="number" step="0.01" value={minStock} onChange={(e) => setMinStock(e.target.value)} className="field" />
            </Field>
          </div>

          {error && (
            <p className="rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{error}</p>
          )}

          <Button className="w-full" size="lg" onClick={handleSubmit} loading={submitting}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
