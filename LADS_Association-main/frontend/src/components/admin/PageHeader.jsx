import { Plus } from "lucide-react";

export default function PageHeader({ title, subtitle, onAdd, addLabel = "Add New", children }) {
  return (
    <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-text">{title}</h1>
        {subtitle && <p className="text-sm text-brand-muted mt-2">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {onAdd && (
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-medium text-sm px-5 py-2.5 rounded-xl shadow-sm transition-colors"
          >
            <Plus size={16} />
            {addLabel}
          </button>
        )}
      </div>
    </header>
  );
}
