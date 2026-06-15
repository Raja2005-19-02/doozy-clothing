"use client";
import FileUpload from "@/components/admin/FileUpload";
import Modal from "@/components/admin/Modal";
import {
  deleteCategory,
  listCategories,
  upsertCategory,
} from "@/lib/db";
import { Category } from "@/types";
import { Edit2, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Categories() {
  const [cats, setCats] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const refresh = () => listCategories().then(setCats);
  useEffect(() => {
    refresh();
  }, []);

  const save = async (c: Category) => {
    if (!c.name) return toast.error("Name required");
    if (!c.slug) c.slug = c.name.toLowerCase().replace(/\s+/g, "-");
    await upsertCategory(c);
    toast.success("Saved");
    setEditing(null);
    refresh();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete category?")) return;
    await deleteCategory(id);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <div className="eyebrow text-silver-500">Catalog</div>
          <h1 className="h-display text-3xl md:text-4xl silver-text mt-1">
            Categories
          </h1>
        </div>
        <button
          onClick={() =>
            setEditing({ id: "", name: "", slug: "", image: "" })
          }
          className="btn-primary"
        >
          <Plus size={14} /> New
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cats.map((c) => (
          <div
            key={c.id}
            className="border border-white/10 bg-ink-900 p-4 flex gap-4 items-center"
          >
            <div className="relative w-16 h-16 bg-ink-800 shrink-0">
              {c.image && (
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{c.name}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-silver-500 mt-1 truncate">
                /shop?category={c.slug}
              </div>
            </div>
            <button
              onClick={() => setEditing(c)}
              className="w-9 h-9 grid place-items-center hover:bg-white/5"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => onDelete(c.id)}
              className="w-9 h-9 grid place-items-center hover:bg-red-500/15 text-red-400"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <h2 className="font-display text-2xl silver-text mb-4">
            {editing.id ? "Edit" : "New"} Category
          </h2>
          <div className="space-y-4">
            <div>
              <div className="label">Name</div>
              <input
                className="input"
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing!, name: e.target.value })
                }
              />
            </div>
            <div>
              <div className="label">Slug</div>
              <input
                className="input"
                value={editing.slug}
                onChange={(e) =>
                  setEditing({ ...editing!, slug: e.target.value })
                }
              />
            </div>
            <FileUpload
              label="Image"
              value={editing.image || ""}
              onChange={(v) => setEditing({ ...editing!, image: v })}
              recommended="1200 × 1500"
              aspect="aspect-[4/5]"
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setEditing(null)} className="btn-ghost">
              Cancel
            </button>
            <button onClick={() => save(editing!)} className="btn-primary">
              Save
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
