"use client";
import { approveReview, deleteReview, listReviews } from "@/lib/db";
import { date } from "@/lib/format";
import { Review } from "@/types";
import { Check, Star, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const refresh = () => listReviews().then(setReviews);
  useEffect(()=>{ refresh(); }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl silver-text">Reviews</h1>
      <div className="space-y-3">
        {reviews.length === 0 && <div className="text-silver-400 text-sm">No reviews</div>}
        {reviews.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex justify-between flex-wrap gap-3">
              <div>
                <div className="font-semibold">{r.userName} <span className="text-silver-500 text-xs ml-2">on product {r.productId}</span></div>
                <div className="flex text-amber-300 mt-1">
                  {Array.from({length:r.rating}).map((_,i)=><Star key={i} size={12} fill="currentColor"/>)}
                </div>
              </div>
              <div className="text-xs text-silver-400">{date(r.createdAt)}</div>
            </div>
            <p className="mt-3 text-silver-300 text-sm">{r.text}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className={`text-[10px] uppercase tracking-widest border px-2 py-1 ${r.approved?"bg-emerald-500/20 text-emerald-300 border-emerald-500/30":"bg-amber-500/20 text-amber-300 border-amber-500/30"}`}>
                {r.approved ? "Approved" : "Pending"}
              </span>
              <div className="flex-1"></div>
              <button onClick={async()=>{ await approveReview(r.id,!r.approved); toast.success("Updated"); refresh(); }} className="btn-ghost py-2 px-3 text-xs">
                {r.approved ? <><X size={12}/> Unapprove</> : <><Check size={12}/> Approve</>}
              </button>
              <button onClick={async()=>{ if(confirm("Delete?")){ await deleteReview(r.id); refresh(); }}} className="p-2 text-red-400 hover:bg-white/5"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
