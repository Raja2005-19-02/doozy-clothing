// Cloudinary — unsigned client-side uploads.
// No API secret is shipped to the browser. You only need:
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
//   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET  (mode = unsigned, in Cloudinary console)
//   NEXT_PUBLIC_CLOUDINARY_FOLDER          (optional)
//
// If not configured, we fall back to a local FileReader → base64 URL so the UI
// still works in dev. Callers can call cloudinaryEnabled() to know which path
// will be taken.

export const CLOUDINARY = {
  cloud: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
  preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "",
  folder: process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "",
};

export const cloudinaryEnabled = () =>
  Boolean(CLOUDINARY.cloud && CLOUDINARY.preset);

export interface UploadResult {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  source: "cloudinary" | "local";
}

export interface UploadOptions {
  folder?: string;
  onProgress?: (pct: number) => void;
  signal?: AbortSignal;
}

const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
export const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateImage(file: File) {
  if (!ACCEPTED.includes(file.type)) {
    return { ok: false as const, message: "Only PNG, JPG, JPEG, WEBP allowed" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false as const, message: "Max size 10 MB" };
  }
  return { ok: true as const };
}

export async function uploadImage(
  file: File,
  opts: UploadOptions = {}
): Promise<UploadResult> {
  const v = validateImage(file);
  if (!v.ok) throw new Error(v.message);

  if (cloudinaryEnabled()) {
    return cloudinaryUpload(file, opts);
  }
  // Local dev fallback
  const url = await fileToDataUrl(file, opts.onProgress);
  return { url, source: "local", bytes: file.size };
}

function cloudinaryUpload(
  file: File,
  opts: UploadOptions
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloud}/image/upload`;
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", CLOUDINARY.preset);
    const folder = opts.folder || CLOUDINARY.folder;
    if (folder) form.append("folder", folder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    if (opts.signal) {
      opts.signal.addEventListener("abort", () => xhr.abort());
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && opts.onProgress) {
        opts.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            url: json.secure_url,
            publicId: json.public_id,
            width: json.width,
            height: json.height,
            bytes: json.bytes,
            format: json.format,
            source: "cloudinary",
          });
        } else {
          reject(new Error(json?.error?.message || "Cloudinary upload failed"));
        }
      } catch (e) {
        reject(new Error("Invalid Cloudinary response"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    xhr.send(form);
  });
}

function fileToDataUrl(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      onProgress?.(100);
      res(String(r.result));
    };
    r.onerror = () => rej(r.error);
    r.onprogress = (e) => {
      if (e.lengthComputable && onProgress)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    r.readAsDataURL(file);
  });
}

// Helper: build an optimized Cloudinary delivery URL (auto format + quality).
// Pass any transformations (e.g. "w_1200,c_fill") to size the image.
export function cldOptim(url: string, transform = "q_auto,f_auto") {
  if (!url) return url;
  if (!url.includes("res.cloudinary.com")) return url;
  // /upload/<transform>/<rest>
  return url.replace("/upload/", `/upload/${transform}/`);
}
