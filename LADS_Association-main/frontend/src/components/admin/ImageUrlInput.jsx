import { useState } from "react";
import { ImageOff } from "lucide-react";

export default function ImageUrlInput({ value = "", onChange, label, placeholder = "https://..." }) {
  const [error, setError] = useState(false);

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-brand-text">{label}</label>
      )}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-20 h-20 rounded-lg border border-brand-border bg-gray-50 flex items-center justify-center overflow-hidden">
          {value && !error ? (
            <img
              src={value}
              alt="preview"
              className="w-full h-full object-cover"
              onError={() => setError(true)}
            />
          ) : (
            <ImageOff size={22} className="text-gray-300" />
          )}
        </div>
        <input
          type="url"
          value={value || ""}
          onChange={(e) => {
            setError(false);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
        />
      </div>
    </div>
  );
}
