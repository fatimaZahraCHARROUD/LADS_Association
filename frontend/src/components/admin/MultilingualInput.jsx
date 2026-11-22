import { useState } from "react";

const LANGS = [
  { code: "en", label: "EN", dir: "ltr" },
  { code: "fr", label: "FR", dir: "ltr" },
  { code: "ar", label: "AR", dir: "rtl" },
];

export default function MultilingualInput({
  value = { en: "", fr: "", ar: "" },
  onChange,
  label,
  required = false,
  placeholder = "",
  as = "input",
  rows = 4,
}) {
  const [active, setActive] = useState("en");
  const safeValue = { en: "", fr: "", ar: "", ...(value || {}) };
  const current = LANGS.find((l) => l.code === active);

  const handleChange = (e) => {
    onChange({ ...safeValue, [active]: e.target.value });
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-brand-text">
            {label}
            {required && <span className="text-brand-danger ml-0.5">*</span>}
          </label>
          <div className="flex gap-1 rounded-md bg-gray-100 p-0.5">
            {LANGS.map((l) => {
              const has = safeValue[l.code]?.trim().length > 0;
              return (
                <button
                  type="button"
                  key={l.code}
                  onClick={() => setActive(l.code)}
                  className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                    active === l.code
                      ? "bg-white text-brand-primary shadow-sm"
                      : "text-brand-muted hover:text-brand-text"
                  }`}
                >
                  {l.label}
                  {has && (
                    <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-brand-accent" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {as === "textarea" ? (
        <textarea
          value={safeValue[active]}
          onChange={handleChange}
          rows={rows}
          dir={current.dir}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-y"
        />
      ) : (
        <input
          type="text"
          value={safeValue[active]}
          onChange={handleChange}
          dir={current.dir}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
        />
      )}
    </div>
  );
}
