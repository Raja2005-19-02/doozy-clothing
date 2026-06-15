export const inr = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(typeof n === "number" && Number.isFinite(n) ? n : 0);

export const date = (ts?: number | null) =>
  typeof ts === "number" && ts > 0
    ? new Date(ts).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
