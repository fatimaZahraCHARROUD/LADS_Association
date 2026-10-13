import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BarChart3, CalendarRange, CheckCircle2, ClipboardList, FileText, Filter, LoaderCircle, Plus, Trash2, UserRound, Users, AlertTriangle } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../../services/api";
import StatCard from "../../components/statcard";

const DEFAULT_FORM = {
  text: "",
  noteType: "info",
  departmentId: "",
  memberId: "",
};

export default function StatisticsFollowupPage() {
  const [summary, setSummary] = useState({
    overview: {},
    departments: [],
    recentActivities: [],
    recentNotes: [],
    activityTrend: [],
  });
  const [filters, setFilters] = useState({
    departmentId: "",
    memberId: "",
    authorId: "",
    noteType: "",
    period: "month",
    from: "",
    to: "",
  });
  const [noteForm, setNoteForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [departments, setDepartments] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (filters.departmentId) params.set("departmentId", filters.departmentId);
      if (filters.memberId) params.set("memberId", filters.memberId);
      if (filters.authorId) params.set("authorId", filters.authorId);
      if (filters.noteType) params.set("noteType", filters.noteType);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.period) params.set("period", filters.period);

      const [dashboard, departmentList] = await Promise.all([
        api.get(`/statistics/dashboard?${params.toString()}`),
        api.get("/departments").catch(() => []),
      ]);

      setSummary(dashboard || { overview: {}, departments: [], recentActivities: [], recentNotes: [], activityTrend: [] });
      setDepartments(departmentList || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load statistics.");
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      setNotesLoading(true);
      const params = new URLSearchParams();
      if (filters.departmentId) params.set("departmentId", filters.departmentId);
      if (filters.memberId) params.set("memberId", filters.memberId);
      if (filters.authorId) params.set("authorId", filters.authorId);
      if (filters.noteType) params.set("noteType", filters.noteType);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);

      const data = await api.get(`/followups?${params.toString()}`);
      setSummary((current) => ({ ...current, recentNotes: Array.isArray(data) ? data : [] }));
    } catch (noteError) {
      toast.error(noteError.message || "Unable to load follow-up notes.");
    } finally {
      setNotesLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.departmentId, filters.memberId, filters.authorId, filters.noteType, filters.from, filters.to, filters.period]);

  const overviewCards = useMemo(() => [
    { label: "Departments", value: summary.overview?.totalDepartments ?? 0, color: "text-brand-primary", ring: "#2563eb", change: 0 },
    { label: "Members", value: summary.overview?.totalMembers ?? 0, color: "text-indigo-500", ring: "#6366f1", change: 0 },
    { label: "Completed tasks", value: summary.overview?.completedTasks ?? 0, color: "text-emerald-500", ring: "#10b981", change: 0 },
    { label: "Meetings", value: summary.overview?.meetingsHeld ?? 0, color: "text-orange-500", ring: "#f97316", change: 0 },
  ], [summary]);

  const handleNoteSubmit = async (event) => {
    event.preventDefault();
    if (!noteForm.text.trim()) {
      toast.error("Please enter note text.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        text: noteForm.text.trim(),
        noteType: noteForm.noteType,
        ...(noteForm.departmentId ? { departmentId: noteForm.departmentId } : {}),
        ...(noteForm.memberId ? { memberId: noteForm.memberId } : {}),
      };

      if (editingNoteId) {
        await api.patch(`/followups/${editingNoteId}`, payload);
        toast.success("Follow-up note updated.");
      } else {
        await api.post("/followups", payload);
        toast.success("Follow-up note added.");
      }

      setNoteForm(DEFAULT_FORM);
      setEditingNoteId(null);
      await loadNotes();
      await loadData();
    } catch (submitError) {
      toast.error(submitError.message || "Unable to save note.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (note) => {
    setEditingNoteId(note._id);
    setNoteForm({
      text: note.text || "",
      noteType: note.noteType || "info",
      departmentId: note.departmentId?._id || note.departmentId || "",
      memberId: note.memberId?._id || note.memberId || "",
    });
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm("Delete this follow-up note?")) return;
    try {
      await api.delete(`/followups/${noteId}`);
      toast.success("Note deleted.");
      await loadNotes();
      await loadData();
    } catch (deleteError) {
      toast.error(deleteError.message || "Unable to delete note.");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brand-primary">Operations dashboard</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-brand-text">Statistics &amp; Follow-up</h1>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-muted">
          <CalendarRange size={16} />
          <span>{filters.period === "week" ? "Weekly view" : "Monthly view"}</span>
        </div>
      </header>

      <section className="rounded-2xl border border-brand-border bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-muted">
            <Filter size={15} /> Filters
          </div>
          <select value={filters.departmentId} onChange={(event) => setFilters((current) => ({ ...current, departmentId: event.target.value }))} className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm">
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department._id} value={department._id}>{department.name}</option>
            ))}
          </select>
          <input value={filters.memberId} onChange={(event) => setFilters((current) => ({ ...current, memberId: event.target.value }))} placeholder="Member ID" className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm" />
          <input value={filters.authorId} onChange={(event) => setFilters((current) => ({ ...current, authorId: event.target.value }))} placeholder="Author ID" className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm" />
          <select value={filters.noteType} onChange={(event) => setFilters((current) => ({ ...current, noteType: event.target.value }))} className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm">
            <option value="">All note types</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="action">Action</option>
          </select>
          <input value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} type="date" className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm" />
          <input value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} type="date" className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm" />
          <select value={filters.period} onChange={(event) => setFilters((current) => ({ ...current, period: event.target.value }))} className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm">
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-brand-border bg-white p-5 text-sm text-brand-muted"><LoaderCircle className="animate-spin" size={18} /> Loading statistics…</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Main statistics">
            {overviewCards.map((stat) => (
              <StatCard key={stat.label} def={stat} stat={{ value: stat.value, ring: 68, change: stat.change }} pillSuffix="overall" />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
            <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-brand-text">Activity trend</h2>
                  <p className="mt-1 text-sm text-brand-muted">Task, meeting, and activity volume</p>
                </div>
                <BarChart3 className="text-brand-primary" size={20} />
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.activityTrend || []}>
                    <CartesianGrid vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tasks" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="meetings" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="activities" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-brand-text">Recent activity</h2>
                  <p className="mt-1 text-sm text-brand-muted">Latest updates</p>
                </div>
                <ClipboardList className="text-brand-primary" size={18} />
              </div>
              <div className="space-y-3">
                {(summary.recentActivities || []).length === 0 ? (
                  <div className="rounded-xl bg-brand-bg p-4 text-sm text-brand-muted">No recent activity available for the selected filters.</div>
                ) : (
                  (summary.recentActivities || []).map((item, index) => (
                    <div key={`${item.type}-${index}`} className="rounded-xl bg-brand-bg p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-brand-text">{item.title}</p>
                          <p className="mt-1 text-xs text-brand-muted">{item.detail}</p>
                        </div>
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-brand-primary">{item.type}</span>
                      </div>
                      <p className="mt-2 text-[11px] text-brand-muted">{new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.3fr_1fr]">
            <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-brand-text">Department overview</h2>
                  <p className="mt-1 text-sm text-brand-muted">Member and task health by department</p>
                </div>
                <Users className="text-brand-primary" size={18} />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-brand-border text-left text-sm">
                  <thead>
                    <tr className="text-brand-muted">
                      <th className="px-2 py-2 font-medium">Department</th>
                      <th className="px-2 py-2 font-medium">Members</th>
                      <th className="px-2 py-2 font-medium">Completed</th>
                      <th className="px-2 py-2 font-medium">Pending</th>
                      <th className="px-2 py-2 font-medium">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {(summary.departments || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-2 py-6 text-center text-brand-muted">No departments match the current filters.</td>
                      </tr>
                    ) : (
                      (summary.departments || []).map((department) => (
                        <tr key={department._id}>
                          <td className="px-2 py-3 font-medium text-brand-text">{department.name}</td>
                          <td className="px-2 py-3">{department.totalMembers ?? 0}</td>
                          <td className="px-2 py-3">{department.completedTasks ?? 0}</td>
                          <td className="px-2 py-3">{department.pendingTasks ?? 0}</td>
                          <td className="px-2 py-3">{department.currentProgress ?? 0}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-brand-text">Follow-up notes</h2>
                  <p className="mt-1 text-sm text-brand-muted">Recent team updates</p>
                </div>
                <FileText className="text-brand-primary" size={18} />
              </div>
              {notesLoading ? (
                <div className="text-sm text-brand-muted">Loading notes…</div>
              ) : (summary.recentNotes || []).length === 0 ? (
                <div className="rounded-xl bg-brand-bg p-4 text-sm text-brand-muted">No notes recorded for this scope.</div>
              ) : (
                <div className="space-y-3">
                  {(summary.recentNotes || []).slice(0, 4).map((note) => (
                    <div key={note._id} className="rounded-xl bg-brand-bg p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-brand-primary">{note.noteType || "info"}</span>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => handleEdit(note)} className="text-xs text-brand-primary">Edit</button>
                          <button type="button" onClick={() => handleDelete(note._id)} className="text-xs text-red-600">Delete</button>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-brand-text">{note.text}</p>
                      <p className="mt-2 text-[11px] text-brand-muted">{note.authorName || note.author?.fullName || "Unknown author"} · {new Date(note.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.1fr]">
            <form onSubmit={handleNoteSubmit} className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-brand-text">{editingNoteId ? "Edit follow-up" : "Add follow-up"}</h2>
                  <p className="mt-1 text-sm text-brand-muted">Create a note for the current team or member.</p>
                </div>
                <Plus className="text-brand-primary" size={18} />
              </div>

              <div className="space-y-3">
                <textarea value={noteForm.text} onChange={(event) => setNoteForm((current) => ({ ...current, text: event.target.value }))} rows={5} className="w-full rounded-xl border border-brand-border bg-brand-bg p-3 text-sm text-brand-text outline-none focus:border-brand-primary" placeholder="Write the follow-up note…" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <select value={noteForm.noteType} onChange={(event) => setNoteForm((current) => ({ ...current, noteType: event.target.value }))} className="rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-sm">
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="action">Action</option>
                  </select>
                  <select value={noteForm.departmentId} onChange={(event) => setNoteForm((current) => ({ ...current, departmentId: event.target.value }))} className="rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-sm">
                    <option value="">Department (optional)</option>
                    {departments.map((department) => (
                      <option key={department._id} value={department._id}>{department.name}</option>
                    ))}
                  </select>
                </div>
                <input value={noteForm.memberId} onChange={(event) => setNoteForm((current) => ({ ...current, memberId: event.target.value }))} placeholder="Member ID (optional)" className="w-full rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-sm" />
              </div>

              <div className="mt-4 flex items-center justify-between">
                {editingNoteId && (
                  <button type="button" className="text-sm text-brand-muted" onClick={() => { setEditingNoteId(null); setNoteForm(DEFAULT_FORM); }}>Cancel</button>
                )}
                <button type="submit" disabled={saving} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                  {saving ? <LoaderCircle className="animate-spin" size={16} /> : <Plus size={16} />}
                  {saving ? "Saving…" : editingNoteId ? "Update note" : "Add note"}
                </button>
              </div>
            </form>

            <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-brand-text">Operational summary</h2>
                  <p className="mt-1 text-sm text-brand-muted">Key execution indicators</p>
                </div>
                <CheckCircle2 className="text-brand-primary" size={18} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-brand-bg p-3">
                  <span className="text-sm text-brand-muted">Completed tasks</span>
                  <span className="font-semibold text-brand-text">{summary.overview?.completedTasks ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-brand-bg p-3">
                  <span className="text-sm text-brand-muted">Pending tasks</span>
                  <span className="font-semibold text-brand-text">{summary.overview?.pendingTasks ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-brand-bg p-3">
                  <span className="text-sm text-brand-muted">Overdue tasks</span>
                  <span className="font-semibold text-brand-text">{summary.overview?.overdueTasks ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-brand-bg p-3">
                  <span className="text-sm text-brand-muted">Meetings held</span>
                  <span className="font-semibold text-brand-text">{summary.overview?.meetingsHeld ?? 0}</span>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
