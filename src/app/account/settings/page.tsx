"use client";
import SiteShell from "@/components/SiteShell";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);
  if (!user) return null;
  return (
    <SiteShell>
      <div className="container-x py-10 md:py-14 max-w-2xl">
        <div className="eyebrow">Account</div>
        <h1 className="h-display text-4xl md:text-5xl silver-text mt-2 mb-10">
          Profile Settings
        </h1>
        <form
          className="border border-white/10 bg-ink-900 p-8 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Profile updated");
          }}
        >
          <div>
            <label className="label">Name</label>
            <input defaultValue={user.name} className="input-underline" />
          </div>
          <div>
            <label className="label">Email</label>
            <input defaultValue={user.email} className="input-underline" disabled />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              defaultValue={user.phone || ""}
              className="input-underline"
              placeholder="+91…"
            />
          </div>
          <button className="btn-primary">Save Changes</button>
        </form>
      </div>
    </SiteShell>
  );
}
