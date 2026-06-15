"use client";
import FileUpload from "@/components/admin/FileUpload";
import {
  deleteProduct,
  listCategories,
  listProducts,
  upsertProduct,
} from "@/lib/db";
import { inr } from "@/lib/format";
import { Category, Product } from "@/types";
import { Edit2, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);

  const refresh = () =>
    Promise.all([listProducts(), listCategories()]).then(([p, c]) => {
      setProducts(p);
      setCategories(c);
    });
  useEffect(() => {
    refresh();
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await deleteProduct(id);
    toast.success("Deleted");
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <div className="eyebrow text-silver-500">Catalog</div>
          <h1 className="h-display text-3xl md:text-4xl silver-text mt-1">
            Products
          </h1>
          <p className="text-silver-400 text-sm mt-1">
            {products.length} items
          </p>
        </div>
        <button
          onClick={() => setEditing(emptyProduct(categories[0]?.id || "men"))}
          className="btn-primary"
        >
          <Plus size={14} /> New Product
        </button>
      </div>

      {/* Mobile: card grid */}
      <div className="grid sm:hidden grid-cols-1 gap-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="border border-white/10 bg-ink-900 p-4 flex gap-4"
          >
            <div className="relative w-20 h-24 bg-ink-800 shrink-0">
              <Image
                src={p.images[0]}
                alt={p.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{p.name}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-silver-500 mt-1">
                {p.category} · {inr(p.salePrice || p.price)}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {p.newArrival && <Tag>New</Tag>}
                {p.bestSeller && <Tag>Best</Tag>}
                {p.featured && <Tag>Featured</Tag>}
              </div>
              <div
                className={`mt-2 text-[10px] uppercase tracking-[0.2em] ${
                  p.stock <= 5 ? "text-amber-400" : "text-silver-400"
                }`}
              >
                Stock {p.stock}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setEditing(p)}
                className="w-9 h-9 grid place-items-center border border-white/10 hover:bg-white hover:text-black"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={() => onDelete(p.id)}
                className="w-9 h-9 grid place-items-center border border-white/10 hover:bg-red-500/20 text-red-400"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block border border-white/10 bg-ink-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-[0.2em] text-silver-500 bg-ink-800/50">
            <tr>
              <th className="px-5 py-3">Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Tags</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                className="border-t border-white/5 hover:bg-white/[0.02]"
              >
                <td className="px-5 py-3 flex items-center gap-3">
                  <div className="relative w-10 h-12 bg-ink-800 shrink-0">
                    <Image
                      src={p.images[0]}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-silver-500">{p.slug}</div>
                  </div>
                </td>
                <td className="text-silver-300 capitalize">{p.category}</td>
                <td>{inr(p.salePrice || p.price)}</td>
                <td className={p.stock <= 5 ? "text-amber-400" : ""}>{p.stock}</td>
                <td className="space-x-1">
                  {p.newArrival && <Tag>New</Tag>}
                  {p.bestSeller && <Tag>Best</Tag>}
                  {p.featured && <Tag>Featured</Tag>}
                </td>
                <td className="text-right pr-4 space-x-1">
                  <button
                    onClick={() => setEditing(p)}
                    className="p-2 hover:bg-white/5"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="p-2 hover:bg-white/5 text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductModal
          product={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            await refresh();
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function Tag({ children }: any) {
  return (
    <span className="inline-block text-[9px] uppercase tracking-[0.2em] border border-white/20 px-1.5 py-0.5">
      {children}
    </span>
  );
}

function emptyProduct(catId: string): Product {
  return {
    id: "",
    name: "",
    slug: "",
    description: "",
    price: 1999,
    category: catId,
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Black", hex: "#0a0a0a" }],
    stock: 10,
    images: [""],
    createdAt: Date.now(),
  };
}

function ProductModal({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [p, setP] = useState<Product>(product);

  const save = async () => {
    if (!p.name || !p.price) return toast.error("Name and price required");
    if (!p.slug)
      p.slug = p.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    p.images = p.images.filter(Boolean);
    if (p.images.length === 0) return toast.error("Add at least one image");
    await upsertProduct(p);
    toast.success("Saved");
    onSaved();
  };

  const setImage = (i: number, v: string) => {
    const next = [...p.images];
    next[i] = v;
    setP({ ...p, images: next });
  };
  const addImageSlot = () => setP({ ...p, images: [...p.images, ""] });
  const removeImage = (i: number) =>
    setP({ ...p, images: p.images.filter((_, idx) => idx !== i) });

  return (
    <div className="fixed inset-0 bg-black/90 z-50 grid place-items-start overflow-auto p-3 md:p-6">
      <div className="bg-ink-900 border border-white/10 w-full max-w-3xl my-6 flex flex-col max-h-[calc(100vh-3rem)]">
        <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-ink-900">
          <h2 className="font-display text-xl md:text-2xl silver-text">
            {p.id ? "Edit Product" : "New Product"}
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          <div className="grid sm:grid-cols-2 gap-4">
            <Row label="Name" col2>
              <input
                className="input"
                value={p.name}
                onChange={(e) => setP({ ...p, name: e.target.value })}
              />
            </Row>
            <Row label="Slug (auto)">
              <input
                className="input"
                value={p.slug}
                onChange={(e) => setP({ ...p, slug: e.target.value })}
              />
            </Row>
            <Row label="Category">
              <select
                className="input"
                value={p.category}
                onChange={(e) => setP({ ...p, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-ink-900">
                    {c.name}
                  </option>
                ))}
              </select>
            </Row>
            <Row label="Price (₹)">
              <input
                type="number"
                className="input"
                value={p.price}
                onChange={(e) => setP({ ...p, price: +e.target.value })}
              />
            </Row>
            <Row label="Sale Price (₹)">
              <input
                type="number"
                className="input"
                value={p.salePrice || ""}
                onChange={(e) =>
                  setP({
                    ...p,
                    salePrice: e.target.value ? +e.target.value : undefined,
                  })
                }
              />
            </Row>
            <Row label="Stock" col2>
              <input
                type="number"
                className="input"
                value={p.stock}
                onChange={(e) => setP({ ...p, stock: +e.target.value })}
              />
            </Row>
            <Row label="Description" col2>
              <textarea
                className="input min-h-[110px]"
                value={p.description}
                onChange={(e) =>
                  setP({ ...p, description: e.target.value })
                }
              />
            </Row>
          </div>

          <div>
            <div className="label">Images</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {p.images.map((img, i) => (
                <div key={i} className="relative">
                  <FileUpload
                    value={img}
                    onChange={(v) => setImage(i, v)}
                    recommended="1200 × 1200"
                    aspect="aspect-square"
                  />
                  {p.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 w-7 h-7 grid place-items-center bg-black border border-white/20 hover:bg-white hover:text-black"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImageSlot}
                className="aspect-square border-2 border-dashed border-white/15 hover:border-white/40 grid place-items-center text-silver-400 hover:text-white"
              >
                <Plus />
              </button>
            </div>
          </div>

          <div>
            <div className="label">Sizes</div>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => {
                const on = p.sizes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setP({
                        ...p,
                        sizes: on ? p.sizes.filter((x) => x !== s) : [...p.sizes, s],
                      })
                    }
                    className={`px-4 py-2 border text-xs uppercase tracking-widest ${
                      on
                        ? "bg-white text-black border-white"
                        : "border-white/15"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="label">Colors (name #hex, comma separated)</div>
            <input
              className="input"
              defaultValue={p.colors.map((c) => `${c.name} ${c.hex}`).join(", ")}
              onBlur={(e) => {
                const list = e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((pair) => {
                    const [name, hex] = pair.split(/\s+/);
                    return { name, hex: hex || "#0a0a0a" };
                  });
                setP({ ...p, colors: list });
              }}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <Toggle
              label="New Arrival"
              checked={!!p.newArrival}
              onChange={(v) => setP({ ...p, newArrival: v })}
            />
            <Toggle
              label="Best Seller"
              checked={!!p.bestSeller}
              onChange={(v) => setP({ ...p, bestSeller: v })}
            />
            <Toggle
              label="Featured"
              checked={!!p.featured}
              onChange={(v) => setP({ ...p, featured: v })}
            />
          </div>
        </div>

        <div className="border-t border-white/10 p-4 flex justify-end gap-3 sticky bottom-0 bg-ink-900">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button onClick={save} className="btn-primary">
            Save Product
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
  col2,
}: {
  label: string;
  children: React.ReactNode;
  col2?: boolean;
}) {
  return (
    <div className={col2 ? "sm:col-span-2" : ""}>
      <div className="label">{label}</div>
      {children}
    </div>
  );
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between border px-4 py-3 text-sm transition ${
        checked
          ? "border-white bg-white/5"
          : "border-white/10 hover:border-white/30"
      }`}
    >
      <span className="text-[11px] uppercase tracking-[0.22em] text-silver-200">
        {label}
      </span>
      <span
        className={`relative w-9 h-5 rounded-full transition ${
          checked ? "bg-white" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${
            checked ? "translate-x-4 bg-black" : "bg-white"
          }`}
        />
      </span>
    </button>
  );
}
