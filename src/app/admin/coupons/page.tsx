"use client";
import { deleteCoupon, listCoupons, upsertCoupon } from "@/lib/db";
import { Coupon } from "@/types";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/admin/Modal";

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const refresh = () => listCoupons().then(setCoupons);
  useEffect(()=>{ refresh(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl silver-text">Coupons</h1>
        <button onClick={()=>setEditing({ id:"", code:"", type:"percent", value:10, active:true })} className="btn-primary"><Plus size={14}/> New</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-widest text-silver-400 bg-ink-800/50">
            <tr><th className="p-4">Code</th><th>Type</th><th>Value</th><th>Expiry</th><th>Active</th><th></th></tr>
          </thead>
          <tbody>
            {coupons.map(c=>(
              <tr key={c.id} className="border-t border-white/5">
                <td className="p-4 font-mono uppercase tracking-widest">{c.code}</td>
                <td className="capitalize">{c.type}</td>
                <td>{c.type==="flat" ? `₹${c.value}` : `${c.value}%`}</td>
                <td className="text-silver-400">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}</td>
                <td>{c.active ? "✓" : "—"}</td>
                <td className="text-right pr-4 space-x-2">
                  <button onClick={()=>setEditing(c)} className="text-xs underline">Edit</button>
                  <button onClick={async()=>{ if(confirm("Delete?")){ await deleteCoupon(c.id); refresh(); }}} className="text-red-400 p-2"><Trash2 size={14}/></button>
                </td>
              </tr>
            ))}
            {coupons.length===0 && <tr><td colSpan={6} className="py-10 text-center text-silver-500">No coupons</td></tr>}
          </tbody>
        </table>
      </div>
      {editing && (
        <Modal onClose={()=>setEditing(null)}>
          <h2 className="font-display text-2xl silver-text mb-4">{editing.id ? "Edit" : "New"} Coupon</h2>
          <div className="space-y-3">
            <input className="input uppercase" placeholder="CODE" value={editing.code} onChange={(e)=>setEditing({...editing!,code:e.target.value.toUpperCase()})}/>
            <select className="input" value={editing.type} onChange={(e)=>setEditing({...editing!,type:e.target.value as any})}>
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat (₹)</option>
            </select>
            <input type="number" className="input" placeholder="Value" value={editing.value} onChange={(e)=>setEditing({...editing!,value:+e.target.value})}/>
            <input type="date" className="input" onChange={(e)=>setEditing({...editing!,expiresAt:e.target.value?new Date(e.target.value).getTime():undefined})}/>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={editing.active} onChange={(e)=>setEditing({...editing!,active:e.target.checked})}/> Active</label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={()=>setEditing(null)} className="btn-ghost">Cancel</button>
            <button onClick={async()=>{ if(!editing.code) return toast.error("Code required"); await upsertCoupon(editing); toast.success("Saved"); setEditing(null); refresh(); }} className="btn-primary">Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
