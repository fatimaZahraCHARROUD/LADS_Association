import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, ChevronsUpDown, Inbox,
} from "lucide-react";
import { useTopSearch } from "../../contexts/TopSearchContext";

const PAGE_SIZE = 10;

function buildPager(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const range = [1];
  if (current > 3) range.push("…");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    range.push(i);
  }
  if (current < total - 2) range.push("…");
  range.push(total);
  return range;
}

function pad(n, total) {
  return total <= 99 ? String(n).padStart(2, "0") : String(n);
}

export default function DataTable({
  columns,
  rows,
  loading = false,
  searchFn,
  emptyMessage = "No records yet.",
  rowKey = "_id",
}) {
  const { query: topQuery } = useTopSearch();
  const [page, setPage] = useState(1);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [topQuery]);

  const filtered = useMemo(() => {
    const q = (topQuery || "").trim().toLowerCase();
    if (!q) return rows;
    if (searchFn) return rows.filter((r) => searchFn(r, q));
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [rows, topQuery, searchFn]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pager = buildPager(safePage, totalPages);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brand-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-brand-muted">
              {columns.map((c) => {
                const showSort = !!c.header && c.sortable !== false;
                return (
                  <th
                    key={c.key}
                    className={`px-6 py-5 text-left font-semibold text-xs uppercase tracking-wide ${c.thClassName || ""}`}
                    style={c.width ? { width: c.width } : undefined}
                  >
                    {showSort ? (
                      <span className="inline-flex items-center gap-1.5">
                        {c.header}
                        <ChevronsUpDown size={12} className="opacity-50" />
                      </span>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-14 text-center text-brand-muted">
                  Loading...
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center text-brand-muted">
                  <div className="flex flex-col items-center gap-2">
                    <Inbox size={28} className="text-gray-300" />
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              <AnimatePresence initial={false}>
                {pageRows.map((row) => (
                  <motion.tr
                    key={row[rowKey]}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="hover:bg-brand-bg/60 transition-colors"
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`px-6 py-5 text-brand-text align-middle ${c.tdClassName || ""}`}
                      >
                        {c.render ? c.render(row) : row[c.key] ?? "—"}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-5 border-t border-brand-border text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="flex items-center gap-1 text-brand-muted hover:text-brand-text disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <div className="flex items-center gap-1">
            {pager.map((p, i) =>
              p === "…" ? (
                <span key={`gap-${i}`} className="px-2 text-brand-muted">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`min-w-[34px] h-9 px-2 rounded-lg text-xs font-medium transition-colors ${
                    p === safePage
                      ? "bg-brand-primary text-white shadow-sm"
                      : "text-brand-muted hover:bg-gray-100"
                  }`}
                >
                  {pad(p, totalPages)}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="flex items-center gap-1 text-brand-muted hover:text-brand-text disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
