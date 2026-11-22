import { api } from "./api";

const B = "/project-work";

export const getMyProjects = () => api.get(`${B}/my-projects`);
export const getMyTasks = () => api.get(`${B}/my-tasks`);

export const getCells = (pid) => api.get(`${B}/projects/${pid}/cells`);
export const createCell = (pid, d) => api.post(`${B}/projects/${pid}/cells`, d);
export const updateCell = (id, d) => api.patch(`${B}/cells/${id}`, d);
export const deleteCell = (id) => api.delete(`${B}/cells/${id}`);

export const getProjectTasks = (pid) => api.get(`${B}/projects/${pid}/tasks`);
export const createTask = (cid, d) => api.post(`${B}/cells/${cid}/tasks`, d);
export const updateTask = (id, d) => api.patch(`${B}/tasks/${id}`, d);
export const updateTaskStatus = (id, status) =>
  api.patch(`${B}/tasks/${id}/status`, { status });
export const deleteTask = (id) => api.delete(`${B}/tasks/${id}`);

export const STATUS_LABELS = {
  todo: "À faire",
  in_progress: "En cours",
  completed: "Terminée",
};

export const displayName = (u) =>
  u?.fullName || u?.name ||
  [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.email || "—";

// dates : l'échéance est stockée à minuit UTC, on reste en UTC pour éviter un décalage d'un jour
export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { timeZone: "UTC" }) : "";

export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export const isOverdue = (task) =>
  !!task.dueDate &&
  task.status !== "completed" &&
  new Date(task.dueDate).toISOString().slice(0, 10) < new Date().toISOString().slice(0, 10);