"use client";
import { cloudinaryEnabled, uploadImage, validateImage } from "@/lib/cloudinary";
import { CheckCircle2, CloudUpload, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

const ACCEPTED = "image/png,image/jpeg,image/jpg,image/webp";

export default function FileUpload({
  value,
  onChange,
  label,
  recommended,
  aspect = "aspect-video",
  folder,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  recommended?: string;
  aspect?: string;
  folder?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const handleFile = async (f: File) => {
    const v = validateImage(f);
    if (!v.ok) {
      toast.error(v.message);
      return;
    }
    setBusy(true);
    setProgress(0);
    setDone(false);
    try {
      const res = await uploadImage(f, {
        folder,
        onProgress: (pct) => setProgress(pct),
      });
      onChange(res.url);
      setDone(true);
      toast.success(
        res.source === "cloudinary" ? "Uploaded to Cloudinary" : "Uploaded"
      );
      setTimeout(() => setDone(false), 1500);
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div>
      {label && <div className="label">{label}</div>}
      <div
        onClick={() => !busy && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`relative ${aspect} border-2 border-dashed transition group bg-ink-950 flex items-center justify-center overflow-hidden ${
          busy
            ? "border-white/30 cursor-wait"
            : drag
            ? "border-white bg-white/5 cursor-copy"
            : "border-white/15 hover:border-white/40 cursor-pointer"
        }`}
      >
        {value ? (
          <>
            <Image
              src={value}
              alt=""
              fill
              className="object-contain"
              sizes="(min-width:1024px) 25vw, 50vw"
              unoptimized={value.startsWith("data:")}
            />
            {!busy && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                className="absolute top-2 right-2 w-8 h-8 grid place-items-center bg-black/70 backdrop-blur border border-white/15 hover:bg-white hover:text-black"
                aria-label="Remove"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            )}
            {!busy && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="text-[10px] uppercase tracking-[0.25em] text-white">
                  Click to replace
                </div>
              </div>
            )}
            {done && (
              <div className="absolute top-2 left-2 w-8 h-8 grid place-items-center bg-emerald-500/90 text-black">
                <CheckCircle2 size={14} strokeWidth={2} />
              </div>
            )}
          </>
        ) : (
          <div className="text-center px-4">
            {busy ? (
              <Loader2
                size={22}
                strokeWidth={1.4}
                className="mx-auto text-silver-200 animate-spin"
              />
            ) : (
              <Upload
                size={22}
                strokeWidth={1.4}
                className="mx-auto text-silver-400"
              />
            )}
            <div className="text-[11px] uppercase tracking-[0.25em] text-silver-300 mt-3">
              {busy ? "Uploading…" : "Click or drop file"}
            </div>
            {recommended && !busy && (
              <div className="text-[9px] uppercase tracking-[0.25em] text-silver-500 mt-1.5">
                Recommended {recommended}
              </div>
            )}
          </div>
        )}

        {/* Progress bar */}
        {busy && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <input
          ref={input}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] uppercase tracking-[0.22em] text-silver-500">
        <span>PNG · JPG · JPEG · WEBP</span>
        <span>Max 10 MB</span>
        {cloudinaryEnabled() ? (
          <span className="inline-flex items-center gap-1 text-emerald-400">
            <CloudUpload size={11} /> Cloudinary
          </span>
        ) : (
          <span className="text-amber-400">Local mode</span>
        )}
      </div>
    </div>
  );
}
