const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

export const uploadImage = async (file) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const json = await res.json().catch(() => null);

  if (json && "success" in json) {
    if (!json.success) throw new Error(json.error || "Image upload failed");
    return json.content;
  }

  if (!res.ok) throw new Error("Image upload failed");
  return json;
};