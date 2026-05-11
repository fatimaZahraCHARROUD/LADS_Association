import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Search, Inbox } from "lucide-react";

const PAGE_SIZE = 10;

export default function DataTable({
  columns,
  rows,
  loading = false,
  searchable = true,
  searchPlaceholder = "Search...",
  searchFn,
  emptyMessage = "No records yet.",
  rowKey = "_id",
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.trim().toLowerCase();
    if (searchFn) return rows.filter((r) => searchFn(r, q));
    return rows.filter((r) =>
      JSON.stringify(r).toLowerCase().includes(q)
    );
  }, [rows, query, searchFn]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden">
      {searchable && (
        <div className="px-4 py-3 border-b border-brand-border bg-gray-50/60 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            />
          </div>
          <span className="text-xs text-brand-muted ml-auto">
            Showing {pageRows.length} of {filtered.length}
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-brand-muted">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-3 text-left font-medium uppercase text-xs tracking-wide ${c.thClassName || ""}`}
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-brand-muted">
                  Loading...
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-brand-muted">
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
                        className={`px-4 py-3 text-brand-text align-middle ${c.tdClassName || ""}`}
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border text-sm">
          <span className="text-brand-muted">
            Page {safePage} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded-md text-brand-text hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-md text-brand-text hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
