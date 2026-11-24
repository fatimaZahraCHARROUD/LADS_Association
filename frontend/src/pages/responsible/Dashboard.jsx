import { useEffect, useState } from "react";
import { CalendarDays, Check, Clock3, Target, Users } from "lucide-react";
import { api } from "../../services/api";

export default function RespDashboard() {
  const [user, setUser] = useState({});
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem("user") || "{}")); } catch {}
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const to = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();
    Promise.all([
      api.get("/members/search").catch(() => []),
      api.get("/tasks").catch(() => []),
      api.get(`/meetings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`).catch(() => []),
    ]).then(([m, t, mt]) => {
      setMembers(Array.isArray(m) ? m : []);
      setTasks(Array.isArray(t) ? t : []);
      setMeetings(Array.isArray(mt) ? mt : []);
    }).finally(() => setLoading(false));
  }, []);

  const pending = tasks.filter((t) => t.status !== "done" && t.status !== "completed");
  const completed = tasks.filter((t) => t.status === "done" || t.status === "completed");
  const upcoming = meetings.filter((m) => new Date(m.startAt) >= new Date());
  const nextMeeting = upcoming[0];

  const colors = ["bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-orange-100 text-orange-700", "bg-indigo-100 text-indigo-700"];
  const initials = (name = "") => name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brand-primary">Tableau de bord</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-brand-text">
            Bonjour{user.fullName ? `, ${user.fullName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-brand-muted">Priorités et avancement de votre équipe.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-muted">
          <Clock3 size={16} /> {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-brand-border bg-white p-5">
          <p className="text-sm text-brand-muted">Tâches en cours</p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-bold text-brand-text">{loading ? "—" : pending.length}</p>
            {pending.filter((t) => t.priority === "High" || t.priority === "high").length > 0 && (
              <span className="mb-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                {pending.filter((t) => t.priority === "High" || t.priority === "high").length} urgent{pending.filter((t) => t.priority === "High" || t.priority === "high").length > 1 ? "es" : "e"}
              </span>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-brand-border bg-white p-5">
          <p className="text-sm text-brand-muted">Tâches terminées</p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-bold text-brand-text">{loading ? "—" : completed.length}</p>
            <span className="mb-1 inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><Check size={13} /> Ce mois</span>
          </div>
        </div>
        <div className="rounded-2xl border border-brand-border bg-white p-5">
          <p className="text-sm text-brand-muted">Réunions à venir</p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-bold text-brand-text">{loading ? "—" : upcoming.length}</p>
            {nextMeeting && (
              <span className="mb-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-brand-primary">
                Prochain: {new Date(nextMeeting.startAt).toLocaleDateString("fr-FR", { weekday: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div><h2 className="font-semibold text-brand-text">Mon équipe</h2><p className="mt-1 text-sm text-brand-muted">{loading ? "…" : `${members.length} membre${members.length !== 1 ? "s" : ""}`}</p></div>
            <Users className="text-brand-primary" size={19} />
          </div>
          {loading ? (
            <p className="text-sm text-brand-muted">Chargement…</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-brand-muted">Aucun membre dans votre département.</p>
          ) : (
            <div className="divide-y divide-brand-border">
              {members.slice(0, 6).map((m, i) => (
                <div key={m._id || m.id} className="flex items-center gap-3 py-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${colors[i % colors.length]}`}>
                    {initials(m.fullName)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-text">{m.fullName || m.email}</p>
                    <p className="mt-0.5 text-xs text-brand-muted">{m.situation || m.email || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div><h2 className="font-semibold text-brand-text">Tâches en cours</h2><p className="mt-1 text-sm text-brand-muted">Prochains éléments à coordonner</p></div>
            {pending.length > 0 && <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{pending.length} ouvert{pending.length > 1 ? "s" : ""}</span>}
          </div>
          {loading ? (
            <p className="text-sm text-brand-muted">Chargement…</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-brand-muted">Aucune tâche en cours.</p>
          ) : (
            <div className="space-y-3">
              {pending.slice(0, 4).map((task) => (
                <article key={task._id || task.id} className="flex items-start gap-3 rounded-xl bg-brand-bg p-3.5">
                  <span className="mt-0.5 text-brand-muted"><Clock3 size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-brand-text">{task.title}</p>
                    {task.deadline && <p className="mt-1 text-xs text-brand-muted">Échéance: {new Date(task.deadline).toLocaleDateString("fr-FR")}</p>}
                  </div>
                  <span className={`rounded-md px-2 py-1 text-[11px] font-medium ${task.priority === "High" || task.priority === "high" ? "bg-rose-50 text-rose-700" : "bg-white text-brand-muted"}`}>
                    {task.priority || "—"}
                  </span>
                </article>
              ))}
            </div>
          )}
          {nextMeeting && (
            <div className="mt-4 flex items-center gap-2 border-t border-brand-border pt-4 text-sm text-brand-muted">
              <CalendarDays size={16} />
              {nextMeeting.title}
              <span className="text-brand-text">{new Date(nextMeeting.startAt).toLocaleString("fr-FR", { weekday: "long", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
