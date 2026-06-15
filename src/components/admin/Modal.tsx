"use client";
export default function Modal({
  children,
  onClose,
  size = "md",
}: {
  children: React.ReactNode;
  onClose: () => void;
  size?: "md" | "lg" | "xl";
}) {
  const maxW =
    size === "xl" ? "max-w-3xl" : size === "lg" ? "max-w-2xl" : "max-w-lg";
  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 grid place-items-start overflow-y-auto p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className={`bg-ink-900 border border-white/10 p-5 sm:p-6 w-full ${maxW} my-4 sm:my-8 mx-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
