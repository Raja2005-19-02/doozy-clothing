"use client";
import { useState } from "react";
import toast from "react-hot-toast";

export default function NewsletterForm() {
  const [v, setV] = useState("");
  return (
    <form
      className="mt-8 flex max-w-md mx-auto border-b border-white/20"
      onSubmit={(e) => {
        e.preventDefault();
        if (!v.trim()) return;
        toast.success("Welcome to Doozy");
        setV("");
      }}
    >
      <input
        type="email"
        required
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="your@email.com"
        className="bg-transparent flex-1 px-0 py-3 text-sm placeholder-silver-500 focus:outline-none"
      />
      <button className="text-[10px] uppercase tracking-[0.3em] font-semibold px-4 hover:text-silver-300">
        Subscribe →
      </button>
    </form>
  );
}
