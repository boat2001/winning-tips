"use client";
import { useRouter } from "next/navigation";
import { SPORTS, tipFilterHref, type TipFilters } from "@/lib/domain/tip-filters";
export function SportFilter({ filters }: { filters: TipFilters }) {
  const router = useRouter();
  return <label className="shrink-0">
    <span className="sr-only">Filter by sport</span>
    <select aria-label="Filter by sport" value={filters.sport ?? ""} onChange={e => {
      const sport = SPORTS.find(s => s.value === e.target.value)?.value ?? null;
      router.push(tipFilterHref(filters, { sport }));
    }} className="min-h-11 rounded-control border border-blue-400/60 bg-navy-800 px-4 text-sm font-semibold text-white">
      <option value="">All Sports</option>{SPORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
    </select>
  </label>;
}
