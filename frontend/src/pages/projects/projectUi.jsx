import { Crown, CheckCircle2, Clock, CircleDashed } from "lucide-react";
import { displayName } from "../../services/projectWorkApi";

export const STATUS = {
  todo: { label: "À faire", cls: "bg-slate-100 text-slate-700 ring-slate-200", Icon: CircleDashed },
  in_progress: { label: "En cours", cls: "bg-amber-50 text-amber-700 ring-amber-200", Icon: Clock },
  completed: { label: "Terminée", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", Icon: CheckCircle2 },
};

export function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.todo;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${s.cls}`}>
      <s.Icon size={13} /> {s.label}
    </span>
  );
}

export const idOf = (v) => String(v?._id ?? v);

const initials = (n = "") =>
  n.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export function Avatar({ user, crown }) {
  const name = displayName(user);
  return (
    <div className="relative" title={name}>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white ring-2 ring-white">
        {initials(name)}
      </div>
      {crown && <Crown size={12} className="absolute -right-1 -top-1 rounded-full bg-amber-400 p-0.5 text-white" />}
    </div>
  );
}