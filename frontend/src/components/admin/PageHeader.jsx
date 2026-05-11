import { Plus } from "lucide-react";

export default function PageHeader({ title, subtitle, onAdd, addLabel = "Add New", children }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text">{title}</h1>
        {subtitle && <p className="text-sm text-brand-muted mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {onAdd && (
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <Plus size={16} />
            {addLabel}
          </button>
        )}
      </div>
    </header>
  );
}
