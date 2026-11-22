import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { BarChart3, CalendarRange, CheckCircle2, ClipboardList, FileText, Filter, LoaderCircle, Plus, Users, Pencil, Trash2, Building2, UserRound, ListTodo, CircleAlert, ArrowRight, Clock3 } from "lucide-react";
import { api, getCurrentUserId } from "../../services/api";
import Drawer from "../../components/admin/Drawer";
import { getEffectiveRole } from "../../utils/activeRole";

const DEFAULT_FORM = {
  text: "",
  noteType: "info",
  departmentId: "",
  memberId: "",
};

const DEFAULT_ACTIVITY_FORM = {
  title: "",
  description: "",
  departmentId: "",
  memberId: "",
  activityDate: new Date().toISOString().slice(0, 10),
  categorie: "",
};

const DEFAULT_TASK_FORM = {
  title: "",
  description: "",
  departmentId: "",
  assignedTo: "",
  priority: "medium",
  deadline: "",
  status: "todo",
};

const memberIdOf = (member) =>
  typeof member === "string" ? member : member?._id;

const departmentIdOf = (department) =>
  typeof department === "string" ? department : department?._id;

const utcDay = (value) => {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const queryParams = (values) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params;
};

const getStoredActiveRole = () => {
  try {
    return getEffectiveRole(JSON.parse(localStorage.getItem("user") || "{}"));
  } catch {
    return null;
  }
};

