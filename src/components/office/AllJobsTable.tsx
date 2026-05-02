import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Installation } from "@/lib/types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDateTime } from "@/lib/format";

interface AllJobsTableProps {
  installations: Installation[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

type SortKey = "id" | "electrician" | "createdAt" | "meterNumber" | "status";

const PAGE_SIZE = 6;

export function AllJobsTable({ installations, selectedId, onSelect }: AllJobsTableProps) {
  const [electrician, setElectrician] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "createdAt",
    dir: "desc",
  });
  const [page, setPage] = useState(1);

  const electricians = useMemo(
    () => [...new Set(installations.map((i) => i.electrician))].sort(),
    [installations]
  );

  const filtered = useMemo(() => {
    return installations.filter((i) => {
      if (electrician && i.electrician !== electrician) return false;
      const t = new Date(i.createdAt).getTime();
      if (from && t < new Date(from).getTime()) return false;
      if (to && t > new Date(to).getTime() + 24 * 60 * 60 * 1000) return false;
      return true;
    });
  }, [installations, electrician, from, to]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sort.key] as string;
      const bv = b[sort.key] as string;
      const cmp = av.localeCompare(bv);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-office px-5 py-4">
        <h2 className="text-base font-bold text-office-fg">Alle Aufträge</h2>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-office px-5 py-3">
        <select
          value={electrician}
          onChange={(e) => { setElectrician(e.target.value); setPage(1); }}
          className="min-h-[34px] rounded-md border border-office bg-office-elevated px-2 text-xs text-office-fg"
        >
          <option value="">Alle Elektriker</option>
          {electricians.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(1); }}
          className="min-h-[34px] rounded-md border border-office bg-office-elevated px-2 text-xs text-office-fg"
        />
        <span className="text-xs text-office-muted">bis</span>
        <input
          type="date"
          value={to}
          onChange={(e) => { setTo(e.target.value); setPage(1); }}
          className="min-h-[34px] rounded-md border border-office bg-office-elevated px-2 text-xs text-office-fg"
        />
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-office-panel text-[11px] uppercase tracking-wider text-office-muted">
            <tr>
              <Th label="Job-ID" sortKey="id" sort={sort} onSort={toggleSort} />
              <Th label="Elektriker" sortKey="electrician" sort={sort} onSort={toggleSort} />
              <Th label="Datum" sortKey="createdAt" sort={sort} onSort={toggleSort} />
              <Th label="Zählernummer" sortKey="meterNumber" sort={sort} onSort={toggleSort} />
              <Th label="Status" sortKey="status" sort={sort} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {pageItems.map((i) => (
              <tr
                key={i.id}
                onClick={() => onSelect(i.id)}
                className={[
                  "cursor-pointer border-b border-office transition-colors",
                  selectedId === i.id
                    ? "bg-office-elevated"
                    : "hover:bg-office-elevated/60",
                ].join(" ")}
              >
                <td className="px-4 py-3 font-mono text-xs text-office-fg">{i.id}</td>
                <td className="px-4 py-3 text-office-fg">{i.electrician}</td>
                <td className="px-4 py-3 text-office-muted">{formatDateTime(i.createdAt)}</td>
                <td className="px-4 py-3 font-mono text-xs text-office-muted">{i.meterNumber}</td>
                <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-office-muted">
                  Keine Treffer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-office px-5 py-3 text-xs text-office-muted">
        <span>{sorted.length} Aufträge</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border border-office px-2 py-1 hover:text-office-fg disabled:opacity-40"
          >
            Zurück
          </button>
          <span>Seite {page} / {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md border border-office px-2 py-1 hover:text-office-fg disabled:opacity-40"
          >
            Weiter
          </button>
        </div>
      </div>
    </div>
  );
}

function Th({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (k: SortKey) => void;
}) {
  const active = sort.key === sortKey;
  const Icon = active ? (sort.dir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <th className="px-4 py-2 text-left font-semibold">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-office-fg"
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </th>
  );
}
