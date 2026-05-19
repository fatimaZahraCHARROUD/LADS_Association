import { Pencil, Trash2, Eye, Send } from "lucide-react";

export default function RowActions({ onView, onEdit, onTogglePublish, isPublished, onDelete }) {
  return (
    <div className="flex items-center gap-1 justify-end">
      {onView && (
        <IconButton onClick={onView} title="View" tone="muted">
          <Eye size={16} />
        </IconButton>
      )}
      {onTogglePublish && (
        <IconButton
          onClick={onTogglePublish}
          title={isPublished ? "Unpublish" : "Publish"}
          tone={isPublished ? "accent" : "secondary"}
        >
          <Send size={16} />
        </IconButton>
      )}
      {onEdit && (
        <IconButton onClick={onEdit} title="Edit" tone="primary">
          <Pencil size={16} />
        </IconButton>
      )}
      {onDelete && (
        <IconButton onClick={onDelete} title="Delete" tone="danger">
          <Trash2 size={16} />
        </IconButton>
      )}
    </div>
  );
}

function IconButton({ children, onClick, title, tone = "muted" }) {
  const tones = {
    muted:     "text-brand-muted hover:bg-gray-100 hover:text-brand-text",
    primary:   "text-brand-primary hover:bg-blue-50",
    accent:    "text-brand-accent hover:bg-emerald-50",
    secondary: "text-brand-secondary hover:bg-amber-50",
    danger:    "text-brand-danger hover:bg-red-50",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`p-1.5 rounded-md transition-colors ${tones[tone]}`}
    >
      {children}
    </button>
  );
}
