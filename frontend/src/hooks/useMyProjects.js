import { useEffect, useState, useCallback } from "react";
import { getMyProjects } from "../services/projectWorkApi";

export default function useMyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setProjects([]);
      setLoading(false);
      return;
    }
    getMyProjects()
      .then((data) => {
        setProjects(Array.isArray(data) ? data : []);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProjects();

    const handleStorage = () => fetchProjects();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("project-work-updated", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("project-work-updated", handleStorage);
    };
  }, [fetchProjects]);

  return {
    projects,
    loading,
    hasProject: projects.length > 0,
    refresh: fetchProjects,
  };
}
