import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings2, Loader2, Maximize2, Eye, MapPin, Star, StarOff, Mail, X, Minus } from "lucide-react";
import {
  Download,
  Filter,
  Plus,
  Search,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  UserX,
  Phone,
  Copy,
  User,
  MoreVertical,
  List,
  Map,
  ChevronDown,
  Check,
} from "lucide-react";
import { useCreateOffice, useOffices, useOfficesSummary, useUsers, useUpdateOffice } from "@/lib/queries";
import { accountManagerName, type Office, type OfficeStatus } from "@/lib/api-types";
import { ApiError } from "@/lib/api";
import { AddAgencyDialog } from "@/components/add-agency-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/agency-offices")({
  component: AgencyOfficesPage,
  head: () => ({
    meta: [
      { title: "Agency Office Profiles — The Appliance Guys" },
      {
        name: "description",
        content: "Manage and track all agency office relationships across your portfolio.",
      },
    ],
  }),
});

const statusPill: Record<OfficeStatus, string> = {
  Active: "bg-[oklch(0.96_0.05_150)] text-[oklch(0.45_0.14_150)]",
  Lapsing: "bg-[oklch(0.96_0.06_60)] text-[oklch(0.5_0.16_50)]",
  Inactive: "bg-[oklch(0.96_0.04_25)] text-[oklch(0.55_0.2_25)]",
};

const statusDot: Record<OfficeStatus, string> = {
  Active: "bg-[oklch(0.65_0.18_150)]",
  Lapsing: "bg-[oklch(0.7_0.18_60)]",
  Inactive: "bg-[oklch(0.65_0.22_25)]",
};

// Geocoding mapper for Sydney offices to center green dots on Leaflet map
function getOfficeCoordinates(office: Office): [number, number] | null {
  const name = office.name.toLowerCase();
  const suburb = (office.suburb ?? "").toLowerCase();

  if (name.includes("jackson") || suburb.includes("ryde")) {
    return [-33.805, 151.115]; // Ryde area
  }
  if (name.includes("century") || suburb.includes("hurstville")) {
    return [-33.965, 151.10]; // Hurstville area
  }
  if (name.includes("sydney") || suburb.includes("parramatta")) {
    return [-33.815, 151.0]; // Parramatta
  }
  if (name.includes("cutcliffe") || suburb.includes("dural") || name.includes("windsor")) {
    return [-33.60, 150.82]; // Windsor area
  }
  if (suburb.includes("hornsby") || name.includes("hornsby")) {
    return [-33.70, 151.10]; // Hornsby area
  }
  return null;
}

interface FilterDropdownProps<T> {
  value: T;
  onChange: (val: T) => void;
  options: { value: T; label: string }[];
  placeholder: string;
}

