export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      {eyebrow && (
        <div className="text-[11px] uppercase tracking-[0.3em] text-silver-400 mb-3">
          {eyebrow}
        </div>
      )}
      <h2 className="font-display text-3xl sm:text-4xl md:text-5xl silver-text">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-silver-400 max-w-xl mx-auto text-sm">
          {subtitle}
        </p>
      )}
    </div>
  );
}
