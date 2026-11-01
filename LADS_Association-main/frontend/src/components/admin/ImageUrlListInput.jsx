import { Plus, Trash2, ImageOff } from "lucide-react";

export default function ImageUrlListInput({ value = [], onChange, label }) {
  const list = Array.isArray(value) ? value : [];

  const updateAt = (idx, v) => {
    const next = [...list];
    next[idx] = v;
    onChange(next);
  };

  const removeAt = (idx) => {
    onChange(list.filter((_, i) => i !== idx));
  };

  const add = () => onChange([...list, ""]);

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-brand-text">{label}</label>
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
          >
            <Plus size={14} /> Add image
          </button>
        </div>
      )}

      {list.length === 0 && (
        <p className="text-xs text-brand-muted italic">No images yet.</p>
      )}

      <div className="space-y-2">
        {list.map((url, idx) => (
          <Row
            key={idx}
            url={url}
            onChange={(v) => updateAt(idx, v)}
            onRemove={() => removeAt(idx)}
          />
        ))}
      </div>
    </div>
  );
}

function Row({ url, onChange, onRemove }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-shrink-0 w-12 h-12 rounded-md border border-brand-border bg-gray-50 flex items-center justify-center overflow-hidden">
        {url ? (
          <img
            src={url}
            alt="preview"
            className="w-full h-full object-cover"
            onError={(e) => (e.target.style.display = "none")}
          />
        ) : (
          <ImageOff size={16} className="text-gray-300" />
        )}
      </div>
      <input
        type="url"
        value={url || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://..."
        className="flex-1 px-3 py-2 text-sm bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
      />
      <button
        type="button"
        onClick={onRemove}
        className="p-2 rounded-md text-brand-danger hover:bg-red-50"
        aria-label="Remove"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
