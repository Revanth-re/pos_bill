"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatINR, cn } from "@/lib/utils";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  purchaseCost: number;
}

interface RecipeLine {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  quantity: number;
  purchaseCost: number;
}

interface RecipeData {
  lines: RecipeLine[];
  sellingPrice: number;
  foodCost: number;
  foodCostPercent: number;
  grossProfit: number;
  grossMargin: number;
}

export function RecipeEditorSheet({
  productId,
  productName,
  onClose,
}: {
  productId: string;
  productName: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<RecipeData | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [lines, setLines] = useState<RecipeLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingIngredientId, setAddingIngredientId] = useState("");
  const [addingQty, setAddingQty] = useState("");
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${productId}/recipe`).then((r) => r.json()),
      fetch("/api/ingredients").then((r) => r.json()),
    ]).then(([recipe, ing]) => {
      setData(recipe);
      setLines(recipe.lines ?? []);
      setIngredients(ing.ingredients ?? []);
      setLoading(false);
    });
  }, [productId]);

  function computeLive() {
    if (!data) return null;
    const foodCost = lines.reduce((sum, l) => sum + l.quantity * l.purchaseCost, 0);
    const grossProfit = data.sellingPrice - foodCost;
    const foodCostPercent = data.sellingPrice > 0 ? (foodCost / data.sellingPrice) * 100 : 0;
    const grossMargin = data.sellingPrice > 0 ? (grossProfit / data.sellingPrice) * 100 : 0;
    return { foodCost, grossProfit, foodCostPercent, grossMargin };
  }
  const live = computeLive();

  function handleAddLine() {
    const ingredient = ingredients.find((i) => i.id === addingIngredientId);
    const qty = parseFloat(addingQty);
    if (!ingredient || !qty || qty <= 0) return;
    setLines((prev) => [
      ...prev.filter((l) => l.ingredientId !== ingredient.id),
      {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        unit: ingredient.unit,
        quantity: qty,
        purchaseCost: ingredient.purchaseCost,
      },
    ]);
    setAddingIngredientId("");
    setAddingQty("");
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/products/${productId}/recipe`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: lines.map((l) => ({ ingredientId: l.ingredientId, quantity: l.quantity })) }),
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40">
      <div className="w-full sm:max-w-md border-t-2 sm:border-2 border-ink bg-surface max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b-2 border-border p-4">
          <div>
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Utensils className="h-5 w-5" /> Recipe
            </h2>
            <p className="text-sm text-muted">{productName}</p>
          </div>
          <button onClick={onClose} className="touch-target rounded-full p-2 hover:bg-paper">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <p className="p-4 text-base text-muted">Loading…</p>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {live && (
                <div className="border-2 border-border bg-paper p-3 grid grid-cols-2 gap-3">
                  <Stat label="Food Cost" value={formatINR(live.foodCost)} />
                  <Stat label="Food Cost %" value={`${live.foodCostPercent.toFixed(0)}%`} />
                  <Stat
                    label="Gross Profit"
                    value={formatINR(live.grossProfit)}
                    tone={live.grossProfit >= 0 ? "success" : "danger"}
                  />
                  <Stat label="Gross Margin" value={`${live.grossMargin.toFixed(0)}%`} />
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-bold text-ink-soft">Ingredients</p>
                {lines.length === 0 ? (
                  <p className="text-sm text-muted">No ingredients added yet.</p>
                ) : (
                  <ul className="border-2 border-border divide-y-2 divide-border">
                    {lines.map((l) => (
                      <li key={l.ingredientId} className="flex items-center justify-between p-2.5">
                        <div>
                          <p className="font-bold text-ink">{l.ingredientName}</p>
                          <p className="text-sm text-muted tabular">
                            {l.quantity} {l.unit} × {formatINR(l.purchaseCost)}
                          </p>
                        </div>
                        <button
                          onClick={() => setLines((prev) => prev.filter((x) => x.ingredientId !== l.ingredientId))}
                          className="touch-target rounded-full p-2 text-muted hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-2 border-border p-3 space-y-2">
                <p className="text-sm font-bold text-ink-soft">Add ingredient</p>
                <select
                  value={addingIngredientId}
                  onChange={(e) => setAddingIngredientId(e.target.value)}
                  className="field"
                >
                  <option value="">Choose ingredient</option>
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.unit})
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.001"
                    value={addingQty}
                    onChange={(e) => setAddingQty(e.target.value)}
                    placeholder="Quantity per dish"
                    className="field flex-1"
                  />
                  <Button variant="secondary" onClick={handleAddLine}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <button
                  onClick={() => setQuickAddOpen(true)}
                  className="text-sm font-bold text-brand hover:underline"
                >
                  + New ingredient not in the list
                </button>
              </div>
            </div>

            <div className="border-t-2 border-border p-4">
              <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Recipe"}
              </Button>
            </div>
          </>
        )}
      </div>

      {quickAddOpen && (
        <QuickAddIngredient
          onClose={() => setQuickAddOpen(false)}
          onCreated={(ing) => {
            setIngredients((prev) => [...prev, ing]);
            setAddingIngredientId(ing.id);
            setQuickAddOpen(false);
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "success" | "danger" }) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className={cn("text-lg font-extrabold tabular", tone === "success" && "text-success", tone === "danger" && "text-danger")}>
        {value}
      </p>
    </div>
  );
}

function QuickAddIngredient({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (i: Ingredient) => void;
}) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const purchaseCost = parseFloat(cost);
    if (!name.trim() || !purchaseCost) {
      setError("Enter a name and cost per unit.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/ingredients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, unit, purchaseCost, currentStock: parseFloat(stock) || 0, minStock: 0 }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Unable to save the ingredient.");
      return;
    }
    const body = await res.json();
    onCreated({
      id: body.ingredient.id,
      name: body.ingredient.name,
      unit: body.ingredient.unit,
      purchaseCost: Number(body.ingredient.purchaseCost),
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xs border-2 border-ink bg-surface p-4 space-y-3">
        <h3 className="text-lg font-bold text-ink">New Ingredient</h3>
        <div>
          <label className="field-label">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="Rice" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="field-label">Unit</label>
            <input value={unit} onChange={(e) => setUnit(e.target.value)} className="field" placeholder="kg" />
          </div>
          <div>
            <label className="field-label">Cost/unit (₹)</label>
            <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} className="field" />
          </div>
        </div>
        <div>
          <label className="field-label">Current stock ({unit})</label>
          <input type="number" step="0.01" value={stock} onChange={(e) => setStock(e.target.value)} className="field" />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}
