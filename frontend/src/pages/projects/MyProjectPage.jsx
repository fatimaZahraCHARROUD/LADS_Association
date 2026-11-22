import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getCurrentUserId } from "../../services/api";
import {
  getMyProjects, getCells, getProjectTasks,
  createCell, updateCell, deleteCell,
  createTask, updateTask, updateTaskStatus, deleteTask,
} from "../../services/projectWorkApi";
import { idOf } from "./projectUi";
import MemberProjects from "./MemberProjects";
import ResponsableProjects from "./ResponsableProjects";

export default function MyProjectPage() {
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const uid = getCurrentUserId();

  const load = useCallback(async () => {
    try {
      const list = await getMyProjects();
      
      // 1. Dédupliquer les projets par _id
      const uniqueProjectsMap = new Map();
      (list || []).forEach((p) => {
        const pid = idOf(p);
        if (pid) uniqueProjectsMap.set(pid, p);
      });

      const details = await Promise.all(
        Array.from(uniqueProjectsMap.values()).map(async (p) => {
          const pid = idOf(p);
          const [cells, tasks] = await Promise.all([
            getCells(pid).catch((err) => {
              console.error("Error loading cells for project", pid, err);
              return [];
            }), 
            getProjectTasks(pid).catch((err) => {
              console.error("Error loading tasks for project", pid, err);
              return [];
            })
          ]);

          // 2. Dédupliquer les cellules par _id
          const uniqueCellsMap = new Map();
          (cells || []).forEach((c) => {
            const cid = idOf(c);
            if (cid) uniqueCellsMap.set(cid, c);
          });

          // 3. Dédupliquer les tâches par _id
          const uniqueTasksMap = new Map();
          (tasks || []).forEach((t) => {
            const tid = idOf(t);
            if (tid) uniqueTasksMap.set(tid, t);
          });

          return {
            ...p,
            _cells: Array.from(uniqueCellsMap.values()),
            _tasks: Array.from(uniqueTasksMap.values()),
          };
        })
      );

      setRaw(details);
    } catch (e) {
      toast.error(e.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (fn, okMsg) => {
    try {
      await fn();
      await load();
      if (okMsg) toast.success(okMsg);
      return true;
    } catch (e) {
      toast.error(e.message || "Erreur");
      return false;
    }
  };

  const handlers = {
    onAddCellule: (pid, d) => act(() => createCell(pid, d), "Cellule ajoutée"),
    onUpdateCellule: (id, d) => act(() => updateCell(id, d), "Cellule mise à jour"),
    onDeleteCellule: (id) =>
      window.confirm("Supprimer cette cellule et toutes ses tâches ?")
        ? act(() => deleteCell(id), "Cellule supprimée")
        : false,
    onAddTask: (cid, d) =>
      act(
        () =>
          createTask(cid, {
            title: d.title,
            description: d.description,
            assignedTo: d.assignee,
            ...(d.dueDate ? { dueDate: d.dueDate } : {}),
          }),
        "Tâche ajoutée"
      ),
    onUpdateTask: (id, d) => act(() => updateTask(id, d), "Tâche mise à jour"),
    onDeleteTask: (id) =>
      window.confirm("Supprimer cette tâche ?") ? act(() => deleteTask(id), "Tâche supprimée") : false,
    onStatusChange: (id, status) => act(() => updateTaskStatus(id, status)),
  };

  const managerProjects = raw
    .filter((p) => p.myRole === "manager")
    .map((p) => {
      const pid = idOf(p);
      return {
        _id: pid,
        name: p.title,
        description: p.description,
        managers: p.managerIds || [],
        members: p.memberIds || [],
        cellules: (p._cells || []).map((c) => {
          const cid = idOf(c);
          return {
            _id: cid,
            name: c.name,
            description: c.description,
            members: c.members || [],
            tasks: (p._tasks || [])
              .filter((t) => idOf(t.cell) === cid)
              .map((t) => ({ ...t, assignee: t.assignedTo })),
          };
        }),
      };
    });

  const memberProjects = raw
    .filter((p) => p.myRole !== "manager")
    .map((p) => {
      const pid = idOf(p);
      return {
        _id: pid,
        name: p.title,
        description: p.description,
        cellules: (p._cells || [])
          .filter((c) => (c.members || []).some((m) => idOf(m) === uid))
          .map((c) => {
            const cid = idOf(c);
            return {
              _id: cid,
              name: c.name,
              tasks: (p._tasks || []).filter((t) => idOf(t.cell) === cid),
            };
          }),
      };
    });

  if (loading) return <MemberProjects loading projects={[]} />;

  if (managerProjects.length === 0 && memberProjects.length === 0) {
    return <MemberProjects projects={[]} />;
  }

  return (
    <div className="space-y-12">
      {managerProjects.length > 0 && <ResponsableProjects projects={managerProjects} {...handlers} />}
      {memberProjects.length > 0 && (
        <MemberProjects
          projects={memberProjects}
          onStatusChange={handlers.onStatusChange}
          showHeader={managerProjects.length === 0}
        />
      )}
    </div>
  );
}
