export function Field({ label, required, children, hint }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-brand-text">
          {label}
          {required && <span className="text-brand-danger ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-xs text-brand-muted">{hint}</p>}
    </div>
  );
}

const inputBase =
  "w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary";

export function TextInput(props) {
  return <input type="text" {...props} className={`${inputBase} ${props.className || ""}`} />;
}

export function NumberInput(props) {
  return <input type="number" {...props} className={`${inputBase} ${props.className || ""}`} />;
}

export function DateInput(props) {
  return <input type="date" {...props} className={`${inputBase} ${props.className || ""}`} />;
}

export function TimeInput(props) {
  return <input type="time" {...props} className={`${inputBase} ${props.className || ""}`} />;
}

export function UrlInput(props) {
  return <input type="url" {...props} className={`${inputBase} ${props.className || ""}`} />;
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className={`${inputBase} ${props.className || ""}`}>
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <span className="relative">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <span className="block w-10 h-6 bg-gray-300 peer-checked:bg-brand-accent rounded-full transition-colors" />
        <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
      </span>
      {label && <span className="text-sm text-brand-text">{label}</span>}
    </label>
  );
}
