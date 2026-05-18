import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Eye, Send } from "lucide-react";

export default function RowActions({ onView, onEdit, onTogglePublish, isPublished, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const run = (fn) => () => {
    setOpen(false);
    if (fn) fn();
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Actions"
        aria-label="Actions"
        className="p-1.5 rounded-md text-brand-muted hover:bg-gray-100 hover:text-brand-text transition-colors"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-brand-border rounded-xl shadow-lg overflow-hidden z-30">
          {onView && (
            <MenuItem onClick={run(onView)} icon={<Eye size={14} />}>View</MenuItem>
          )}
          {onTogglePublish && (
            <MenuItem
              onClick={run(onTogglePublish)}
              icon={<Send size={14} />}
              tone={isPublished ? "accent" : "secondary"}
            >
              {isPublished ? "Unpublish" : "Publish"}
            </MenuItem>
          )}
          {onEdit && (
            <MenuItem onClick={run(onEdit)} icon={<Pencil size={14} />} tone="primary">
              Edit
            </MenuItem>
          )}
          {onDelete && (
            <MenuItem onClick={run(onDelete)} icon={<Trash2 size={14} />} tone="danger">
              Delete
            </MenuItem>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({ children, icon, onClick, tone = "default" }) {
  const tones = {
    default:   "text-brand-text hover:bg-gray-50",
    primary:   "text-brand-primary hover:bg-blue-50",
    accent:    "text-brand-accent hover:bg-emerald-50",
    secondary: "text-brand-secondary hover:bg-amber-50",
    danger:    "text-brand-danger hover:bg-red-50",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors ${tones[tone]}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
}