export default function FollowupDashboard() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUserId = getCurrentUserId();
  const activeRole = getStoredActiveRole();
  const isGlobalAdmin = activeRole === "President";
  const canManageFollowups =
    isGlobalAdmin || ["Director Executive", "Team Manager"].includes(activeRole);
  const canManageTasks =
    isGlobalAdmin ||
    ["Director Executive", "Team Manager", "Responsable"].includes(activeRole);
  const [summary, setSummary] = useState({
    overview: {},
    departments: [],
    recentActivities: [],
    recentNotes: [],
    activityTrend: [],
  });
  const [memberSummary, setMemberSummary] = useState(null);
  const [memberSummaryFor, setMemberSummaryFor] = useState("");
  const [memberSummaryError, setMemberSummaryError] = useState("");
  const [memberSummaryErrorFor, setMemberSummaryErrorFor] = useState("");
  const [recentNotes, setRecentNotes] = useState([]);
  const initialDate = searchParams.get("from") || searchParams.get("to") || "";
  const [filters, setFilters] = useState(() => ({
    departmentId: searchParams.get("departmentId") || "",
    memberId: searchParams.get("memberId") || "",
    authorId: searchParams.get("authorId") || "",
    noteType: searchParams.get("noteType") || "",
    period: searchParams.get("period") || "month",
    from: initialDate,
    to: initialDate,
    taskStatus: searchParams.get("taskStatus") || "",
    deadline: searchParams.get("deadline") || "",
    completion: searchParams.get("completion") || "",
    search: searchParams.get("search") || "",
  }));
  const [viewMode, setViewMode] = useState(() =>
    searchParams.get("memberId")
      ? "member"
      : searchParams.get("departmentId")
        ? "department"
        : "general",
  );
  const [noteForm, setNoteForm] = useState(DEFAULT_FORM);
  const [activityForm, setActivityForm] = useState(DEFAULT_ACTIVITY_FORM);
  const [taskForm, setTaskForm] = useState(DEFAULT_TASK_FORM);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(true);
  const [error, setError] = useState("");
  const [notesError, setNotesError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [objectivesFor, setObjectivesFor] = useState("");
  const [objectivesLoading, setObjectivesLoading] = useState(false);
  const [objectivesError, setObjectivesError] = useState("");
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState("");
  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);
  const [noteDrawerOpen, setNoteDrawerOpen] = useState(false);
  const canCreateActivity =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/exec");

  const membersForDepartment = useCallback((departmentId) => {
    if (!departmentId) return members;
    const department = departments.find((item) => item._id === departmentId);
    if (!department) return [];
    const departmentMemberIds = new Set(
      [
        department.manager,
        department.viceManager,
        ...(department.teamManagers || []),
        ...(department.members || []),
      ]
        .map(memberIdOf)
        .filter(Boolean),
    );
    return members.filter((member) => {
      const id = memberIdOf(member);
      return (
        departmentMemberIds.has(id) ||
        (member.memberships || []).some(
          (membership) => departmentIdOf(membership.departmentId) === departmentId,
        ) ||
        (member.departement || []).some(
          (memberDepartmentId) => departmentIdOf(memberDepartmentId) === departmentId,
        )
      );
    });
  }, [departments, members]);

  const setFilter = (key, value) => {
    if (key === "departmentId" && value) setViewMode("department");
    if (key === "memberId" && value) setViewMode("member");
    if (key === "departmentId" && !value && !filters.memberId) setViewMode("general");
    setFilters((current) => {
      const next = { ...current, [key]: value };
      if (key === "departmentId" && next.memberId) {
        const departmentMembers = membersForDepartment(value);
        if (!departmentMembers.some((member) => memberIdOf(member) === next.memberId)) {
          next.memberId = "";
        }
      }
      return next;
    });
  };

  const clearFilters = () => {
    setViewMode("general");
    setFilters({
      departmentId: "",
      memberId: "",
      authorId: "",
      noteType: "",
      period: "month",
      from: "",
      to: "",
      taskStatus: "",
      deadline: "",
      completion: "",
      search: "",
    });
  };

  const availableMembers = useMemo(
    () => membersForDepartment(filters.departmentId),
    [membersForDepartment, filters.departmentId],
  );
  const activeView = filters.memberId
    ? "member"
    : filters.departmentId
      ? "department"
      : viewMode;
  const selectedDepartment = departments.find(
    (department) => department._id === filters.departmentId,
  );
  const selectedMember = members.find(
    (member) => memberIdOf(member) === filters.memberId,
  );

  useEffect(() => {
    const params = queryParams(filters);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const loadDirectory = async () => {
      try {
        setDirectoryLoading(true);
        setDirectoryError("");
        const [departmentList, memberList] = await Promise.all([
          api.get("/departments", { signal: controller.signal }),
          api.get("/members", { signal: controller.signal }),
        ]);
        if (!controller.signal.aborted) {
          setDepartments(Array.isArray(departmentList) ? departmentList : []);
          setMembers(Array.isArray(memberList) ? memberList : []);
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setDirectoryError(loadError.message || "Unable to load departments and members.");
        }
      } finally {
        if (!controller.signal.aborted) setDirectoryLoading(false);
      }
    };
    loadDirectory();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (!filters.departmentId) return () => controller.abort();
    const loadObjectives = async () => {
      try {
        setObjectivesLoading(true);
        setObjectivesError("");
        const result = await api.get("/objectives", { signal: controller.signal });
        if (!controller.signal.aborted) {
          setObjectives(
            (Array.isArray(result) ? result : []).filter(
              (objective) => departmentIdOf(objective.departmentId) === filters.departmentId,
            ),
          );
          setObjectivesFor(filters.departmentId);
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setObjectivesError(loadError.message || "Unable to load department objectives.");
        }
      } finally {
        if (!controller.signal.aborted) setObjectivesLoading(false);
      }
    };
    loadObjectives();
    return () => controller.abort();
  }, [filters.departmentId]);

  useEffect(() => {
    const controller = new AbortController();
    const params = queryParams({
      departmentId: filters.departmentId,
      memberId: filters.memberId,
      from: filters.from,
      to: filters.to,
      period: filters.period,
    });
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const dashboard = await api.get(
          `/statistics/dashboard?${params.toString()}`,
          { signal: controller.signal },
        );
        if (!controller.signal.aborted) {
          setSummary(dashboard || {
            overview: {},
            departments: [],
            recentActivities: [],
            recentNotes: [],
            activityTrend: [],
          });
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError.message || "Unable to load statistics.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    loadDashboard();
    return () => controller.abort();
  }, [filters.departmentId, filters.memberId, filters.from, filters.to, filters.period, refreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    if (!filters.memberId) {
      return () => controller.abort();
    }
    const loadMemberSummary = async () => {
      try {
        setMemberSummaryError("");
        const result = await api.get(
          `/statistics/members/${filters.memberId}`,
          { signal: controller.signal },
        );
        if (!controller.signal.aborted) {
          setMemberSummary(result);
          setMemberSummaryFor(filters.memberId);
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setMemberSummaryError(loadError.message || "Unable to load member statistics.");
          setMemberSummaryErrorFor(filters.memberId);
        }
      }
    };
    loadMemberSummary();
    return () => controller.abort();
  }, [filters.memberId, refreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    const params = queryParams({
      departmentId: filters.departmentId,
      assignedTo: filters.memberId,
      status: filters.taskStatus,
    });
    const loadTasks = async () => {
      try {
        setTasksLoading(true);
        setTasksError("");
        const result = await api.get(`/tasks?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setTasks(Array.isArray(result) ? result : []);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setTasksError(loadError.message || "Unable to load tasks.");
        }
      } finally {
        if (!controller.signal.aborted) setTasksLoading(false);
      }
    };
    loadTasks();
    return () => controller.abort();
  }, [filters.departmentId, filters.memberId, filters.taskStatus, refreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    const params = queryParams({
      departmentId: filters.departmentId,
      memberId: filters.memberId,
      authorId: filters.authorId,
      noteType: filters.noteType,
      from: filters.from,
      to: filters.to,
    });
    const loadNotes = async () => {
      try {
        setNotesLoading(true);
        setNotesError("");
        const data = await api.get(`/followups?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setRecentNotes(Array.isArray(data) ? data : []);
      } catch (noteError) {
        if (!controller.signal.aborted) {
          setNotesError(noteError.message || "Unable to load follow-up notes.");
        }
      } finally {
        if (!controller.signal.aborted) setNotesLoading(false);
      }
    };
    loadNotes();
    return () => controller.abort();
  }, [filters.departmentId, filters.memberId, filters.authorId, filters.noteType, filters.from, filters.to, refreshKey]);

  const filteredTasks = useMemo(() => {
    const now = new Date();
    const today = utcDay(now);
    const deadlineLimit = today + 8 * 24 * 60 * 60 * 1000;
    const startDate = filters.from ? new Date(`${filters.from}T00:00:00.000Z`) : null;
    const endDate = filters.to ? new Date(`${filters.to}T23:59:59.999Z`) : null;
    const query = filters.search.trim().toLocaleLowerCase();
    return tasks.filter((task) => {
      const taskDate = task.createdAt ? new Date(task.createdAt) : null;
      const deadline = task.deadline ? utcDay(task.deadline) : null;
      if (startDate && (!taskDate || taskDate < startDate)) return false;
      if (endDate && (!taskDate || taskDate > endDate)) return false;
      if (filters.completion === "completed" && task.status !== "done") return false;
      if (filters.completion === "not-completed" && task.status === "done") return false;
      if (filters.deadline === "overdue" && (deadline === null || deadline >= today || task.status === "done")) return false;
      if (filters.deadline === "today" && deadline !== today) return false;
      if (filters.deadline === "next-seven-days" && (deadline === null || deadline < today || deadline >= deadlineLimit)) return false;
      if (filters.deadline === "no-deadline" && deadline) return false;
      if (query && ![
        task.title,
        task.description,
        task.assignedTo?.fullName,
        task.departmentId?.name,
      ].some((value) => String(value || "").toLocaleLowerCase().includes(query))) return false;
      return true;
    });
  }, [tasks, filters.from, filters.to, filters.completion, filters.deadline, filters.search]);

  const taskStats = useMemo(() => {
    const completed = filteredTasks.filter((task) => task.status === "done").length;
    const pending = filteredTasks.filter((task) => task.status === "todo").length;
    const inProgress = filteredTasks.filter((task) => task.status === "in-progress").length;
    const overdue = filteredTasks.filter(
      (task) => task.deadline && utcDay(task.deadline) < utcDay(new Date()) && task.status !== "done",
    ).length;
    return {
      total: filteredTasks.length,
      completed,
      pending,
      inProgress,
      overdue,
      completionRate: filteredTasks.length ? Math.round((completed / filteredTasks.length) * 100) : 0,
    };
  }, [filteredTasks]);

  const displayedDepartments = useMemo(() => {
    if (filters.departmentId) {
      return (summary.departments || []).filter(
        (department) => department._id === filters.departmentId,
      );
    }
    if (!filters.memberId) return summary.departments || [];
    const member = members.find((item) => memberIdOf(item) === filters.memberId);
    const departmentIds = new Set([
      ...(member?.memberships || []).map((membership) => departmentIdOf(membership.departmentId)),
      ...(member?.departement || []).map(departmentIdOf),
      ...departments
        .filter((department) =>
          [
            department.manager,
            department.viceManager,
            ...(department.teamManagers || []),
            ...(department.members || []),
          ].some((assigned) => memberIdOf(assigned) === filters.memberId),
        )
        .map((department) => department._id),
    ]);
    return (summary.departments || []).filter((department) => departmentIds.has(department._id));
  }, [summary.departments, filters.departmentId, filters.memberId, members, departments]);

  const displayedOverview = useMemo(() => ({
    ...(summary.overview || {}),
    totalDepartments: filters.departmentId
      ? 1
      : filters.memberId
        ? displayedDepartments.length
        : summary.overview?.totalDepartments ?? 0,
    totalMembers: filters.memberId
      ? 1
      : filters.departmentId
        ? displayedDepartments[0]?.totalMembers ?? 0
        : summary.overview?.totalMembers ?? 0,
    totalTasks: taskStats.total,
    completedTasks: taskStats.completed,
    pendingTasks: taskStats.pending,
    inProgressTasks: taskStats.inProgress,
    overdueTasks: taskStats.overdue,
    completionRate: taskStats.completionRate,
  }), [summary.overview, filters.departmentId, filters.memberId, displayedDepartments, taskStats]);

  const memberRoleInDepartment = (department, memberId) => {
    if (!memberId) return "—";
    const membership = members
      .find((member) => memberIdOf(member) === memberId)
      ?.memberships?.find(
        (item) => departmentIdOf(item.departmentId) === department._id,
      );
    if (membership?.role) return membership.role;
    if (memberIdOf(department.manager) === memberId ||
      memberIdOf(department.viceManager) === memberId) return "Responsable";
    if ((department.teamManagers || []).some((item) => memberIdOf(item) === memberId)) {
      return "Team Manager";
    }
    return "Member";
  };

  const isOverdueTask = (task) => {
    if (!task.deadline || task.status === "done") return false;
    return utcDay(task.deadline) < utcDay(new Date());
  };
  const taskColumns = [
    { key: "todo", title: "To Do", color: "border-slate-300", tasks: filteredTasks.filter((task) => task.status === "todo" && !isOverdueTask(task)) },
    { key: "in-progress", title: "In Progress", color: "border-blue-400", tasks: filteredTasks.filter((task) => task.status === "in-progress" && !isOverdueTask(task)) },
    { key: "done", title: "Completed", color: "border-emerald-400", tasks: filteredTasks.filter((task) => task.status === "done") },
    { key: "overdue", title: "Overdue", color: "border-rose-400", tasks: filteredTasks.filter(isOverdueTask) },
  ];
  const memberTasksFor = (id) =>
    filteredTasks.filter((task) => memberIdOf(task.assignedTo) === id);
  const taskCountsFor = (memberTasks) => {
    const completed = memberTasks.filter((task) => task.status === "done").length;
    return {
      total: memberTasks.length,
      completed,
      pending: memberTasks.filter((task) => task.status === "todo").length,
      inProgress: memberTasks.filter((task) => task.status === "in-progress").length,
      overdue: memberTasks.filter(isOverdueTask).length,
      completionRate: memberTasks.length ? Math.round((completed / memberTasks.length) * 100) : 0,
    };
  };
  const memberPerformance = taskCountsFor(filteredTasks);
  const completedTasksWithDeadline = filteredTasks.filter(
    (task) => task.status === "done" && task.deadline && task.completedAt,
  );
  const completedBeforeDeadline = completedTasksWithDeadline.filter(
    (task) => utcDay(task.completedAt) < utcDay(task.deadline),
  ).length;
  const completedOnDeadline = completedTasksWithDeadline.filter(
    (task) => utcDay(task.completedAt) === utcDay(task.deadline),
  ).length;
  const completedLate = completedTasksWithDeadline.filter(
    (task) => utcDay(task.completedAt) > utcDay(task.deadline),
  ).length;
  const memberOnTimeRate = completedTasksWithDeadline.length
    ? Math.round(((completedBeforeDeadline + completedOnDeadline) / completedTasksWithDeadline.length) * 100)
    : 0;
  const memberRoleLabel = filters.departmentId && selectedDepartment
    ? memberRoleInDepartment(selectedDepartment, filters.memberId)
    : selectedMember?.memberships?.find((membership) => membership.departmentId)?.role ||
      selectedMember?.role?.[0] ||
      "Member";
  const overviewCards = [
    { label: "Departments", value: displayedOverview.totalDepartments ?? 0, icon: Building2, tone: "text-blue-700 bg-blue-50" },
    { label: "Members", value: displayedOverview.totalMembers ?? 0, icon: Users, tone: "text-violet-700 bg-violet-50" },
    { label: "Total tasks", value: displayedOverview.totalTasks ?? 0, icon: ListTodo, tone: "text-slate-700 bg-slate-100" },
    { label: "Completed", value: displayedOverview.completedTasks ?? 0, icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-50" },
    { label: "Pending", value: displayedOverview.pendingTasks ?? 0, icon: Clock3, tone: "text-amber-700 bg-amber-50" },
    { label: "In progress", value: displayedOverview.inProgressTasks ?? 0, icon: BarChart3, tone: "text-indigo-700 bg-indigo-50" },
    { label: "Overdue", value: displayedOverview.overdueTasks ?? 0, icon: CircleAlert, tone: "text-rose-700 bg-rose-50" },
    { label: "Completion rate", value: `${displayedOverview.completionRate ?? 0}%`, icon: CheckCircle2, tone: "text-teal-700 bg-teal-50" },
  ];
  const trendMaximum = Math.max(
    1,
    ...(summary.activityTrend || []).flatMap((point) => [
      Number(point.tasks) || 0,
      Number(point.meetings) || 0,
      Number(point.activities) || 0,
    ]),
  );

  const handleNoteSubmit = async (event) => {
    event.preventDefault();
    if (!noteForm.text.trim()) {
      toast.error("Please enter note text.");
      return;
    }
    if (!noteForm.departmentId) {
      toast.error("Please select a department.");
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
        const createdNote = await api.post("/followups", payload);
        if (!createdNote?._id) {
          throw new Error("The server did not return the saved follow-up note.");
        }
        setRecentNotes((current) => [
          createdNote,
          ...current.filter((note) => note._id !== createdNote._id),
        ]);
        toast.success("Follow-up note added.");
      }

      setNoteForm(DEFAULT_FORM);
      setEditingNoteId(null);
      setNoteDrawerOpen(false);
      setRefreshKey((key) => key + 1);
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
    setNoteDrawerOpen(true);
  };

  const startNewNote = () => {
    setEditingNoteId(null);
    setNoteForm({
      ...DEFAULT_FORM,
      noteType: filters.noteType || DEFAULT_FORM.noteType,
      departmentId: filters.departmentId,
      memberId: filters.memberId,
    });
    setNoteDrawerOpen(true);
  };

  const handleActivitySubmit = async (event) => {
    event.preventDefault();
    if (
      !activityForm.title.trim() ||
      !activityForm.description.trim() ||
      !activityForm.departmentId ||
      !activityForm.activityDate
    ) {
      toast.error("Title, description, department, and activity date are required.");
      return;
    }

    try {
      setSaving(true);
      await api.post("/activities", {
        title: { en: activityForm.title.trim(), fr: "", ar: "" },
        description: { en: activityForm.description.trim(), fr: "", ar: "" },
        activityDate: activityForm.activityDate,
        categorie: activityForm.categorie.trim(),
        departmentId: activityForm.departmentId,
        ...(activityForm.memberId ? { memberId: activityForm.memberId } : {}),
      });
      toast.success("Activity saved.");
      setActivityForm(DEFAULT_ACTIVITY_FORM);
      setActivityDrawerOpen(false);
      setRefreshKey((key) => key + 1);
    } catch (submitError) {
      toast.error(submitError.message || "Unable to save activity.");
    } finally {
      setSaving(false);
    }
  };

  const closeNoteDrawer = () => {
    if (saving) return;
    setNoteDrawerOpen(false);
    setEditingNoteId(null);
    setNoteForm(DEFAULT_FORM);
  };

  const closeActivityDrawer = () => {
    if (saving) return;
    setActivityDrawerOpen(false);
    setActivityForm(DEFAULT_ACTIVITY_FORM);
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm("Delete this follow-up note?")) return;
    try {
      await api.delete(`/followups/${noteId}`);
      toast.success("Note deleted.");
      setRefreshKey((key) => key + 1);
    } catch (deleteError) {
      toast.error(deleteError.message || "Unable to delete note.");
    }
  };

  const startNewTask = () => {
    setEditingTaskId(null);
    setTaskForm({
      ...DEFAULT_TASK_FORM,
      departmentId: filters.departmentId,
      assignedTo: filters.memberId,
      status: filters.taskStatus || "todo",
    });
    setTaskDrawerOpen(true);
  };

  const startEditTask = (task) => {
    setEditingTaskId(task._id);
    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      departmentId: departmentIdOf(task.departmentId) || "",
      assignedTo: memberIdOf(task.assignedTo) || "",
      priority: task.priority || "medium",
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 10) : "",
      status: task.status || "todo",
    });
    setTaskDrawerOpen(true);
  };

  const closeTaskDrawer = () => {
    if (taskSaving) return;
    setTaskDrawerOpen(false);
    setEditingTaskId(null);
    setTaskForm(DEFAULT_TASK_FORM);
  };

  const handleTaskSubmit = async (event) => {
    event.preventDefault();
    if (!taskForm.title.trim() || !taskForm.departmentId || !taskForm.assignedTo) {
      toast.error("Task title, department, and assigned member are required.");
      return;
    }
    try {
      setTaskSaving(true);
      const payload = {
        title: taskForm.title.trim(),
        description: taskForm.description,
        departmentId: taskForm.departmentId,
        assignedTo: taskForm.assignedTo,
        priority: taskForm.priority,
        deadline: taskForm.deadline || null,
        status: taskForm.status,
      };
      if (editingTaskId) {
        await api.patch(`/tasks/${editingTaskId}`, payload);
        toast.success("Task updated.");
      } else {
        await api.post("/tasks", payload);
        toast.success("Task created.");
      }
      setTaskDrawerOpen(false);
      setEditingTaskId(null);
      setTaskForm(DEFAULT_TASK_FORM);
      setRefreshKey((key) => key + 1);
    } catch (taskError) {
      toast.error(taskError.message || "Unable to save task.");
    } finally {
      setTaskSaving(false);
    }
  };

  const handleTaskStatusChange = async (task, status) => {
    try {
      await api.patch(`/tasks/${task._id}/status`, { status });
      toast.success(status === "done" ? "Task completed." : "Task status updated.");
      setRefreshKey((key) => key + 1);
    } catch (taskError) {
      toast.error(taskError.message || "Unable to update task status.");
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm("Delete this task? This action cannot be undone.")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success("Task deleted.");
      setRefreshKey((key) => key + 1);
    } catch (taskError) {
      toast.error(taskError.message || "Unable to delete task.");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white shadow-sm sm:p-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-200">LADS · Operations</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Follow-up dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-blue-100">
            Track department progress, member activity, tasks, and follow-up notes in one place.
          </p>
        </div>
        <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-blue-50 sm:absolute sm:right-8 sm:top-8 sm:mt-0">
          <CalendarRange size={16} />
          <span>{filters.period === "week" ? "Weekly reporting" : "Monthly reporting"}</span>
        </div>
      </header>

      <nav aria-label="Follow-up views" className="flex gap-2 overflow-x-auto rounded-2xl border border-brand-border bg-white p-2 shadow-sm">
        {[
          { key: "general", label: "General", icon: BarChart3 },
          { key: "department", label: "Department", icon: Building2 },
          { key: "member", label: "Member", icon: UserRound },
        ].map(({ key, label, icon: Icon }) => {
          const selected =
            activeView === key ||
            (key === "department" && activeView === "department") ||
            (key === "member" && activeView === "member");
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (key === "general") {
                  clearFilters();
                  return;
                }
                setViewMode(key);
                if (key === "department" && filters.memberId) {
                  setFilter("memberId", "");
                }
                if (key === "member" && filters.departmentId) {
                  setFilters((current) => ({ ...current, departmentId: "" }));
                }
              }}
              aria-current={selected ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                selected
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-brand-muted hover:bg-brand-bg hover:text-brand-text"
              }`}
            >
              <Icon size={16} /> {label}
              {key === "department" && filters.departmentId && (
                <span className="max-w-32 truncate rounded-full bg-white/15 px-2 py-0.5 text-xs">{selectedDepartment?.name}</span>
              )}
              {key === "member" && filters.memberId && (
                <span className="max-w-32 truncate rounded-full bg-white/15 px-2 py-0.5 text-xs">{selectedMember?.fullName}</span>
              )}
            </button>
          );
        })}
      </nav>

      <section className="rounded-2xl border border-brand-border bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-muted">
            <Filter size={15} /> Filters
          </div>
          <select value={filters.departmentId} onChange={(event) => setFilter("departmentId", event.target.value)} className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm">
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department._id} value={department._id}>{department.name}</option>
            ))}
          </select>
          <select value={filters.memberId} onChange={(event) => setFilter("memberId", event.target.value)} className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm" disabled={directoryLoading}>
            <option value="">All members</option>
            {availableMembers.map((member) => (
              <option key={member._id} value={member._id}>{member.fullName}</option>
            ))}
          </select>
          <select value={filters.taskStatus} onChange={(event) => setFilter("taskStatus", event.target.value)} className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm">
            <option value="">All task statuses</option>
            <option value="todo">To do</option>
            <option value="in-progress">In progress</option>
            <option value="done">Completed</option>
          </select>
          <select value={filters.noteType} onChange={(event) => setFilters((current) => ({ ...current, noteType: event.target.value }))} className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm">
            <option value="">All note types</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="action">Action</option>
          </select>
          <input value={filters.authorId} onChange={(event) => setFilter("authorId", event.target.value)} placeholder="Note author ID" className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm" />
          <label className="inline-flex items-center gap-2 text-sm text-brand-muted">
            Date
            <input
              aria-label="Filter by date"
              value={filters.from}
              onChange={(event) => setFilters((current) => ({
                ...current,
                from: event.target.value,
                to: event.target.value,
              }))}
              type="date"
              className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-text"
            />
          </label>
          <select value={filters.deadline} onChange={(event) => setFilter("deadline", event.target.value)} className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm">
            <option value="">Any deadline</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due today</option>
            <option value="next-seven-days">Due in 7 days</option>
            <option value="no-deadline">No deadline</option>
          </select>
          <select value={filters.completion} onChange={(event) => setFilter("completion", event.target.value)} className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm">
            <option value="">Any completion status</option>
            <option value="completed">Completed only</option>
            <option value="not-completed">Not completed</option>
          </select>
          <input value={filters.search} onChange={(event) => setFilter("search", event.target.value)} placeholder="Search tasks" className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm" />
          <select value={filters.period} onChange={(event) => setFilters((current) => ({ ...current, period: event.target.value }))} className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm">
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
          <button type="button" onClick={clearFilters} className="rounded-xl border border-brand-border px-3 py-2 text-sm text-brand-text">Clear filters</button>
        </div>
        {directoryError && <p role="alert" className="mt-3 text-sm text-red-700">{directoryError}</p>}
      </section>

      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-brand-border bg-white p-5 text-sm text-brand-muted"><LoaderCircle className="animate-spin" size={18} /> Loading statistics…</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8" aria-label="Main statistics">
            {overviewCards.map((stat) => (
              <article key={stat.label} className="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
                <span className={`inline-flex rounded-xl p-2 ${stat.tone}`}><stat.icon size={18} /></span>
                <p className="mt-3 text-xs font-medium text-brand-muted">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-brand-text">{stat.value}</p>
                {stat.label === "Completion rate" && (
                  <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, taskStats.completionRate)}%` }} />
                  </div>
                )}
              </article>
            ))}
          </section>

          {activeView === "department" && !filters.departmentId && (
            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-900">
              Choose a department in the filters above to open its detailed view.
            </section>
          )}

          {activeView === "member" && !filters.memberId && (
            <section className="rounded-2xl border border-violet-100 bg-violet-50 p-5 text-sm text-violet-900">
              Choose a member in the filters above to open their profile and task history.
            </section>
          )}

          {filters.memberId && (
            <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-brand-primary">{filters.departmentId ? "Department member" : "Member view"}</p>
                  <h2 className="mt-1 text-xl font-bold text-brand-text">{selectedMember?.fullName || memberSummary?.member?.fullName || "Selected member"}</h2>
                  <p className="mt-1 text-sm text-brand-muted">
                    {filters.departmentId && selectedDepartment
                      ? `${memberRoleLabel} · ${selectedDepartment.name}`
                      : `Role: ${memberRoleLabel}`}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-bg px-4 py-3 text-sm text-brand-muted">
                  <span className="block text-xs">Assigned tasks</span>
                  <strong className="mt-1 block text-2xl text-brand-text">{memberPerformance.total}</strong>
                </div>
              </div>
              {memberSummaryErrorFor === filters.memberId ? (
                <p role="alert" className="mt-3 text-sm text-red-700">{memberSummaryError}</p>
              ) : memberSummary && memberSummaryFor === filters.memberId ? (
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-10">
                  {[
                    ["Completed", memberPerformance.completed],
                    ["Pending", memberPerformance.pending],
                    ["In progress", memberPerformance.inProgress],
                    ["Overdue", memberPerformance.overdue],
                    ["Completion rate", `${memberPerformance.completionRate}%`],
                    ["Before deadline", completedBeforeDeadline],
                    ["On deadline", completedOnDeadline],
                    ["Completed late", completedLate],
                    ["On-time rate", `${memberOnTimeRate}%`],
                    ...(!filters.departmentId ? [["Meetings attended", memberSummary.meetingsAttended ?? 0]] : []),
                    ["Follow-up notes", filters.departmentId ? recentNotes.length : memberSummary.recentFollowUpCount ?? 0],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-brand-bg p-3">
                      <p className="text-xs text-brand-muted">{label}</p>
                      <p className="mt-1 text-lg font-semibold text-brand-text">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 text-sm text-brand-muted">
                  <LoaderCircle className="animate-spin" size={16} /> Loading member statistics…
                </div>
              )}
              {filters.departmentId && filters.memberId && (
                <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
                  <strong>{selectedDepartment?.name || "Selected department"}</strong>
                  {" · "}
                  Manager: {selectedDepartment?.manager?.fullName || "Not assigned"}
                  {" · "}
                  Vice manager: {selectedDepartment?.viceManager?.fullName || "Not assigned"}
                  {" · "}
                  Combined view: tasks, dates, and notes below are limited to this member in this department.
                </p>
              )}
            </section>
          )}

          {filters.memberId && !filters.departmentId && (
            <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="font-semibold text-brand-text">Department participation</h3>
                <p className="mt-1 text-sm text-brand-muted">Task progress by the member’s registered department.</p>
              </div>
              {displayedDepartments.length === 0 ? (
                <p className="rounded-xl bg-brand-bg p-4 text-sm text-brand-muted">No department memberships are available for this member.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[700px] w-full text-left text-sm">
                    <thead className="border-b border-brand-border text-xs uppercase text-brand-muted">
                      <tr>{["Department", "Role", "Tasks", "Completed", "Pending", "Overdue", "Completion"].map((heading) => <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {displayedDepartments.map((department) => {
                        const departmentSource = departments.find((item) => item._id === department._id) || department;
                        const departmentTasks = filteredTasks.filter((task) => departmentIdOf(task.departmentId) === department._id);
                        const counts = taskCountsFor(departmentTasks);
                        return (
                          <tr key={department._id} className="cursor-pointer hover:bg-brand-bg" onClick={() => setFilter("departmentId", department._id)}>
                            <td className="px-3 py-3 font-medium text-brand-text">{department.name}</td>
                            <td className="px-3 py-3 text-brand-muted">{memberRoleInDepartment(departmentSource, filters.memberId)}</td>
                            <td className="px-3 py-3">{counts.total}</td>
                            <td className="px-3 py-3 text-emerald-700">{counts.completed}</td>
                            <td className="px-3 py-3">{counts.pending}</td>
                            <td className="px-3 py-3 text-rose-700">{counts.overdue}</td>
                            <td className="px-3 py-3 font-semibold">{counts.completionRate}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeView === "member" && filters.memberId && (
            <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-brand-text">Relevant follow-up notes</h3>
                  <p className="mt-1 text-sm text-brand-muted">{filters.departmentId ? "Notes for this member in the selected department." : "Notes associated with this member."}</p>
                </div>
                {canManageFollowups && (
                  <button type="button" onClick={startNewNote} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-3 py-2 text-sm font-medium text-white"><Plus size={15} /> Add note</button>
                )}
              </div>
              {notesLoading ? (
                <p className="text-sm text-brand-muted">Loading notes…</p>
              ) : notesError ? (
                <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{notesError}</p>
              ) : recentNotes.length === 0 ? (
                <p className="rounded-xl bg-brand-bg p-3 text-sm text-brand-muted">No notes match this member and department scope.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {recentNotes.map((note) => (
                    <article key={note._id} className="rounded-xl bg-brand-bg p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="whitespace-pre-wrap text-sm text-brand-text">{note.text}</p>
                        {(isGlobalAdmin || memberIdOf(note.author) === currentUserId) && (
                          <span className="flex shrink-0 gap-2">
                            <button type="button" onClick={() => handleEdit(note)} className="text-xs font-medium text-brand-primary">Edit</button>
                            <button type="button" onClick={() => handleDelete(note._id)} className="text-xs font-medium text-rose-600">Delete</button>
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-xs text-brand-muted">{note.authorName || note.author?.fullName || "Unknown author"} · {note.authorRole || "Member"} · {note.createdAt ? new Date(note.createdAt).toLocaleString() : ""}</p>
                      <p className="mt-1 text-xs text-brand-muted">
                        {[note.departmentId?.name, note.memberId?.fullName].filter(Boolean).join(" · ")}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {filters.departmentId && activeView === "department" && selectedDepartment && (
            <section className="space-y-5">
              <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-brand-primary">Department overview</p>
                    <h2 className="mt-1 text-2xl font-bold text-brand-text">{selectedDepartment.name}</h2>
                    <p className="mt-2 text-sm text-brand-muted">
                      Manager: {selectedDepartment.manager?.fullName || "Not assigned"} · Vice manager: {selectedDepartment.viceManager?.fullName || "Not assigned"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      ["Members", displayedOverview.totalMembers],
                      ["Tasks", taskStats.total],
                      ["Completed", taskStats.completed],
                      ["Completion", `${taskStats.completionRate}%`],
                    ].map(([label, value]) => (
                      <div key={label} className="min-w-20 rounded-xl bg-brand-bg px-3 py-2 text-center">
                        <span className="block text-[11px] text-brand-muted">{label}</span>
                        <strong className="mt-1 block text-lg text-brand-text">{value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["Pending", taskStats.pending, "bg-amber-50 text-amber-800"],
                    ["In progress", taskStats.inProgress, "bg-blue-50 text-blue-800"],
                    ["Overdue", taskStats.overdue, "bg-rose-50 text-rose-800"],
                    ["Completion rate", `${taskStats.completionRate}%`, "bg-emerald-50 text-emerald-800"],
                  ].map(([label, value, tone]) => (
                    <div key={label} className={`rounded-xl p-3 ${tone}`}>
                      <span className="text-xs">{label}</span>
                      <strong className="mt-1 block text-xl">{value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-brand-text">Department members</h3>
                    <p className="mt-1 text-sm text-brand-muted">Select a member to inspect their work in this department.</p>
                  </div>
                  <Users className="text-brand-primary" size={19} />
                </div>
                {availableMembers.length === 0 ? (
                  <div className="rounded-xl bg-brand-bg p-4 text-sm text-brand-muted">No members are assigned to this department.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-[760px] w-full text-left text-sm">
                      <thead className="border-b border-brand-border text-xs uppercase text-brand-muted">
                        <tr>
                          {["Member", "Role", "Tasks", "Completed", "Pending", "Overdue", "Completion"].map((heading) => <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border">
                        {availableMembers.map((member) => {
                          const counts = taskCountsFor(memberTasksFor(memberIdOf(member)));
                          return (
                            <tr key={member._id} className="cursor-pointer hover:bg-brand-bg" onClick={() => setFilter("memberId", memberIdOf(member))}>
                              <td className="px-3 py-3 font-medium text-brand-text">{member.fullName}</td>
                              <td className="px-3 py-3 text-brand-muted">{memberRoleInDepartment(selectedDepartment, memberIdOf(member))}</td>
                              <td className="px-3 py-3">{counts.total}</td>
                              <td className="px-3 py-3 text-emerald-700">{counts.completed}</td>
                              <td className="px-3 py-3">{counts.pending}</td>
                              <td className="px-3 py-3 text-rose-700">{counts.overdue}</td>
                              <td className="px-3 py-3"><span className="font-semibold">{counts.completionRate}%</span><div className="mt-1 h-1.5 w-24 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${counts.completionRate}%` }} /></div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-brand-text">Department objectives</h3>
                  {objectivesLoading && objectivesFor !== filters.departmentId ? (
                    <p className="mt-3 flex items-center gap-2 text-sm text-brand-muted"><LoaderCircle className="animate-spin" size={16} /> Loading objectives…</p>
                  ) : objectivesError ? (
                    <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{objectivesError}</p>
                  ) : objectivesFor === filters.departmentId && objectives.length ? (
                    <div className="mt-4 space-y-3">
                      {objectives.map((objective) => (
                        <article key={objective._id} className="rounded-xl bg-brand-bg p-3">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="text-sm font-semibold text-brand-text">{objective.title}</h4>
                            <span className="text-xs font-semibold text-brand-primary">{objective.progress ?? 0}%</span>
                          </div>
                          {objective.description && <p className="mt-1 text-xs text-brand-muted">{objective.description}</p>}
                          <div className="mt-2 h-1.5 rounded-full bg-slate-200"><div className="h-full rounded-full bg-brand-primary" style={{ width: `${Math.min(100, Math.max(0, Number(objective.progress) || 0))}%` }} /></div>
                          <p className="mt-2 text-[11px] text-brand-muted">
                            {objective.weekStart ? new Date(objective.weekStart).toLocaleDateString() : "Start not set"}
                            {" – "}
                            {objective.weekEnd ? new Date(objective.weekEnd).toLocaleDateString() : "End not set"}
                          </p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 rounded-xl bg-brand-bg p-3 text-sm text-brand-muted">No objectives recorded for this department.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-brand-text">Follow-up notes</h3>
                      <p className="mt-1 text-sm text-brand-muted">Department updates and decisions.</p>
                    </div>
                    {canManageFollowups && <button type="button" onClick={startNewNote} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-3 py-2 text-sm font-medium text-white"><Plus size={15} /> Add note</button>}
                  </div>
                  {notesLoading ? (
                    <p className="mt-4 text-sm text-brand-muted">Loading notes…</p>
                  ) : notesError ? (
                    <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{notesError}</p>
                  ) : recentNotes.length === 0 ? (
                    <p className="mt-4 rounded-xl bg-brand-bg p-3 text-sm text-brand-muted">No notes recorded for this department.</p>
                  ) : (
                    <div className="mt-4 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
                      {recentNotes.map((note) => (
                        <article key={note._id} className="rounded-xl bg-brand-bg p-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="whitespace-pre-wrap text-sm text-brand-text">{note.text}</p>
                            {(isGlobalAdmin || memberIdOf(note.author) === currentUserId) && <span className="flex shrink-0 gap-2"><button type="button" onClick={() => handleEdit(note)} className="text-xs font-medium text-brand-primary">Edit</button><button type="button" onClick={() => handleDelete(note._id)} className="text-xs font-medium text-rose-600">Delete</button></span>}
                          </div>
                          <p className="mt-2 text-xs text-brand-muted">{note.authorName || note.author?.fullName || "Unknown author"} · {note.authorRole || "Member"} · {note.createdAt ? new Date(note.createdAt).toLocaleString() : ""}</p>
                          {note.memberId?.fullName && <p className="mt-1 text-xs text-brand-muted">For {note.memberId.fullName}</p>}
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {(activeView === "general" || !!filters.departmentId || !!filters.memberId) && (
          <section className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-brand-text">
                  {activeView === "department" ? "Department task board" : activeView === "member" ? "Member tasks" : "Task overview"}
                </h2>
                <p className="mt-1 text-sm text-brand-muted">
                  {taskStats.total} tasks in this view · {taskStats.completionRate}% completed
                </p>
              </div>
              {canManageTasks && (
                <button type="button" onClick={startNewTask} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-3 py-2 text-sm font-medium text-white">
                  <Plus size={16} /> Add task
                </button>
              )}
            </div>
            {tasksLoading ? (
              <div className="flex items-center gap-2 text-sm text-brand-muted">
                <LoaderCircle className="animate-spin" size={16} /> Loading tasks…
              </div>
            ) : tasksError ? (
              <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{tasksError}</div>
            ) : filteredTasks.length === 0 ? (
              <div className="rounded-xl bg-brand-bg p-4 text-sm text-brand-muted">No tasks match the selected filters.</div>
            ) : activeView === "department" ? (
              <div className="grid gap-4 xl:grid-cols-4">
                {taskColumns.map((column) => (
                  <div key={column.key} className={`min-w-0 rounded-2xl border-t-4 ${column.color} bg-slate-50 p-3`}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold text-brand-text">{column.title}</h3>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-brand-muted">{column.tasks.length}</span>
                    </div>
                    <div className="space-y-3">
                      {column.tasks.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-200 bg-white p-3 text-xs text-brand-muted">No tasks in this column.</p>
                      ) : column.tasks.map((task) => (
                        <article key={task._id} className="rounded-xl border border-brand-border bg-white p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-brand-text">{task.title}</h4>
                            <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                              task.priority === "high" ? "bg-rose-50 text-rose-700" : task.priority === "low" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700"
                            }`}>{task.priority || "medium"}</span>
                          </div>
                          {task.description && <p className="mt-2 line-clamp-3 text-xs text-brand-muted">{task.description}</p>}
                          <p className="mt-3 text-xs text-brand-muted">{task.assignedTo?.fullName || "Unassigned"}</p>
                          <p className={`mt-1 text-xs ${isOverdueTask(task) ? "font-semibold text-rose-700" : "text-brand-muted"}`}>
                            {task.deadline ? `Due ${new Date(task.deadline).toLocaleDateString()}` : "No deadline"}
                          </p>
                          {task.status === "done" && task.completedAt && <p className="mt-1 text-xs text-emerald-700">Completed {new Date(task.completedAt).toLocaleDateString()}</p>}
                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                            <select
                              aria-label={`Status for ${task.title}`}
                              value={task.status}
                              onChange={(event) => handleTaskStatusChange(task, event.target.value)}
                              className="max-w-32 rounded-lg border border-brand-border bg-white px-2 py-1.5 text-xs"
                            >
                              <option value="todo">To do</option>
                              <option value="in-progress">In progress</option>
                              <option value="done">Completed</option>
                            </select>
                            {canManageTasks && <span className="flex gap-1">
                              <button type="button" onClick={() => startEditTask(task)} aria-label={`Edit ${task.title}`} className="rounded-md p-1.5 text-brand-primary hover:bg-blue-50"><Pencil size={14} /></button>
                              <button type="button" onClick={() => handleTaskDelete(task._id)} aria-label={`Delete ${task.title}`} className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 size={14} /></button>
                            </span>}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <article key={task._id} className="flex flex-col gap-3 rounded-xl bg-brand-bg p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-medium text-brand-text">{task.title}</h3>
                      {task.description && <p className="mt-1 text-sm text-brand-muted">{task.description}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-brand-muted">
                        <span>{task.departmentId?.name || "Department unavailable"}</span>
                        <span aria-hidden="true">·</span>
                        <span>{task.assignedTo?.fullName || "Unassigned"}</span>
                        <span className={`rounded-full px-2 py-1 font-semibold ${
                          task.status === "done" ? "bg-emerald-50 text-emerald-700" :
                            task.status === "in-progress" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-700"
                        }`}>{task.status === "done" ? "Completed" : task.status === "in-progress" ? "In progress" : "To do"}</span>
                        <span className={`rounded-full px-2 py-1 font-semibold ${
                          task.priority === "high" ? "bg-rose-50 text-rose-700" :
                            task.priority === "low" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700"
                        }`}>{task.priority || "medium"}</span>
                        <span className={isOverdueTask(task) ? "font-semibold text-rose-700" : ""}>
                          {task.deadline ? `Due ${new Date(task.deadline).toLocaleDateString()}` : "No deadline"}
                        </span>
                      </div>
                      {task.status === "done" && task.completedAt && (
                        <p className="mt-1 text-xs text-emerald-700">
                          Completed {new Date(task.completedAt).toLocaleDateString()}
                          {task.deadline && ` · ${new Date(task.completedAt) <= new Date(task.deadline) ? "On time" : "Late"}`}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <select
                        aria-label={`Status for ${task.title}`}
                        value={task.status}
                        onChange={(event) => handleTaskStatusChange(task, event.target.value)}
                        className="rounded-lg border border-brand-border bg-white px-2 py-2 text-sm"
                      >
                        <option value="todo">To do</option>
                        <option value="in-progress">In progress</option>
                        <option value="done">Completed</option>
                      </select>
                      {canManageTasks && (
                        <>
                          <button type="button" onClick={() => startEditTask(task)} aria-label={`Edit ${task.title}`} className="rounded-lg border border-brand-border bg-white p-2 text-brand-primary">
                            <Pencil size={15} />
                          </button>
                          <button type="button" onClick={() => handleTaskDelete(task._id)} aria-label={`Delete ${task.title}`} className="rounded-lg border border-red-200 bg-white p-2 text-red-600">
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          )}

          {activeView === "general" && <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
            <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-brand-text">Activity trend</h2>
                  <p className="mt-1 text-sm text-brand-muted">Task, meeting, and activity volume</p>
                </div>
                <BarChart3 className="text-brand-primary" size={20} />
              </div>
              <div className="max-h-72 space-y-3 overflow-y-auto">
                {(summary.activityTrend || []).length === 0 ? (
                  <p className="rounded-xl bg-brand-bg p-4 text-sm text-brand-muted">No activity recorded in this period.</p>
                ) : (summary.activityTrend || []).map((point) => (
                  <div key={point.label} className="rounded-xl bg-brand-bg p-3">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-brand-text">{point.label}</span>
                      <span className="text-brand-muted">{(Number(point.tasks) || 0) + (Number(point.meetings) || 0) + (Number(point.activities) || 0)} events</span>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        ["Tasks", Number(point.tasks) || 0, "bg-blue-600"],
                        ["Meetings", Number(point.meetings) || 0, "bg-amber-500"],
                        ["Activities", Number(point.activities) || 0, "bg-emerald-500"],
                      ].map(([label, count, color]) => (
                        <div key={label} className="flex items-center gap-2 text-[10px] text-brand-muted">
                          <span className="w-16 shrink-0">{label}</span>
                          <div className="h-1.5 flex-1 rounded-full bg-white"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, (count / trendMaximum) * 100)}%` }} /></div>
                          <span className="w-5 text-right tabular-nums">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-brand-text">Recent activity</h2>
                  <p className="mt-1 text-sm text-brand-muted">Latest updates</p>
                </div>
                <div className="flex items-center gap-3">
                  {canCreateActivity && (
                    <button type="button" onClick={() => setActivityDrawerOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-3 py-2 text-sm font-medium text-white">
                      <Plus size={16} /> Add Activity
                    </button>
                  )}
                  <ClipboardList className="text-brand-primary" size={18} />
                </div>
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
          </section>}

          {activeView === "general" && <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.3fr_1fr]">
            <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-brand-text">Department overview</h2>
                  <p className="mt-1 text-sm text-brand-muted">Select a department to open its task board and member detail.</p>
                </div>
                <Users className="text-brand-primary" size={18} />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-brand-border text-left text-sm">
                  <thead>
                    <tr className="text-brand-muted">
                      <th className="px-2 py-2 font-medium">Department</th>
                      <th className="px-2 py-2 font-medium">Manager</th>
                      <th className="px-2 py-2 font-medium">Members</th>
                      <th className="px-2 py-2 font-medium">Tasks</th>
                      <th className="px-2 py-2 font-medium">Completed</th>
                      <th className="px-2 py-2 font-medium">Pending</th>
                      <th className="px-2 py-2 font-medium">Overdue</th>
                      <th className="px-2 py-2 font-medium">Completion</th>
                      <th className="px-2 py-2 font-medium">Last follow-up</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {displayedDepartments.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-2 py-6 text-center text-brand-muted">No departments match the current filters.</td>
                      </tr>
                    ) : (
                      displayedDepartments.map((department) => {
                        const departmentTasks = filteredTasks.filter(
                          (task) => departmentIdOf(task.departmentId) === department._id,
                        );
                        const departmentSource = departments.find((item) => item._id === department._id);
                        const managerName = departmentSource?.manager?.fullName || "Not assigned";
                        return (
                          <tr key={department._id} className="cursor-pointer hover:bg-brand-bg" onClick={() => setFilter("departmentId", department._id)}>
                            <td className="px-2 py-3 font-medium text-brand-text">{department.name}<ArrowRight size={13} className="ml-1 inline text-brand-primary" /></td>
                            <td className="px-2 py-3">{managerName}</td>
                            <td className="px-2 py-3">{department.totalMembers ?? 0}</td>
                            <td className="px-2 py-3">{departmentTasks.length}</td>
                            <td className="px-2 py-3">{departmentTasks.filter((task) => task.status === "done").length}</td>
                            <td className="px-2 py-3">{departmentTasks.filter((task) => task.status === "todo").length}</td>
                            <td className="px-2 py-3 text-rose-700">{departmentTasks.filter(isOverdueTask).length}</td>
                            <td className="px-2 py-3">{departmentTasks.length ? Math.round((departmentTasks.filter((task) => task.status === "done").length / departmentTasks.length) * 100) : 0}%</td>
                            <td className="px-2 py-3 text-brand-muted">{department.latestFollowUpDate ? new Date(department.latestFollowUpDate).toLocaleDateString() : "—"}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-brand-text">Follow-up notes</h2>
                  <p className="mt-1 text-sm text-brand-muted">Recent team updates</p>
                </div>
                <div className="flex items-center gap-3">
                  {canManageFollowups && (
                    <button type="button" onClick={startNewNote} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-3 py-2 text-sm font-medium text-white">
                      <Plus size={16} /> Add Note
                    </button>
                  )}
                  <FileText className="text-brand-primary" size={18} />
                </div>
              </div>
              {notesLoading ? (
                <div className="text-sm text-brand-muted">Loading notes…</div>
              ) : notesError ? (
                <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{notesError}</div>
              ) : recentNotes.length === 0 ? (
                <div className="rounded-xl bg-brand-bg p-4 text-sm text-brand-muted">No notes recorded for this scope.</div>
              ) : (
                <div className="space-y-3">
                  {recentNotes.slice(0, 4).map((note) => (
                    <div key={note._id} className="rounded-xl bg-brand-bg p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-brand-primary">{note.noteType || "info"}</span>
                        {(isGlobalAdmin || memberIdOf(note.author) === currentUserId) && (
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => handleEdit(note)} className="text-xs text-brand-primary">Edit</button>
                            <button type="button" onClick={() => handleDelete(note._id)} className="text-xs text-red-600">Delete</button>
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-brand-text">{note.text}</p>
                      <p className="mt-2 text-[11px] text-brand-muted">
                        {note.authorName || note.author?.fullName || "Unknown author"} · {note.authorRole || note.author?.role?.[0] || "Member"} · {new Date(note.createdAt).toLocaleString()}
                      </p>
                      {(note.departmentId?.name || note.memberId?.fullName) && (
                        <p className="mt-1 text-[11px] text-brand-muted">
                          {[note.departmentId?.name, note.memberId?.fullName].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>}

          {activeView === "general" && <section className="grid grid-cols-1 gap-5">
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
                  <span className="text-sm text-brand-muted">Total tasks</span>
                  <span className="font-semibold text-brand-text">{displayedOverview.totalTasks ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-brand-bg p-3">
                  <span className="text-sm text-brand-muted">Completed tasks</span>
                  <span className="font-semibold text-brand-text">{displayedOverview.completedTasks ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-brand-bg p-3">
                  <span className="text-sm text-brand-muted">Pending tasks</span>
                  <span className="font-semibold text-brand-text">{displayedOverview.pendingTasks ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-brand-bg p-3">
                  <span className="text-sm text-brand-muted">In-progress tasks</span>
                  <span className="font-semibold text-brand-text">{displayedOverview.inProgressTasks ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-brand-bg p-3">
                  <span className="text-sm text-brand-muted">Overdue tasks</span>
                  <span className="font-semibold text-brand-text">{displayedOverview.overdueTasks ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-brand-bg p-3">
                  <span className="text-sm text-brand-muted">Completion rate</span>
                  <span className="font-semibold text-brand-text">{displayedOverview.completionRate ?? 0}%</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-brand-bg p-3">
                  <span className="text-sm text-brand-muted">Meetings held</span>
                  <span className="font-semibold text-brand-text">{summary.overview?.meetingsHeld ?? 0}</span>
                </div>
              </div>
            </div>
          </section>}
        </>
      )}

      <Drawer
        open={taskDrawerOpen}
        onClose={closeTaskDrawer}
        title={editingTaskId ? "Edit task" : "Add task"}
        subtitle="Assign a task to a department member and set its deadline."
      >
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <label className="block space-y-1 text-sm font-medium text-brand-text">
            Title
            <input required value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 font-normal" />
          </label>
          <label className="block space-y-1 text-sm font-medium text-brand-text">
            Description
            <textarea rows={3} value={taskForm.description} onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-xl border border-brand-border bg-white p-3 font-normal" />
          </label>
          <label className="block space-y-1 text-sm font-medium text-brand-text">
            Department
            <select required value={taskForm.departmentId} onChange={(event) => setTaskForm((current) => ({ ...current, departmentId: event.target.value, assignedTo: "" }))} className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 font-normal">
              <option value="">Select department</option>
              {departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}
            </select>
          </label>
          <label className="block space-y-1 text-sm font-medium text-brand-text">
            Assigned member
            <select required value={taskForm.assignedTo} onChange={(event) => setTaskForm((current) => ({ ...current, assignedTo: event.target.value }))} className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 font-normal">
              <option value="">Select member</option>
              {membersForDepartment(taskForm.departmentId).map((member) => <option key={member._id} value={member._id}>{member.fullName}</option>)}
              {taskForm.assignedTo && !membersForDepartment(taskForm.departmentId).some((member) => memberIdOf(member) === taskForm.assignedTo) && (
                <option value={taskForm.assignedTo}>{members.find((member) => memberIdOf(member) === taskForm.assignedTo)?.fullName || "Current assignee"}</option>
              )}
            </select>
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block space-y-1 text-sm font-medium text-brand-text">
              Priority
              <select value={taskForm.priority} onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value }))} className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 font-normal">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="block space-y-1 text-sm font-medium text-brand-text">
              Status
              <select value={taskForm.status} onChange={(event) => setTaskForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 font-normal">
                <option value="todo">To do</option>
                <option value="in-progress">In progress</option>
                <option value="done">Completed</option>
              </select>
            </label>
            <label className="block space-y-1 text-sm font-medium text-brand-text">
              Deadline
              <input type="date" value={taskForm.deadline} onChange={(event) => setTaskForm((current) => ({ ...current, deadline: event.target.value }))} className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 font-normal" />
            </label>
          </div>
          <div className="flex justify-end gap-3 border-t border-brand-border pt-4">
            <button type="button" onClick={closeTaskDrawer} disabled={taskSaving} className="rounded-xl border border-brand-border px-4 py-2 text-sm text-brand-text">Cancel</button>
            <button type="submit" disabled={taskSaving} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {taskSaving && <LoaderCircle className="animate-spin" size={16} />}
              {taskSaving ? "Saving…" : editingTaskId ? "Update task" : "Create task"}
            </button>
          </div>
        </form>
      </Drawer>

      <Drawer
        open={activityDrawerOpen}
        onClose={closeActivityDrawer}
        title="Add Activity"
        subtitle="Record an update for a department."
      >
        <form onSubmit={handleActivitySubmit} className="space-y-4">
          <label className="block space-y-1 text-sm font-medium text-brand-text">
            Activity title
            <input required value={activityForm.title} onChange={(event) => setActivityForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 font-normal" />
          </label>
          <label className="block space-y-1 text-sm font-medium text-brand-text">
            Description
            <textarea required rows={4} value={activityForm.description} onChange={(event) => setActivityForm((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-xl border border-brand-border bg-white p-3 font-normal" />
          </label>
          <label className="block space-y-1 text-sm font-medium text-brand-text">
            Department
            <select required value={activityForm.departmentId} onChange={(event) => setActivityForm((current) => ({ ...current, departmentId: event.target.value, memberId: "" }))} className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 font-normal">
              <option value="">Select department</option>
              {departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}
            </select>
          </label>
          <label className="block space-y-1 text-sm font-medium text-brand-text">
            Related team member (optional)
            <select value={activityForm.memberId} onChange={(event) => setActivityForm((current) => ({ ...current, memberId: event.target.value }))} className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 font-normal">
              <option value="">No specific member</option>
              {membersForDepartment(activityForm.departmentId).map((member) => <option key={member._id} value={member._id}>{member.fullName}</option>)}
            </select>
          </label>
          <label className="block space-y-1 text-sm font-medium text-brand-text">
            Activity date
            <input required type="date" value={activityForm.activityDate} onChange={(event) => setActivityForm((current) => ({ ...current, activityDate: event.target.value }))} className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 font-normal" />
          </label>
          <label className="block space-y-1 text-sm font-medium text-brand-text">
            Category (optional)
            <input value={activityForm.categorie} onChange={(event) => setActivityForm((current) => ({ ...current, categorie: event.target.value }))} className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 font-normal" />
          </label>
          <div className="flex justify-end gap-3 border-t border-brand-border pt-4">
            <button type="button" onClick={closeActivityDrawer} disabled={saving} className="rounded-xl border border-brand-border px-4 py-2 text-sm text-brand-text">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {saving && <LoaderCircle className="animate-spin" size={16} />}
              {saving ? "Saving…" : "Save Activity"}
            </button>
          </div>
        </form>
      </Drawer>

      <Drawer
        open={noteDrawerOpen}
        onClose={closeNoteDrawer}
        title={editingNoteId ? "Edit follow-up note" : "Add Note"}
        subtitle="Create a note for a department or team member."
      >
        <form onSubmit={handleNoteSubmit} className="space-y-4">
          <label className="block space-y-1 text-sm font-medium text-brand-text">
            Note
            <textarea required value={noteForm.text} onChange={(event) => setNoteForm((current) => ({ ...current, text: event.target.value }))} rows={6} className="w-full rounded-xl border border-brand-border bg-white p-3 font-normal" placeholder="Write the follow-up note…" />
          </label>
          <label className="block space-y-1 text-sm font-medium text-brand-text">
            Department
            <select required value={noteForm.departmentId} onChange={(event) => setNoteForm((current) => ({ ...current, departmentId: event.target.value, memberId: "" }))} className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 font-normal">
              <option value="">Select department</option>
              {departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}
            </select>
          </label>
          <label className="block space-y-1 text-sm font-medium text-brand-text">
            Related member (optional)
            <select value={noteForm.memberId} onChange={(event) => setNoteForm((current) => ({ ...current, memberId: event.target.value }))} className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 font-normal">
              <option value="">No specific member</option>
              {membersForDepartment(noteForm.departmentId).map((member) => <option key={member._id} value={member._id}>{member.fullName}</option>)}
            </select>
          </label>
          <label className="block space-y-1 text-sm font-medium text-brand-text">
            Note type
            <select value={noteForm.noteType} onChange={(event) => setNoteForm((current) => ({ ...current, noteType: event.target.value }))} className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 font-normal">
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="action">Action</option>
            </select>
          </label>
          <div className="flex justify-end gap-3 border-t border-brand-border pt-4">
            <button type="button" onClick={closeNoteDrawer} disabled={saving} className="rounded-xl border border-brand-border px-4 py-2 text-sm text-brand-text">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {saving && <LoaderCircle className="animate-spin" size={16} />}
              {saving ? "Saving…" : editingNoteId ? "Update Note" : "Save Note"}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
