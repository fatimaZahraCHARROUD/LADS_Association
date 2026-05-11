import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
  loading = false,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  const confirmClass =
    tone === "danger"
      ? "bg-brand-danger hover:bg-red-600 text-white"
      : "bg-brand-primary hover:bg-brand-primary-hover text-white";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={onCancel}
          />
          <motion.div
            className="relative w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden"
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 5 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
          >
            <button
              onClick={onCancel}
              className="absolute top-3 right-3 p-1 rounded-md text-brand-muted hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${
                    tone === "danger"
                      ? "bg-red-100 text-brand-danger"
                      : "bg-blue-100 text-brand-primary"
                  }`}
                >
                  <AlertTriangle size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-brand-text">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm text-brand-muted">{message}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50 border-t border-brand-border">
              <button
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-brand-text bg-white border border-brand-border hover:bg-gray-100 disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${confirmClass} disabled:opacity-50`}
              >
                {loading ? "Working..." : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
