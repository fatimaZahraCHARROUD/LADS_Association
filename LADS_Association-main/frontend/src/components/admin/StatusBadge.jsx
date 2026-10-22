const VARIANTS = {
  upcoming:  "bg-blue-100 text-brand-primary",
  ongoing:   "bg-amber-100 text-amber-700",
  past:      "bg-gray-200 text-gray-700",
  completed: "bg-gray-200 text-gray-700",
  published: "bg-emerald-100 text-brand-accent",
  draft:     "bg-amber-100 text-amber-700",
  default:   "bg-gray-100 text-gray-700",
};

export default function StatusBadge({ children, variant = "default", className = "" }) {
  const v = VARIANTS[variant] || VARIANTS.default;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${v} ${className}`}
    >
      {children}
    </span>
  );
}