function FilterDropdown({ value, onChange, options, placeholder }: FilterDropdownProps<any>) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;
  const isFiltered = value !== "all";

  const truncatedLabel =
    displayLabel.length > 18 ? displayLabel.slice(0, 15) + "..." : displayLabel;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex h-9 min-w-[140px] items-center justify-between gap-2.5 rounded-xl bg-white border border-slate-200/80 px-4 text-xs font-bold text-slate-700 shadow-xs focus:outline-none transition-all cursor-pointer hover:bg-slate-50/80 ${
            isFiltered
              ? "border-[#e05638]/50 bg-[#e05638]/5 text-[#e05638] hover:bg-[#e05638]/10"
              : ""
          }`}
        >
          <span className="truncate">{truncatedLabel}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-slate-400 ${
              open ? "rotate-180" : ""
            } ${isFiltered ? "text-[#e05638]" : ""}`}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1.5 bg-white border border-slate-200 shadow-lg rounded-2xl">
        <div className="flex flex-col gap-0.5">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
                  isSelected ? "bg-[#e05638]/5 text-[#e05638]" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {isSelected ? (
                  <Check className="h-3.5 w-3.5 text-[#e05638] shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AgencyOfficesPage() {
  const [view, setView] = useState<"list" | "map">("list");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OfficeStatus>("all");
  const [managerFilter, setManagerFilter] = useState<string>("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [bulkLoading, setBulkLoading] = useState(false);
  const navigate = useNavigate();

  // Primary queried list of offices
  const officesQuery = useOffices({
    search: search.trim() || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    accountManager: managerFilter === "all" ? undefined : managerFilter,
    zone: zoneFilter === "all" ? undefined : zoneFilter,
    page,
    limit: view === "map" ? 1000 : limit, // Load all for map plotting
  });

  const updateOffice = useUpdateOffice();

  // Query all offices (unfiltered) to dynamically extract all zones for dropdown
  const allOfficesQuery = useOffices({ limit: 1000 });
  const summaryQuery = useOfficesSummary();
  const usersQuery = useUsers({ limit: 200 });

  const offices = officesQuery.data?.items ?? [];
  const total = officesQuery.data?.total ?? 0;
  const totalPages = officesQuery.data?.totalPages ?? 1;

  // Dynamically extract unique zones from unfiltered offices
  const uniqueZones = useMemo(() => {
    const zones = new Set<string>();
    const items = allOfficesQuery.data?.items ?? [];
    items.forEach((o) => {
      if (o.zone && o.zone.trim()) {
        zones.add(o.zone.trim());
      }
    });
    return Array.from(zones).sort();
  }, [allOfficesQuery.data?.items]);

  const stats = [
    {
      label: "Total Offices",
      value: summaryQuery.data?.total ?? 0,
      icon: Building2,
      tint: "bg-orange-50/70",
      iconBg: "bg-orange-100/80",
      fg: "text-orange-600",
    },
    {
      label: "Active Offices",
      value: summaryQuery.data?.Active ?? 0,
      icon: CheckCircle2,
      tint: "bg-blue-50/70",
      iconBg: "bg-blue-100/80",
      fg: "text-blue-600",
    },
    {
      label: "Lapsing Offices",
      value: summaryQuery.data?.Lapsing ?? 0,
      icon: Clock,
      tint: "bg-amber-50/70",
      iconBg: "bg-amber-100/80",
      fg: "text-amber-600",
    },
    {
      label: "Inactive Offices",
      value: summaryQuery.data?.Inactive ?? 0,
      icon: XCircle,
      tint: "bg-rose-50/70",
      iconBg: "bg-rose-100/80",
      fg: "text-rose-600",
    },
    {
      label: "Unassigned Offices",
      value: summaryQuery.data?.total ? Math.max(0, (summaryQuery.data.total - (allOfficesQuery.data?.items.filter(o => o.accountManager).length ?? 0))) : 11,
      icon: UserX,
      tint: "bg-purple-50/70",
      iconBg: "bg-purple-100/80",
      fg: "text-purple-600",
    },
  ];

  const allSelected = selected.size === offices.length && offices.length > 0;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(offices.map((o) => o.id)));
  const toggleOne = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // Bulk Actions
  async function handleTagHighPriority() {
    setBulkLoading(true);
    try {
      const promises = Array.from(selected).map(async (id) => {
        const o = offices.find((x) => x.id === id);
        if (!o) return;
        const currentTags = o.tags ?? [];
        if (!currentTags.includes("high-priority")) {
          await updateOffice.mutateAsync({
            id,
            patch: { tags: [...currentTags, "high-priority"] },
          });
        }
      });
      await Promise.all(promises);
      toast.success(`Tagged ${selected.size} offices as High Priority`);
      setSelected(new Set());
    } catch (err) {
      toast.error("Failed to tag some offices");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleRemovePriority() {
    setBulkLoading(true);
    try {
      const promises = Array.from(selected).map(async (id) => {
        const o = offices.find((x) => x.id === id);
        if (!o) return;
        const currentTags = o.tags ?? [];
        if (currentTags.includes("high-priority")) {
          await updateOffice.mutateAsync({
            id,
            patch: { tags: currentTags.filter((t) => t !== "high-priority") },
          });
        }
      });
      await Promise.all(promises);
      toast.success(`Removed High Priority tag from ${selected.size} offices`);
      setSelected(new Set());
    } catch (err) {
      toast.error("Failed to untag some offices");
    } finally {
      setBulkLoading(false);
    }
  }

  function handleExportCSV() {
    const headers = ["ID", "Name", "Status", "Phone", "Suburb", "Zone", "Account Manager", "PUM"];
    const rows = Array.from(selected).map((id) => {
      const o = offices.find((x) => x.id === id);
      if (!o) return [];
      const am = accountManagerName(o.accountManager) || "Unassigned";
      return [
        o.id,
        o.name,
        o.status,
        o.phone || "",
        o.suburb || "",
        o.zone || "",
        am,
        o.pum || 0,
      ];
    });

    const csvContent = [headers, ...rows]
      .map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `agency_offices_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selected.size} offices to CSV`);
  }

  function handleBulkEmail() {
    const emails = Array.from(selected)
      .map((id) => offices.find((x) => x.id === id)?.email)
      .filter(Boolean) as string[];

    if (emails.length === 0) {
      toast.error("None of the selected offices have email addresses");
      return;
    }

    navigator.clipboard.writeText(emails.join(", "));
    toast.success(`Copied ${emails.length} email addresses to clipboard for bulk email`);
  }

  // Options lists for dropdown filters
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Lapsing", label: "Lapsing" },
  ];

  const managerOptions = useMemo(() => {
    const list = [{ value: "all", label: "All Account Managers" }];
    const users = usersQuery.data?.items ?? [];
    users.forEach((u) => {
      list.push({ value: u.id, label: u.name });
    });
    return list;
  }, [usersQuery.data?.items]);

  const zoneOptions = useMemo(() => {
    const list = [{ value: "all", label: "All Zones" }];
    uniqueZones.forEach((z) => {
      list.push({ value: z, label: z });
    });
    return list;
  }, [uniqueZones]);

  return (
    <div className="min-h-full bg-background p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Agency Office Profiles
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Manage and track all agency office relationships across your portfolio.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <HeaderBtn icon={Maximize2}>Max</HeaderBtn>
          <HeaderBtn icon={Download}>Export</HeaderBtn>
          <HeaderBtn icon={Filter}>Filters</HeaderBtn>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#e05638] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#e05638]/90 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Agency Office
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`flex items-center gap-4 rounded-3xl border border-slate-100/80 p-5 text-left transition-all hover:shadow-md ${s.tint}`}
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${s.iconBg} ${s.fg}`}
            >
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">{s.value}</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-card p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search offices..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200/80 bg-background py-2 px-10 text-xs font-semibold text-slate-700 outline-none focus:border-[#e05638] focus:ring-2 focus:ring-[#e05638]/20 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Custom Status Dropdown */}
        <FilterDropdown
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={statusOptions}
          placeholder="All Statuses"
        />

        {/* Custom Account Manager Dropdown */}
        <FilterDropdown
          value={managerFilter}
          onChange={(v) => {
            setManagerFilter(v);
            setPage(1);
          }}
          options={managerOptions}
          placeholder="All Account..."
        />

        {/* Custom Zone Dropdown */}
        <FilterDropdown
          value={zoneFilter}
          onChange={(v) => {
            setZoneFilter(v);
            setPage(1);
          }}
          options={zoneOptions}
          placeholder="All Zones"
        />

        <button
          onClick={() => setCustomizeOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 cursor-pointer transition-all shadow-xs"
          aria-label="Customize columns"
        >
          <Settings2 className="h-4 w-4 text-slate-500" />
        </button>
        <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1">
          <ToggleBtn active={view === "list"} onClick={() => setView("list")}>
            <List className="h-4 w-4" />
          </ToggleBtn>
          <ToggleBtn active={view === "map"} onClick={() => setView("map")}>
            <Map className="h-4 w-4" />
          </ToggleBtn>
        </div>
      </div>

      {/* Main View Switcher */}
      {view === "list" ? (
        <>
          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-card shadow-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="w-12 px-4 py-3 text-center">
                    <button
                      onClick={toggleAll}
                      className="mx-auto flex h-4.5 w-4.5 items-center justify-center rounded border transition-all cursor-pointer focus:outline-none"
                      style={{
                        backgroundColor: selected.size > 0 ? "#e05638" : "#ffffff",
                        borderColor: selected.size > 0 ? "#e05638" : "#cbd5e1",
                      }}
                    >
                      {allSelected ? (
                        <Check className="h-3 w-3 text-white stroke-[3px]" />
                      ) : selected.size > 0 ? (
                        <Minus className="h-3 w-3 text-white stroke-[3px]" />
                      ) : null}
                    </button>
                  </th>
                  {["Office", "Status", "Phone", "Suburb", "Account Manager", "PUM", "IAT", "Actions"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 ${
                          i === 0 ? "text-left" : "text-center"
                        }`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {officesQuery.isLoading && (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center text-sm text-slate-400">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#e05638]" />
                    </td>
                  </tr>
                )}
                {officesQuery.isError && (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center text-sm text-rose-500">
                      Failed to load offices: {(officesQuery.error as Error).message}
                    </td>
                  </tr>
                )}
                {!officesQuery.isLoading && !officesQuery.isError && offices.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center text-sm text-slate-400 font-medium">
                      No offices match your filters.
                    </td>
                  </tr>
                )}
                {offices.map((o) => (
                  <OfficeRow
                    key={o.id}
                    office={o}
                    selected={selected.has(o.id)}
                    onToggle={() => toggleOne(o.id)}
                    onOpen={() =>
                      navigate({ to: "/agency-offices/$officeId", params: { officeId: o.id } })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="mt-4 flex flex-col items-center justify-between gap-4 border border-slate-100 bg-card px-6 py-4 rounded-2xl sm:flex-row shadow-xs">
            {/* Left: Range info */}
            <div className="text-xs font-bold text-slate-400">
              Showing {total === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, total)} of{" "}
              {total} offices
            </div>

            {/* Center: Page numbers */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const isActive = p === page;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`flex h-7 w-7 items-center justify-center text-xs font-black rounded-lg cursor-pointer transition-all ${
                        isActive
                          ? "bg-[#e05638] text-white shadow-xs"
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  &gt;
                </button>
              </div>
            )}

            {/* Right: Limit Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Rows per page</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600 outline-none focus:border-[#e05638] focus:ring-1 focus:ring-[#e05638]/20 cursor-pointer bg-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Map Component */}
          <OfficeMap offices={offices} />

          {/* Locations without map coordinates */}
          <LocationsWithoutCoordinates offices={offices} />
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3 px-5 shadow-xl shadow-slate-200/30 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
            {selected.size} selected
          </div>

          <button
            onClick={handleTagHighPriority}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 rounded-xl bg-[#e05638] px-3.5 py-2 text-[11px] font-bold text-white shadow-xs hover:bg-[#e05638]/95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Star className="h-3.5 w-3.5 fill-white stroke-none" />
            Tag High Priority
          </button>

          <button
            onClick={handleRemovePriority}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
          >
            <StarOff className="h-3.5 w-3.5 text-slate-400" />
            Remove Priority
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            Export CSV
          </button>

          <button
            onClick={handleBulkEmail}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            Bulk Email
          </button>

          <div className="h-5 w-px bg-slate-200/80" />

          <button
            onClick={() => setSelected(new Set())}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-50 hover:text-rose-600 hover:border-rose-100 transition-all cursor-pointer"
          >
            <X className="h-3.5 w-3.5 text-slate-400" />
            Clear
          </button>
        </div>
      )}

      <AddAgencyDialog open={addOpen} onOpenChange={setAddOpen} />
      <CustomizeFieldsSheet open={customizeOpen} onOpenChange={setCustomizeOpen} />
    </div>
  );
}

// Interactive Leaflet Map Component (100% SSR-Safe via dynamic loading)
function OfficeMap({ offices }: { offices: Office[] }) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    // Dynamic stylesheet load
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.crossOrigin = "";
    document.head.appendChild(link);

    // Dynamic script load
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.crossOrigin = "";
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !containerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Destruct older map instances to prevent double-render container error
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Default center at Sydney, Australia
    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([-33.8688, 151.2093], 10);

    mapRef.current = map;

    // Add high quality responsive OSM tile layers
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markers: any[] = [];
    offices.forEach((o) => {
      const coords = getOfficeCoordinates(o);
      if (coords) {
        // Create custom green marker dots matching mockups exactly
        const marker = L.circleMarker(coords, {
          radius: 7,
          fillColor: "#22c55e",
          color: "#ffffff",
          weight: 2,
          fillOpacity: 1,
        }).addTo(map);

        const initials = o.initials ?? o.name.slice(0, 2).toUpperCase();
        marker.bindPopup(`
          <div style="font-family: Inter, sans-serif; padding: 4px; min-width: 170px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
              <div style="width: 22px; height: 22px; border-radius: 50%; background-color: ${o.avatarColor || '#e05638'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800;">
                ${initials}
              </div>
              <span style="font-weight: 800; font-size: 12px; color: #1e293b;">${o.name}</span>
            </div>
            <div style="font-size: 10px; color: #64748b; font-weight: 600;">
              ${o.address || o.suburb || "No address"}
            </div>
            ${
              o.phone
                ? `<div style="font-size: 10px; color: #334155; margin-top: 3px; font-weight: 700;">📞 ${o.phone}</div>`
                : ""
            }
          </div>
        `);
        markers.push(marker);
      }
    });

    // Auto fit bounds to populated active markers nicely
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2));
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leafletLoaded, offices]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-card shadow-xs p-1.5">
      {!leafletLoaded ? (
        <div className="flex h-[480px] w-full items-center justify-center bg-slate-50/50">
          <Loader2 className="h-6 w-6 animate-spin text-[#e05638]" />
        </div>
      ) : (
        <div ref={containerRef} className="h-[480px] w-full rounded-xl z-0" />
      )}
    </div>
  );
}

// 3-Column Responsive Grid listing offices without map coordinates
function LocationsWithoutCoordinates({ offices }: { offices: Office[] }) {
  const navigate = useNavigate();
  const officesWithoutCoords = useMemo(() => {
    return offices.filter((o) => getOfficeCoordinates(o) === null);
  }, [offices]);

  return (
    <div className="rounded-2xl border border-slate-100 bg-card p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
            <MapPin className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-black text-slate-800">
            Locations without map coordinates
          </h3>
          <span className="flex h-5 items-center justify-center rounded-full bg-slate-100 px-2.5 text-[10px] font-extrabold text-slate-500">
            {officesWithoutCoords.length}
          </span>
        </div>
      </div>

      {officesWithoutCoords.length === 0 ? (
        <p className="text-xs font-bold text-slate-400 text-center py-6">
          All locations have map coordinates!
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {officesWithoutCoords.map((o) => (
            <div
              key={o.id}
              onClick={() => navigate({ to: "/agency-offices/$officeId", params: { officeId: o.id } })}
              className="group flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-white p-4 transition-all hover:border-[#e05638]/40 hover:shadow-xs cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-black text-slate-800 group-hover:text-[#e05638] transition-colors">
                  {o.name}
                </div>
                <div className="mt-1 truncate text-[10px] font-bold text-slate-400">
                  {o.address || "No address"}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate({ to: "/agency-offices/$officeId", params: { officeId: o.id } });
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-600 hover:bg-slate-50 hover:border-[#e05638]/50 hover:text-[#e05638] transition-all shadow-2xs cursor-pointer shrink-0"
              >
                <Eye className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#e05638]/70 transition-colors" />
                View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OfficeRow({
  office: o,
  selected,
  onToggle,
  onOpen,
}: {
  office: Office;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const initials = o.initials ?? o.name.slice(0, 2).toUpperCase();
  const avatarBg = o.avatarColor ?? "oklch(0.75 0.14 150)";

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success(`Copied "${text}" to clipboard`);
  };

  return (
    <tr
      onClick={onOpen}
      className={`group cursor-pointer border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/50 ${
        selected ? "bg-slate-50/80" : ""
      }`}
    >
      <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onToggle}
          className="mx-auto flex h-4.5 w-4.5 items-center justify-center rounded border transition-all cursor-pointer focus:outline-none"
          style={{
            backgroundColor: selected ? "#e05638" : "#ffffff",
            borderColor: selected ? "#e05638" : "#cbd5e1",
          }}
        >
          {selected && <Check className="h-3 w-3 text-white stroke-[3px]" />}
        </button>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white"
            style={{ backgroundColor: avatarBg }}
          >
            {initials}
          </div>
          <span className="font-bold text-slate-800 text-sm group-hover:text-[#e05638] transition-colors">
            {o.name}
          </span>
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${statusPill[o.status]}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusDot[o.status]}`} />
          {o.status}
        </span>
      </td>
      <td className="px-4 py-4 text-center">
        {o.phone ? (
          <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            {o.phone}
            <button
              onClick={(e) => handleCopy(e, o.phone!)}
              className="p-1 hover:bg-slate-200/50 rounded-md transition-colors cursor-pointer text-slate-400 hover:text-slate-700"
              title="Copy phone"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Dash />
        )}
      </td>
      <td className="px-4 py-4 text-center text-xs font-bold text-slate-600">
        {o.suburb ? (
          <span>
            {o.suburb}
            {o.zone ? ` / ${o.zone}` : ""}
          </span>
        ) : (
          <Dash />
        )}
      </td>
      <td className="px-4 py-4 text-center text-xs font-bold">
        {(() => {
          const name = accountManagerName(o.accountManager);
          if (name) return <span className="text-slate-700">{name}</span>;
          if (o.accountManager) return <span className="text-slate-700">Assigned</span>;
          return (
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <User className="h-3.5 w-3.5" />
              Unassigned
            </span>
          );
        })()}
      </td>
      <td className="px-4 py-4 text-center text-xs font-extrabold text-slate-700">
        {o.pum ?? <Dash />}
      </td>
      <td className="px-4 py-4 text-center text-xs font-bold">
        {o.inactivityAlert && o.inactivityAlert !== "none" ? (
          <span
            className={
              o.inactivityAlert === "ai"
                ? "font-extrabold text-blue-600"
                : "text-slate-600"
            }
          >
            {o.inactivityAlert === "ai" ? "AI Alert" : `${o.inactivityAlert} days`}
          </span>
        ) : (
          <Dash />
        )}
      </td>
      <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
        <button className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer">
          <MoreVertical className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

function HeaderBtn({ icon: Icon, children }: { icon: any; children: ReactNode }) {
  return (
    <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-xs">
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      {children}
    </button>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
        active ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
      }`}
    >
      {children}
    </button>
  );
}

function Dash() {
  return <span className="text-slate-300 font-bold">—</span>;
}

const FIELD_GROUPS: { group: string; fields: { key: string; label: string; defaultOn?: boolean }[] }[] = [
  {
    group: "Contact Info",
    fields: [
      { key: "phone", label: "Phone", defaultOn: true },
      { key: "email", label: "Email", defaultOn: true },
      { key: "officeEmail", label: "General Office Email" },
      { key: "website", label: "Website" },
    ],
  },
  {
    group: "Location",
    fields: [
      { key: "address", label: "Address", defaultOn: true },
      { key: "suburb", label: "Suburb", defaultOn: true },
      { key: "state", label: "State", defaultOn: true },
      { key: "zip", label: "Zip Code" },
      { key: "zone", label: "Zone" },
    ],
  },
  {
    group: "Business",
    fields: [
      { key: "trading", label: "Trading Name" },
      { key: "legal", label: "Legal Entity Name" },
      { key: "abn", label: "ABN" },
      { key: "license", label: "Principal License" },
      { key: "hopm", label: "Head of Property Management" },
      { key: "manager", label: "Account Manager", defaultOn: true },
    ],
  },
  {
    group: "Operations",
    fields: [
      { key: "status", label: "Status", defaultOn: true },
      { key: "pum", label: "Total Properties", defaultOn: true },
      { key: "spend", label: "Estimated Monthly Spend" },
      { key: "platform", label: "Platform & System" },
      { key: "iat", label: "Inactivity Alert Threshold", defaultOn: true },
      { key: "opened", label: "Opened Date" },
    ],
  },
];

function CustomizeFieldsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [values, setValues] = useState<Record<string, boolean>>(() => {
    const v: Record<string, boolean> = {};
    FIELD_GROUPS.forEach((g) => g.fields.forEach((f) => (v[f.key] = !!f.defaultOn)));
    return v;
  });

  const reset = () => {
    const v: Record<string, boolean> = {};
    FIELD_GROUPS.forEach((g) => g.fields.forEach((f) => (v[f.key] = !!f.defaultOn)));
    setValues(v);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="text-2xl font-bold">Customize List Fields</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {FIELD_GROUPS.map((g, idx) => (
            <div
              key={g.group}
              className={idx > 0 ? "mt-6 border-t border-border pt-6" : ""}
            >
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {g.group}
              </h4>
              <div className="space-y-3">
                {g.fields.map((f) => (
                  <div key={f.key} className="flex items-center justify-between animate-in fade-in-50 duration-200">
                    <span className="text-sm text-slate-700 font-semibold">{f.label}</span>
                    <Switch
                      checked={!!values[f.key]}
                      onCheckedChange={(v) =>
                        setValues((s) => ({ ...s, [f.key]: v }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-6 py-4 bg-slate-50/50">
          <Button variant="outline" onClick={reset} className="rounded-xl font-bold text-xs">
            Reset to Default
          </Button>
          <Button onClick={() => onOpenChange(false)} className="bg-[#e05638] hover:bg-[#e05638]/90 text-white rounded-xl font-bold text-xs">Save</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
