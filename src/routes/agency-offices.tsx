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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Loader2,
  Eye,
  MapPin,
  X,
  GripVertical,
  Paperclip,
  Mic,
  Send,
  Calendar,
  Upload,
  FileText,
  ChevronDown,
} from "lucide-react";
import { useCreateOffice, useOffices, useOfficesSummary, useUsers, useUpdateOffice } from "@/lib/queries";
import { accountManagerName, type Office, type OfficeStatus } from "@/lib/api-types";
import { toast } from "sonner";

// Figma custom icons
import ArchiveIcon from "@/icons/Archive.svg";
import BuildingIcon from "@/icons/BuildingApartment.svg";
import CaretDoubleLeftIcon from "@/icons/CaretDoubleLeft.svg";
import CaretDoubleRightIcon from "@/icons/CaretDoubleRight.svg";
import CaretDownIcon from "@/icons/CaretDown.svg";
import CaretLeftIcon from "@/icons/CaretLeft.svg";
import CaretRightIcon from "@/icons/CaretRight.svg";
import CaretUpDownIcon from "@/icons/CaretUpDown.svg";
import CheckIcon from "@/icons/Check.svg";
import CheckCircleIcon from "@/icons/CheckCircle.svg";
import CheckSquareIcon from "@/icons/CheckSquare.svg";
import CheckSquareCheckedIcon from "@/icons/CheckSquare-1.svg";
import ClockIcon from "@/icons/Clock.svg";
import CommandIcon from "@/icons/Command.svg";
import CopyIcon from "@/icons/Copy.svg";
import DotsThreeIcon from "@/icons/DotsThree.svg";
import DownloadSimpleIcon from "@/icons/DownloadSimple-1.svg";
import EnvelopeSimpleIcon from "@/icons/EnvelopeSimple.svg";
import FadersHorizontalIcon from "@/icons/FadersHorizontal.svg";
import MagnifyingGlassIcon from "@/icons/MagnifyingGlass.svg";
import MapTrifoldIcon from "@/icons/MapTrifold.svg";
import MinusIcon from "@/icons/Minus.svg";
import MinusSquareIcon from "@/icons/MinusSquare.svg";
import PlusIconIcon from "@/icons/Plus Icon.svg";
import SparkleIcon from "@/icons/Sparkle.svg";
import TableIconIcon from "@/icons/Table Icon.svg";
import TrendDownIcon from "@/icons/TrendDown.svg";
import TrendUpIcon from "@/icons/TrendUp.svg";
import UserCircleMinusIcon from "@/icons/UserCircleMinus.svg";
import UserCircleCheckIcon from "@/icons/UserCircleCheck.svg";
import XCircleIcon from "@/icons/XCircle.svg";

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
  Active: "bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]/60",
  Lapsing: "bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3]/60",
  Inactive: "bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF]/60",
  Archived: "bg-[#F1F3F4] text-[#5F6368] border border-[#E8EAED]/60",
};

const statusDot: Record<OfficeStatus, string> = {
  Active: "bg-[#137333]",
  Lapsing: "bg-[#B06000]",
  Inactive: "bg-[#C5221F]",
  Archived: "bg-[#5F6368]",
};

// Geocoding mapper for Sydney offices to center on Leaflet map matching screenshot
function getOfficeCoordinates(office: Office): [number, number] | null {
  const name = office.name.toLowerCase();

  if (name.includes("jackson") || name.includes("rowe")) {
    return [-33.95, 150.92]; // Windsor mapped south of Liverpool near M8
  }
  if (name.includes("all sydney")) {
    return [-33.86, 150.95]; // Center Liverpool/M12
  }
  if (name.includes("lifestyle") || name.includes("acreage")) {
    return [-33.82, 150.84]; // Left of Parramatta near M7
  }
  if (name.includes("dural") || name.includes("properties dural")) {
    return [-33.78, 151.05]; // Top-right of Parramatta near A3
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
          className={`flex h-10 min-w-[140px] shrink-0 items-center justify-between gap-2.5 rounded-xl bg-white border border-slate-200/80 px-4 text-xs font-bold text-slate-700 shadow-xs focus:outline-none transition-all cursor-pointer hover:bg-slate-50/80 ${
            isFiltered
              ? "border-[#dd5437]/50 bg-[#dd5437]/5 text-[#dd5437] hover:bg-[#dd5437]/10"
              : ""
          }`}
        >
          <span className="truncate">{truncatedLabel}</span>
          <img
            src={CaretDownIcon}
            alt="Caret"
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 opacity-60 ${
              open ? "rotate-180" : ""
            } ${isFiltered ? "text-[#dd5437]" : ""}`}
            style={isFiltered ? { filter: "invert(40%) sepia(80%) saturate(1500%) hue-rotate(345deg) brightness(95%) contrast(90%)" } : undefined}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1.5 bg-white border border-slate-200 shadow-lg rounded-2xl" align="start">
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
                className="flex w-full items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl text-left text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer border-0 bg-transparent"
              >
                <div className="shrink-0 flex items-center justify-center">
                  {isSelected ? (
                    <img src={CheckSquareCheckedIcon} alt="Checked" className="h-[18px] w-[18px]" />
                  ) : (
                    <img src={CheckSquareIcon} alt="Unchecked" className="h-[18px] w-[18px]" />
                  )}
                </div>
                <span className={isSelected ? "text-slate-900 font-bold" : "text-slate-650 font-medium"}>
                  {opt.label}
                </span>
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
  const [importOpen, setImportOpen] = useState(false);
  const [maxOpen, setMaxOpen] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState<Record<string, boolean>>({
    "Total Offices": true,
    "Active Offices": true,
    "Lapsing Offices": true,
    "Inactive Offices": true,
    "Unassigned Offices": true,
    "Archived Offices": false,
  });
  const [cardTrendFilter, setCardTrendFilter] = useState("vs Last Month");
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
    limit: view === "map" ? 200 : limit, // Load all for map plotting
  });

  const updateOffice = useUpdateOffice();

  // Query all offices (unfiltered) to dynamically extract all zones for dropdown
  const allOfficesQuery = useOffices({ limit: 200 });
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
      value: summaryQuery.data?.total ?? 18,
      icon: BuildingIcon,
      bg: "#FAF5F2",
      borderColor: "rgba(221, 84, 55, 0.12)",
      fg: "text-[#dd5437]",
      trendType: "up" as const,
      trendVal: "12%",
      trendColor: "text-emerald-500",
      trendIcon: TrendUpIcon,
    },
    {
      label: "Active Offices",
      value: summaryQuery.data?.Active ?? 18,
      icon: CheckCircleIcon,
      bg: "#F0F7FF",
      borderColor: "rgba(37, 99, 235, 0.12)",
      fg: "text-blue-600",
      trendType: "down" as const,
      trendVal: "12%",
      trendColor: "text-rose-500",
      trendIcon: TrendDownIcon,
    },
    {
      label: "Lapsing Offices",
      value: summaryQuery.data?.Lapsing ?? 0,
      icon: ClockIcon,
      bg: "#FDF8EA",
      borderColor: "rgba(217, 119, 6, 0.12)",
      fg: "text-amber-600",
      trendType: "neutral" as const,
      trendVal: "—",
      trendColor: "text-slate-400",
      trendIcon: null,
    },
    {
      label: "Inactive Office",
      value: summaryQuery.data?.Inactive ?? 0,
      icon: XCircleIcon,
      bg: "#FFF5F5",
      borderColor: "rgba(225, 29, 72, 0.12)",
      fg: "text-rose-600",
      trendType: "neutral" as const,
      trendVal: "—",
      trendColor: "text-slate-400",
      trendIcon: null,
    },
    {
      label: "Unassigned Offices",
      value: allOfficesQuery.data?.items.filter(o => !o.accountManager).length ?? 11,
      icon: UserCircleMinusIcon,
      bg: "#F8F6FC",
      borderColor: "rgba(139, 92, 246, 0.12)",
      fg: "text-purple-600",
      trendType: "down" as const,
      trendVal: "8.3%",
      trendColor: "text-rose-500",
      trendIcon: TrendDownIcon,
    },
    {
      label: "Archived Offices",
      value: allOfficesQuery.data?.items.filter(o => o.status === "Archived").length ?? 0,
      icon: UserCircleMinusIcon,
      bg: "#F8F9FA",
      borderColor: "rgba(31, 31, 31, 0.08)",
      fg: "text-slate-500",
      trendType: "neutral" as const,
      trendVal: "—",
      trendColor: "text-slate-400",
      trendIcon: null,
    },
  ];

  const visibleStats = stats.filter(s => {
    const key = s.label === "Inactive Office" ? "Inactive Offices" : s.label;
    return activeWidgets[key];
  });

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

  // Action methods
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
    { value: "Archived", label: "Archived" },
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
    <div className="min-h-full bg-white p-8">
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
          <button
            onClick={() => setCustomizeOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-all shadow-xs border-0 shrink-0"
            aria-label="Customize columns"
          >
            <img src={FadersHorizontalIcon} alt="Sliders" className="h-5 w-5" />
          </button>
          
          <button 
            onClick={() => setMaxOpen(true)}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#EA788F] via-[#C666A3] to-[#8B5CF6] px-4 py-2 text-xs font-extrabold text-white shadow-md hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shrink-0 border-0"
            aria-label="Max"
          >
            <img src={SparkleIcon} alt="Sparkle" className="h-4 w-4 filter brightness-0 invert" />
            <span>Max</span>
          </button>

          <button
            onClick={() => setImportOpen(true)}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs shrink-0"
          >
            <img src={DownloadSimpleIcon} alt="Download" className="h-4 w-4" />
            <span>Import</span>
          </button>

          <button
            onClick={() => setAddOpen(true)}
            className="flex h-10 items-center gap-2 rounded-xl bg-[#dd5437] hover:bg-[#c9452b] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition-all cursor-pointer border-0"
          >
            <img src={PlusIconIcon} alt="Plus" className="h-4 w-4 filter brightness-0 invert" />
            <span>New Agency Office</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Section Container */}
      <div 
        className="mb-6 p-4 border rounded-[16px] bg-white"
        style={{
          borderColor: "rgba(31, 31, 31, 0.08)",
        }}
      >
        <div className={`grid gap-4 grid-cols-2 md:grid-cols-3 ${
          visibleStats.length === 6 ? "lg:grid-cols-6" :
          visibleStats.length === 5 ? "lg:grid-cols-5" :
          visibleStats.length === 4 ? "lg:grid-cols-4" :
          visibleStats.length === 3 ? "lg:grid-cols-3" :
          "lg:grid-cols-2"
        }`}>
          {visibleStats.map((s) => {
            const isTotalOffices = s.label === "Total Offices";
            return (
              <div
                key={s.label}
                className="flex justify-between items-start self-stretch p-4 border rounded-[16px] select-none transition-all hover:shadow-xs w-full"
                style={{
                  backgroundColor: s.bg,
                  borderColor: s.borderColor,
                }}
              >
                {/* Left Column: Icon + Label on top, Value on bottom */}
                <div className="flex flex-col justify-between items-start h-full min-h-[76px]">
                  <div className="flex items-center gap-2">
                    <img src={s.icon} alt={s.label} className="h-6 w-6 object-contain" />
                    <span className="text-xs font-bold text-slate-750">{s.label}</span>
                  </div>
                  <span className="text-3xl font-extrabold text-slate-850 tracking-tight leading-none mt-6">
                    {s.value}
                  </span>
                </div>

                {/* Right Column: Caret popover on top, Trend value on bottom */}
                <div className="flex flex-col justify-between items-end h-full min-h-[76px]">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-slate-400 hover:text-slate-650 bg-transparent border-0 flex items-center justify-center p-1 rounded-lg hover:bg-slate-100/35 transition-colors cursor-pointer focus:outline-none">
                        <img 
                          src={CaretDownIcon} 
                          alt="Caret" 
                          className={`h-4 w-4 transition-transform duration-200 ${isTotalOffices ? "rotate-180" : ""}`} 
                        />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1.5 bg-white border border-slate-200 shadow-lg rounded-2xl z-[100]" align="end">
                      <div className="flex flex-col gap-0.5">
                        {["vs Last Month", "vs Last Week", "vs Last Quarter", "vs Last Year"].map((opt) => {
                          const isSelected = cardTrendFilter === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => setCardTrendFilter(opt)}
                              className="flex w-full items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl text-left text-slate-655 hover:bg-slate-50 transition-colors cursor-pointer border-0 bg-transparent"
                            >
                              <div className="shrink-0 flex items-center justify-center">
                                {isSelected ? (
                                  <img src={CheckSquareCheckedIcon} alt="Checked" className="h-[18px] w-[18px]" />
                                ) : (
                                  <img src={CheckSquareIcon} alt="Unchecked" className="h-[18px] w-[18px]" />
                                )}
                              </div>
                              <span className={isSelected ? "text-slate-900 font-bold" : "text-slate-600 font-medium"}>
                                {opt}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <div className="flex flex-col items-end leading-none gap-1 mt-6">
                    {s.trendType !== "neutral" ? (
                      <div className={`flex items-center gap-0.5 text-xs font-extrabold ${s.trendColor}`}>
                        {s.trendIcon && (
                          <img 
                            src={s.trendIcon} 
                            alt="Trend" 
                            className="h-4 w-4 shrink-0" 
                          />
                        )}
                        <span>{s.trendVal}</span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">
                        —
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-400 mt-0.5 select-none whitespace-nowrap leading-none">
                      {cardTrendFilter}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters bar */}
      <div 
        className="mb-4 flex items-center justify-between gap-4 w-full bg-white p-4 border rounded-[16px] overflow-x-auto scrollbar-none"
        style={{
          borderColor: "rgba(31, 31, 31, 0.08)",
        }}
      >
        {/* Left Side: Search + Dropdown Filters */}
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <div className="relative w-[220px] h-10 shrink-0">
            <img src={MagnifyingGlassIcon} alt="Search" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              placeholder="Search offices..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-full rounded-xl border border-slate-200/80 bg-white pl-10 pr-14 text-xs font-bold text-slate-700 outline-none focus:border-[#dd5437]/50 focus:ring-1 focus:ring-[#dd5437]/10 transition-all placeholder:text-slate-400"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-400 shadow-3xs select-none">
              K <img src={CommandIcon} alt="Cmd" className="h-2.5 w-2.5 opacity-60" />
            </div>
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

          {(statusFilter !== "all" || managerFilter !== "all" || zoneFilter !== "all" || search !== "") && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setManagerFilter("all");
                setZoneFilter("all");
                setSearch("");
                setPage(1);
              }}
              className="text-xs font-extrabold text-[#dd5437] hover:text-[#c9452b] transition-all cursor-pointer bg-transparent border-0 hover:underline px-2"
            >
              Clear
            </button>
          )}
        </div>

        {/* Right Side: Grid / Map toggles */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setView("list")}
            className={`flex h-10 w-10 items-center justify-center rounded-xl cursor-pointer transition-all shrink-0 ${
              view === "list"
                ? "bg-[#FAF5F2] border border-[#F5EAE2] text-[#dd5437] font-bold shadow-xs"
                : "bg-white border border-slate-200 text-slate-400 hover:text-slate-655 hover:border-slate-300"
            }`}
          >
            <img src={TableIconIcon} alt="Table View" className={`h-4.5 w-4.5 ${view === "list" ? "" : "opacity-60"}`} />
          </button>
          <button
            onClick={() => setView("map")}
            className={`flex h-10 w-10 items-center justify-center rounded-xl cursor-pointer transition-all shrink-0 ${
              view === "map"
                ? "bg-[#FAF5F2] border border-[#F5EAE2] text-[#dd5437] font-bold shadow-xs"
                : "bg-white border border-slate-200 text-slate-400 hover:text-slate-655 hover:border-slate-300"
            }`}
          >
            <img src={MapTrifoldIcon} alt="Map View" className={`h-4.5 w-4.5 ${view === "map" ? "" : "opacity-60"}`} />
          </button>
        </div>
      </div>

      {/* Main View Switcher */}
      {view === "list" ? (
        <>
          {/* Table */}
          <div 
            className="overflow-x-auto rounded-[16px] border bg-white p-4"
            style={{
              borderColor: "rgba(31, 31, 31, 0.08)",
            }}
          >
            <table className="w-full border-separate border-spacing-y-2.5">
              <thead>
                <tr className="border-0 bg-transparent">
                  <th className="w-12 px-4 py-3 text-center">
                    <button
                      onClick={toggleAll}
                      className="mx-auto flex h-[18px] w-[18px] items-center justify-center cursor-pointer focus:outline-none border-0 bg-transparent"
                    >
                      {allSelected ? (
                        <img src={CheckSquareCheckedIcon} alt="Checked" className="h-[18px] w-[18px]" />
                      ) : selected.size > 0 ? (
                        <img src={MinusSquareIcon} alt="Partial" className="h-[18px] w-[18px]" />
                      ) : (
                        <img src={CheckSquareIcon} alt="Unchecked" className="h-[18px] w-[18px]" />
                      )}
                    </button>
                  </th>
                  {["Office", "Status", "Phone", "Suburb", "Account Manager", "Pum", "IAT", "Actions"].map(
                    (h, i) => {
                      const isActions = h === "Actions";
                      return (
                        <th
                          key={h}
                          className={`px-4 py-3 text-[11px] font-bold text-slate-400 select-none ${
                            i === 0 ? "text-left" : "text-center"
                          }`}
                        >
                          {!isActions ? (
                            <div className={`flex items-center gap-1.5 cursor-pointer hover:text-slate-655 transition-colors ${i === 0 ? "justify-start" : "justify-center"}`}>
                              <span>{h}</span>
                              <img src={CaretUpDownIcon} alt="Sort" className="h-3.5 w-3.5 opacity-60 shrink-0" />
                            </div>
                          ) : (
                            <span>{h}</span>
                          )}
                        </th>
                      );
                    }
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
          <div 
            className="mt-4 flex flex-col items-center justify-between gap-4 border bg-white px-6 py-4 rounded-[16px] sm:flex-row shadow-none"
            style={{
              borderColor: "rgba(31, 31, 31, 0.08)",
            }}
          >
            {/* Left: Range info */}
            <div className="text-xs font-bold text-slate-400">
              Showing {total === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, total)} of{" "}
              {total} offices
            </div>

            {/* Center: Page numbers */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all bg-white"
              >
                <img src={CaretDoubleLeftIcon} alt="First" className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all bg-white"
              >
                <img src={CaretLeftIcon} alt="Previous" className="h-4 w-4" />
              </button>
              
              <span className="text-xs font-bold text-slate-550">Page</span>
              <input
                type="number"
                value={page}
                min={1}
                max={totalPages}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 1 && val <= totalPages) {
                    setPage(val);
                  }
                }}
                className="h-7.5 w-10 text-center rounded-lg border border-slate-205 bg-white text-xs font-black text-slate-700 outline-none focus:border-[#dd5437]"
              />
              <span className="text-xs font-bold text-slate-550">of {totalPages}</span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all bg-white"
              >
                <img src={CaretRightIcon} alt="Next" className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all bg-white"
              >
                <img src={CaretDoubleRightIcon} alt="Last" className="h-4 w-4" />
              </button>
            </div>

            {/* Right: Limit Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Row per page</span>
              <div className="relative">
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded-lg border border-slate-200 px-3 pr-8 py-1 text-xs font-bold text-slate-600 outline-none focus:border-[#dd5437] focus:ring-1 focus:ring-[#dd5437]/20 cursor-pointer bg-white appearance-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <img src={CaretDownIcon} alt="Caret" className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
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
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-3 px-6 shadow-xl shadow-slate-200/25 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="text-xs font-bold text-slate-650 whitespace-nowrap">
            {selected.size} selected
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl bg-[#dd5437] hover:bg-[#c9452b] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer border-0"
          >
            <img src={DownloadSimpleIcon} alt="Export" className="h-3.5 w-3.5 filter brightness-0 invert" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleBulkEmail}
            className="flex items-center gap-2 rounded-xl border border-slate-205 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-3xs"
          >
            <img src={EnvelopeSimpleIcon} alt="Mail" className="h-4 w-4" />
            <span>Bulk Email</span>
          </button>

          <button
            onClick={() => {
              toast.info("Bulk Assign Account Manager clicked");
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-205 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-3xs"
          >
            <img src={UserCircleCheckIcon} alt="Assign" className="h-4 w-4" />
            <span>Assign Account Manager</span>
          </button>

          <button
            onClick={() => setSelected(new Set())}
            className="text-xs font-extrabold text-[#dd5437] hover:text-[#c9452b] transition-all cursor-pointer bg-transparent border-0 hover:underline px-2"
          >
            Clear
          </button>
        </div>
      )}

      <AddLocationSheet open={addOpen} onOpenChange={setAddOpen} />
      <ImportFileDialog open={importOpen} onOpenChange={setImportOpen} />
      <CustomizeWidgetsSheet open={customizeOpen} onOpenChange={setCustomizeOpen} activeWidgets={activeWidgets} onSave={setActiveWidgets} />
      <MaxChatSheet open={maxOpen} onOpenChange={setMaxOpen} />
    </div>
  );
}

// Interactive Leaflet Map Component (100% SSR-Safe via dynamic loading)
function OfficeMap({ offices }: { offices: Office[] }) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const navigate = useNavigate();

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

    // Inject custom premium black tooltip stylesheet
    const style = document.createElement("style");
    style.innerHTML = `
      .leaflet-tooltip.custom-map-tooltip {
        background-color: #1a1a1a !important;
        color: #ffffff !important;
        border: 0 !important;
        border-radius: 6px !important;
        padding: 5px 12px !important;
        font-size: 10px !important;
        font-weight: 800 !important;
        font-family: Inter, sans-serif !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1) !important;
        pointer-events: none !important;
        transition: all 0.2s ease-in-out !important;
      }
      .leaflet-tooltip-top.custom-map-tooltip::before {
        border-top-color: #1a1a1a !important;
        transition: all 0.2s ease-in-out !important;
      }
      .leaflet-tooltip.custom-map-tooltip.active-map-tooltip {
        background-color: #ffffff !important;
        color: #1a1a1a !important;
        border: 1px solid #e2e8f0 !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1) !important;
      }
      .leaflet-tooltip-top.custom-map-tooltip.active-map-tooltip::before {
        border-top-color: #ffffff !important;
      }
    `;
    document.head.appendChild(style);

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

    // Add standard colorful OpenStreetMap tile layer matching mockup color schema
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Close overlay card on map click
    map.on("click", () => {
      setSelectedOffice(null);
    });

    const markers: any[] = [];
    offices.forEach((o) => {
      const coords = getOfficeCoordinates(o);
      if (coords) {
        // Create custom divIcon marker showing white circles with red-orange border and center bullets
        const isJacksonRowe = o.name.toLowerCase().includes("jackson");
        const customIcon = L.divIcon({
          className: "custom-map-marker-container",
          html: `
            <div style="display: flex; align-items: center; gap: 6px; position: relative;">
              <div style="display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; background-color: white; border: 3.5px solid #dd5437; box-shadow: 0 1px 3px rgba(0,0,0,0.15); shrink-0;">
                <div style="width: 5px; height: 5px; border-radius: 50%; background-color: #dd5437;"></div>
              </div>
              ${isJacksonRowe ? `
                <span style="font-family: Inter, sans-serif; font-size: 11px; font-weight: 800; color: #475569; background-color: white; padding: 1.5px 4.5px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.08); border: 1px solid #f1f5f9; select-none;">A1</span>
              ` : ""}
            </div>
          `,
          iconSize: [40, 20],
          iconAnchor: [9, 9],
        });

        const marker = L.marker(coords, { icon: customIcon }).addTo(map);

        // Bind high fidelity black tooltip label permanently visible above the marker
        marker.bindTooltip(o.name, {
          permanent: true,
          direction: "top",
          className: "custom-map-tooltip",
          offset: [0, -12]
        });

        // Set active office state on marker click and stop click event from closing it on map
        marker.on("click", (e: any) => {
          L.DomEvent.stopPropagation(e);
          setSelectedOffice(o);
        });

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

  // Synchronize tooltip styles in real-time when selectedOffice changes
  useEffect(() => {
    if (!leafletLoaded) return;
    
    // Find all tooltip containers
    const tooltips = document.querySelectorAll('.custom-map-tooltip');
    tooltips.forEach(t => {
      t.classList.remove('active-map-tooltip');
    });

    if (selectedOffice) {
      tooltips.forEach(t => {
        if (t.textContent?.trim() === selectedOffice.name.trim()) {
          t.classList.add('active-map-tooltip');
        }
      });
    }
  }, [selectedOffice, leafletLoaded]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-card shadow-xs p-1.5 z-0">
      {!leafletLoaded ? (
        <div className="flex h-[480px] w-full items-center justify-center bg-slate-50/50">
          <Loader2 className="h-6 w-6 animate-spin text-[#e05638]" />
        </div>
      ) : (
        <div ref={containerRef} className="h-[480px] w-full rounded-xl z-0" />
      )}

      {selectedOffice && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 right-4 z-[400] w-[350px] bg-white rounded-3xl border border-slate-100 shadow-2xl p-5 animate-in slide-in-from-bottom-2 fade-in duration-200"
        >
          <button
            onClick={() => setSelectedOffice(null)}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer border-0 bg-transparent"
          >
            <X className="h-4.5 w-4.5 stroke-[2.5px]" />
          </button>

          <div className="flex flex-col pr-6">
            <h4 className="text-sm font-black text-slate-800 leading-tight">
              {selectedOffice.name}
            </h4>
            <span className="text-[11px] text-slate-400 font-bold mt-1 leading-snug truncate">
              {selectedOffice.address || "No address listed"}
            </span>
          </div>

          <div className="mt-3 flex items-center">
            <StatusPill status={selectedOffice.status ?? "Active"} />
          </div>

          <div className="my-4 border-b border-slate-100" />

          <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
            <div>
              <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Phone</span>
              <span className="text-[11px] font-black text-slate-700">{selectedOffice.phone || "—"}</span>
            </div>
            <div>
              <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Address</span>
              <span className="text-[11px] font-black text-slate-700 truncate block" title={selectedOffice.address}>
                {selectedOffice.address || "—"}
              </span>
            </div>
            <div>
              <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Suburb</span>
              <span className="text-[11px] font-black text-slate-700">{selectedOffice.suburb || "—"}</span>
            </div>
            <div>
              <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">State</span>
              <span className="text-[11px] font-black text-slate-700">{selectedOffice.state || "—"}</span>
            </div>
            <div>
              <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Account Manager</span>
              <span className="text-[11px] font-black text-slate-700">
                {accountManagerName(selectedOffice.accountManager) || "Unassigned"}
              </span>
            </div>
            <div>
              <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Total Properties</span>
              <span className="text-[11px] font-black text-slate-700">{selectedOffice.pum ?? 0}</span>
            </div>
            <div className="col-span-2">
              <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Inactivity Alert Threshold</span>
              <span className="text-[11px] font-black text-slate-700">14 days</span>
            </div>
          </div>

          <button
            onClick={() => navigate({ to: "/agency-offices/$officeId", params: { officeId: selectedOffice.id } })}
            className="w-full mt-5 rounded-xl bg-[#dd5437] hover:bg-[#c9452b] py-3 text-xs font-black text-white text-center cursor-pointer transition-colors border-0 shadow-xs"
          >
            View Details
          </button>
        </div>
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
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-655 hover:bg-slate-50 hover:border-[#e05638]/50 hover:text-[#e05638] transition-all shadow-2xs cursor-pointer shrink-0"
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

function StatusPill({ status }: { status: OfficeStatus }) {
  if (status === "Active") {
    return (
      <svg width="65" height="24" viewBox="0 0 65 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 select-none">
        <rect width="65" height="24" rx="8" fill="#2093A3" fillOpacity="0.08"/>
        <g clipPath="url(#clip0_235_7792)">
          <path d="M10 14C11.1046 14 12 13.1046 12 12C12 10.8954 11.1046 10 10 10C8.89543 10 8 10.8954 8 12C8 13.1046 8.89543 14 10 14Z" fill="#2093A3"/>
        </g>
        <path d="M20.132 16.5L23.336 7.56H24.728L27.932 16.5H26.672L25.94 14.4H22.124L21.392 16.5H20.132ZM22.496 13.32H25.568L23.864 8.412H24.2L22.496 13.32ZM31.6921 16.644C31.0601 16.644 30.4961 16.496 30.0001 16.2C29.5121 15.904 29.1281 15.5 28.8481 14.988C28.5681 14.476 28.4281 13.9 28.4281 13.26C28.4281 12.612 28.5681 12.036 28.8481 11.532C29.1281 11.028 29.5121 10.628 30.0001 10.332C30.4961 10.036 31.0601 9.888 31.6921 9.888C32.1161 9.888 32.5121 9.964 32.8801 10.116C33.2481 10.268 33.5721 10.472 33.8521 10.728C34.1321 10.984 34.3361 11.284 34.4641 11.628L33.4681 12.108C33.3161 11.772 33.0841 11.5 32.7721 11.292C32.4601 11.076 32.1001 10.968 31.6921 10.968C31.3001 10.968 30.9441 11.068 30.6241 11.268C30.3121 11.468 30.0641 11.74 29.8801 12.084C29.6961 12.428 29.6041 12.824 29.6041 13.272C29.6041 13.704 29.6961 14.096 29.8801 14.448C30.0641 14.792 30.3121 15.064 30.6241 15.264C30.9441 15.564 31.3001 15.564 31.6921 15.564C32.1001 15.564 32.4601 15.46 32.7721 15.252C33.0841 15.036 33.3161 14.752 33.4681 14.4L34.4641 14.904C34.3361 15.24 34.1321 15.54 33.8521 15.804C33.5721 16.06 33.2481 16.264 32.8801 16.416C32.5121 16.568 32.1161 16.644 31.6921 16.644ZM38.5506 16.572C37.9186 16.572 37.4306 16.392 37.0866 16.032C36.7506 15.672 36.5826 15.164 36.5826 14.508V11.1H35.4066V10.032H35.6466C35.9346 10.032 36.1626 9.944 36.3306 9.768C36.4986 9.592 36.5826 9.36 36.5826 9.072V8.544H37.6986V10.032H39.1506V11.1H37.6986V14.472C37.6986 14.688 37.7306 14.876 37.7946 15.036C37.8666 15.196 37.9826 15.324 38.1426 15.42C38.3026 15.508 38.5146 15.552 38.7786 15.552C38.8346 15.552 38.9026 15.548 38.9826 15.54C39.0706 15.532 39.1506 15.524 39.2226 15.516V16.5C39.1186 16.524 39.0026 16.54 38.8746 16.548C38.7466 16.564 38.6386 16.572 38.5506 16.572ZM40.6804 16.5V10.032H41.7964V16.5H40.6804ZM40.6804 9V7.56H41.7964V9H40.6804ZM45.3281 16.5L42.7961 10.032H44.0441L46.0721 15.504H45.6401L47.6801 10.032H48.9281L46.3841 16.5H45.3281ZM52.7853 16.644C52.1613 16.644 51.6053 16.496 51.1173 16.2C50.6293 15.904 50.2453 15.5 49.9653 14.988C49.6853 14.468 49.5453 13.888 49.5453 13.248C49.5453 12.6 49.6813 12.024 49.9533 11.52C50.2333 11.016 50.6093 10.62 51.0813 10.332C51.5613 10.036 52.0973 9.888 52.6893 9.888C53.1693 9.888 53.5933 9.976 53.9613 10.152C54.3373 10.32 54.6533 10.552 54.9093 10.848C55.1733 11.136 55.3733 11.468 55.5093 11.844C55.6533 12.212 55.7253 12.596 55.7253 12.996C55.7253 13.084 55.7173 13.184 55.7013 13.296C55.6933 13.4 55.6813 13.5 55.6653 13.596H50.3613V12.636H55.0173L54.4893 13.068C54.5613 12.652 54.5213 12.28 54.3693 11.952C54.2173 11.624 53.9933 11.364 53.6973 11.172C53.4013 10.98 53.0653 10.884 52.6893 10.884C52.3133 10.884 51.9693 10.98 51.6573 11.172C51.3453 11.364 51.1013 11.64 50.9253 12C50.7573 12.352 50.6893 12.772 50.7213 13.26C50.6893 13.732 50.7613 14.148 50.9373 14.508C51.1213 14.86 51.3773 15.136 51.7053 15.336C52.0413 15.528 52.4053 15.624 52.7973 15.624C53.2293 15.624 53.5933 15.524 53.8893 15.324C54.1853 15.124 54.4253 14.868 54.6093 14.556L55.5453 15.036C55.4173 15.332 55.2173 15.604 54.9453 15.852C54.6813 16.092 54.3653 16.284 53.9973 16.428C53.6373 16.572 53.2333 16.644 52.7853 16.644Z" fill="#2093A3"/>
        <defs>
          <clipPath id="clip0_235_7792">
            <rect width="12" height="12" fill="white" transform="translate(4 6)"/>
          </clipPath>
        </defs>
      </svg>
    );
  }

  if (status === "Inactive") {
    return (
      <svg width="74" height="24" viewBox="0 0 74 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 select-none">
        <rect width="74" height="24" rx="8" fill="#EF4444" fillOpacity="0.08"/>
        <g clipPath="url(#clip0_235_7864)">
          <path d="M10 14C11.1046 14 12 13.1046 12 12C12 10.8954 11.1046 10 10 10C8.89543 10 8 10.8954 8 12C8 13.1046 8.89543 14 10 14Z" fill="#EF4444"/>
        </g>
        <path d="M20.996 16.5V7.56H22.172V16.5H20.996ZM24.0281 16.5V10.032H25.1201V11.292L24.9401 11.184C25.1001 10.776 25.3561 10.46 25.7081 10.236C26.0681 10.004 26.4881 9.888 26.9681 9.888C27.4321 9.888 27.8441 9.992 28.2041 10.2C28.5721 10.408 28.8601 10.696 29.0681 11.064C29.2841 11.432 29.3921 11.848 29.3921 12.312V16.5H28.2641V12.672C28.2641 12.312 28.2001 12.008 28.0721 11.76C27.9441 11.512 27.7601 11.32 27.5201 11.184C27.2881 11.04 27.0201 10.968 26.7161 10.968C26.4121 10.968 26.1401 11.04 25.9001 11.184C25.6681 11.32 25.4841 11.516 25.3481 11.772C25.2121 12.02 25.1441 12.32 25.1441 12.672V16.5H24.0281ZM32.885 16.644C32.461 16.644 32.085 16.568 31.757 16.416C31.437 16.256 31.185 16.04 31.001 15.768C30.817 15.488 30.725 15.168 30.725 14.808C30.725 14.464 30.797 14.156 30.941 13.884C31.093 13.604 31.325 13.368 31.637 13.176C31.957 12.984 32.357 12.848 32.837 12.768L35.237 12.372V13.308L33.089 13.668C32.673 13.74 32.369 13.872 32.177 14.064C31.993 14.256 31.901 14.492 31.901 14.772C31.901 15.036 32.005 15.256 32.213 15.432C32.429 15.608 32.697 15.696 33.017 15.696C33.425 15.696 33.777 15.612 34.073 15.444C34.377 15.268 34.613 15.032 34.781 14.736C34.957 14.44 35.045 14.112 35.045 13.752V12.108C35.045 11.756 34.913 11.472 34.649 11.256C34.393 11.032 34.053 10.92 33.629 10.92C33.261 10.92 32.933 11.016 32.645 11.208C32.365 11.392 32.157 11.64 32.021 11.952L31.049 11.448C31.169 11.152 31.361 10.888 31.625 10.656C31.889 10.416 32.197 10.228 32.549 10.092C32.901 9.956 33.269 9.888 33.653 9.888C34.149 9.888 34.585 9.984 34.961 10.176C35.337 10.36 35.629 10.62 35.837 10.956C36.053 11.284 36.161 11.668 36.161 12.108V16.5H35.069V15.276L35.273 15.348C35.137 15.604 34.953 15.828 34.721 16.02C34.489 16.212 34.217 16.364 33.905 16.476C33.593 16.588 33.253 16.644 32.885 16.644ZM40.8913 16.644C40.2593 16.644 39.6953 16.496 39.1993 16.2C38.7113 15.904 38.3273 15.5 38.0473 14.988C37.7673 14.476 37.6273 13.9 37.6273 13.26C37.6273 12.612 37.7673 12.036 38.0473 11.532C38.3273 11.028 38.7113 10.628 39.1993 10.332C39.6953 10.036 40.2593 9.888 40.8913 9.888C41.3153 9.888 41.7113 9.964 42.0793 10.116C42.4473 10.268 42.7713 10.472 43.0513 10.728C43.3313 10.984 43.5353 11.284 43.6633 11.628L42.6673 12.108C42.5153 11.772 42.2833 11.5 41.9713 11.292C41.6593 11.076 41.2993 10.968 40.8913 10.968C40.4993 10.968 40.1433 11.068 39.8233 11.268C39.5113 11.468 39.2633 11.74 39.0793 12.084C38.8953 12.428 38.8033 12.824 38.8033 13.272C38.8033 13.704 38.8953 14.096 39.0793 14.448C39.2633 14.792 39.5113 15.064 39.8233 15.264C40.1433 15.464 40.4993 15.564 40.8913 15.564C41.2993 15.564 41.6593 15.46 41.9713 15.252C42.2833 15.036 42.5153 14.752 42.6673 14.4L43.6633 14.904C43.5353 15.24 43.3313 15.54 43.0513 15.804C42.7713 16.06 42.4473 16.264 42.0793 16.416C41.7113 16.568 41.3153 16.644 40.8913 16.644ZM47.7498 16.572C47.1178 16.572 46.6298 16.392 46.2858 16.032C45.9498 15.672 45.7818 15.164 45.7818 14.508V11.1H44.6058V10.032H44.8458C45.1338 10.032 45.3618 9.944 45.5298 9.768C45.6978 9.592 45.7818 9.36 45.7818 9.072V8.544H46.8978V10.032H48.3498V11.1H46.8978V14.472C46.8978 14.688 46.9298 14.876 46.9938 15.036C47.0658 15.196 47.1818 15.324 47.3418 15.42C47.5018 15.508 47.7138 15.552 47.9778 15.552C48.0338 15.552 48.1018 15.548 48.1818 15.54C48.2698 15.54 48.3498 15.524 48.4218 15.516V16.5C48.3178 16.524 48.2018 16.54 48.0738 16.548C47.9458 16.564 47.8378 16.572 47.7498 16.572ZM49.8796 16.5V10.032H50.9956V16.5H49.8796ZM49.8796 9V7.56H50.9956V9H49.8796ZM54.5273 16.5L51.9953 10.032H53.2433L55.2713 15.504H54.8393L56.8793 10.032H58.1273L55.5833 16.5H54.5273ZM61.9845 16.644C61.3605 16.644 60.8045 16.496 60.3165 16.2C59.8285 15.904 59.4445 15.5 59.1645 14.988C58.8845 14.468 58.7445 13.888 58.7445 13.248C58.7445 12.6 58.8805 12.024 59.1525 11.52C59.4325 11.016 59.8085 10.62 60.2805 10.332C60.7605 10.036 61.2965 9.888 61.8885 9.888C62.3685 9.888 62.7925 9.976 63.1605 10.152C63.5365 10.32 63.8525 10.552 64.1085 10.848C64.3725 11.136 64.5725 11.468 64.7085 11.844C64.8525 12.212 64.9245 12.596 64.9245 12.996C64.9245 13.084 64.9165 13.184 64.9005 13.296C64.8925 13.4 64.8805 13.5 64.8645 13.596H59.5605V12.636H64.2165L63.6885 13.068C63.7605 12.652 63.7205 12.28 63.5685 11.952C63.4165 11.624 63.1925 11.364 62.8965 11.172C62.6005 10.98 62.2645 10.884 61.8885 10.884C61.5125 10.884 61.1685 10.98 60.8565 11.172C60.5445 11.364 60.3005 11.64 60.1245 12C59.9565 12.352 59.8885 12.772 59.9205 13.26C59.8885 13.732 59.9605 14.148 60.1365 14.508C60.3205 14.86 60.5765 15.136 60.9045 15.336C61.2405 15.528 61.6045 15.624 61.9965 15.624C62.4285 15.624 62.7925 15.524 63.0885 15.324C63.3845 15.124 63.6245 14.868 63.8085 14.556L64.7445 15.036C64.6165 15.332 64.4165 15.604 64.1445 15.852C63.8805 16.092 63.5645 16.284 63.1965 16.428C62.8365 16.572 62.4325 16.644 61.9845 16.644Z" fill="#EF4444"/>
        <defs>
          <clipPath id="clip0_235_7864">
            <rect width="12" height="12" fill="white" transform="translate(4 6)"/>
          </clipPath>
        </defs>
      </svg>
    );
  }

  const pillColors: Record<Exclude<OfficeStatus, "Active" | "Inactive">, { bg: string; text: string; border: string; dot: string }> = {
    Lapsing: {
      bg: "#FEF7E0",
      text: "#B06000",
      border: "rgba(254, 239, 195, 0.6)",
      dot: "#B06000",
    },
    Archived: {
      bg: "#F1F3F4",
      text: "#5F6368",
      border: "rgba(232, 234, 237, 0.6)",
      dot: "#5F6368",
    },
  };

  const colors = pillColors[status as Exclude<OfficeStatus, "Active" | "Inactive">] || pillColors.Lapsing;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        borderRadius: "9999px",
        padding: "4px 10px",
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
      className="text-[10px] font-extrabold tracking-wide uppercase select-none shrink-0"
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: colors.dot,
        }}
        className="shrink-0"
      />
      {status}
    </span>
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
  const [actionsOpen, setActionsOpen] = useState(false);
  const updateOffice = useUpdateOffice();

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success(`Copied "${text}" to clipboard`);
  };

  const isArchived = o.status === "Archived";
  
  // Highlight with border and tinted background exactly as Figma visual
  const rowBg = selected ? "bg-[#FAF5F2]" : "bg-white hover:bg-slate-50/40";
  const rowBorder = selected ? "border-[#dd5437]" : "border-slate-100";
  
  const firstTdClass = `px-4 py-4 rounded-l-2xl border-l border-y ${rowBorder} ${rowBg}`;
  const middleTdClass = `px-4 py-4 border-y ${rowBorder} ${rowBg}`;
  const lastTdClass = `px-4 py-4 rounded-r-2xl border-r border-y ${rowBorder} ${rowBg}`;

  return (
    <tr
      onClick={onOpen}
      className={`group cursor-pointer transition-all duration-200 ${
        isArchived
          ? "opacity-75"
          : selected 
            ? "relative z-10" 
            : ""
      }`}
    >
      {/* Checkbox Column */}
      <td 
        className={firstTdClass}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onToggle}
          className="mx-auto flex h-[18px] w-[18px] items-center justify-center cursor-pointer focus:outline-none border-0 bg-transparent"
        >
          {selected ? (
            <img src={CheckSquareCheckedIcon} alt="Checked" className="h-[18px] w-[18px]" />
          ) : (
            <img src={CheckSquareIcon} alt="Unchecked" className="h-[18px] w-[18px]" />
          )}
        </button>
      </td>

      {/* Office Name Column */}
      <td className={middleTdClass}>
        <span className={`font-bold text-slate-800 text-sm group-hover:text-[#dd5437] transition-colors ${isArchived ? "line-through text-slate-500 font-medium" : ""}`}>
          {o.name}
        </span>
      </td>

      {/* Status Column */}
      <td className={`${middleTdClass} text-center`}>
        <div className="inline-flex justify-center items-center w-full">
          <StatusPill status={o.status} />
        </div>
      </td>

      {/* Phone Column */}
      <td className={`${middleTdClass} text-center`}>
        {o.phone ? (
          <div className="inline-flex items-center justify-center gap-2 text-xs font-bold text-slate-655 w-full">
            <span>{o.phone}</span>
            <button
              onClick={(e) => handleCopy(e, o.phone!)}
              className="p-1 hover:bg-slate-205/50 rounded-md transition-colors cursor-pointer text-slate-400 hover:text-slate-700 border-0 bg-transparent flex items-center justify-center shrink-0"
              title="Copy phone"
            >
              <img src={CopyIcon} alt="Copy" className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Dash />
        )}
      </td>

      {/* Suburb Column */}
      <td className={`${middleTdClass} text-center text-xs font-bold text-slate-655`}>
        {o.suburb ? (
          <span>{o.suburb}</span>
        ) : (
          <Dash />
        )}
      </td>

      {/* Account Manager Column */}
      <td className={`${middleTdClass} text-center text-xs font-bold`}>
        {(() => {
          const name = accountManagerName(o.accountManager);
          if (name) return <span className="text-slate-750">{name}</span>;
          if (o.accountManager) return <span className="text-slate-750 font-bold">Assigned</span>;
          return (
            <span className="inline-flex items-center gap-1.5 text-slate-400 justify-center w-full">
              <span className="text-xs">Unassigned</span>
            </span>
          );
        })()}
      </td>

      {/* PUM Column */}
      <td className={`${middleTdClass} text-center text-xs font-extrabold text-slate-750`}>
        {o.pum ?? <Dash />}
      </td>

      {/* IAT Column */}
      <td className={`${middleTdClass} text-center text-xs font-bold`}>
        {o.inactivityAlert && o.inactivityAlert !== "none" ? (
          <span
            className={
              o.inactivityAlert === "ai"
                ? "font-extrabold text-blue-600"
                : "text-slate-655"
            }
          >
            {o.inactivityAlert === "ai" ? "AI Alert" : `${o.inactivityAlert} days`}
          </span>
        ) : (
          <Dash />
        )}
      </td>

      {/* Actions Column */}
      <td 
        className={lastTdClass}
        onClick={(e) => e.stopPropagation()}
      >
        <Popover open={actionsOpen} onOpenChange={setActionsOpen}>
          <PopoverTrigger asChild>
            <button className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-655 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center mx-auto">
              <img src={DotsThreeIcon} alt="Actions" className="h-4.5 w-4.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-32 p-1.5 bg-white border border-slate-202 shadow-lg rounded-2xl" align="end">
            <div className="flex flex-col gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActionsOpen(false);
                  if (o.email) {
                    navigator.clipboard.writeText(o.email);
                    toast.success(`Copied email "${o.email}" to clipboard`);
                  } else {
                    toast.error("No email address available for this office");
                  }
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-left text-slate-655 hover:bg-slate-50 transition-colors cursor-pointer border-0 bg-transparent"
              >
                <img src={EnvelopeSimpleIcon} alt="Email" className="h-3.5 w-3.5" />
                <span>Email</span>
              </button>

              {isArchived ? (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    setActionsOpen(false);
                    try {
                      await updateOffice.mutateAsync({
                        id: o.id,
                        patch: { status: "Active" },
                      });
                      toast.success(`Unarchived office "${o.name}"`);
                    } catch (err) {
                      toast.error("Failed to unarchive office");
                    }
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-left text-slate-655 hover:bg-slate-50 transition-colors cursor-pointer border-0 bg-transparent"
                >
                  <img src={ArchiveIcon} alt="Unarchive" className="h-3.5 w-3.5" />
                  <span>Unarchive</span>
                </button>
              ) : (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    setActionsOpen(false);
                    try {
                      await updateOffice.mutateAsync({
                        id: o.id,
                        patch: { status: "Archived" as any },
                      });
                      toast.success(`Archived office "${o.name}"`);
                    } catch (err) {
                      toast.error("Failed to archive office");
                    }
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-left text-slate-655 hover:bg-slate-50 transition-colors cursor-pointer border-0 bg-transparent"
                >
                  <img src={ArchiveIcon} alt="Archive" className="h-3.5 w-3.5" />
                  <span>Archive</span>
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </td>
    </tr>
  );
}

function HeaderBtn({ icon: Icon, children, onClick }: { icon: any; children: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-xs">
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
  return <span className="text-slate-350 font-bold">—</span>;
}

interface ImportFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ImportFileDialog({ open, onOpenChange }: ImportFileDialogProps) {
  // Preset default mockup state as shown in figma
  const [file, setFile] = useState<{ name: string; size: string } | null>({
    name: "Sles Marketing.pdf",
    size: "5.6 MB",
  });
  
  const [fileName, setFileName] = useState("Seles Marketing");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    const sizeInMB = (selectedFile.size / (1024 * 1024)).toFixed(1);
    
    // Check file size constraint: 10 MB
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 10 MB.");
      return;
    }

    // Supported formats: pdf, doc, txt
    const allowedExtensions = ["pdf", "doc", "docx", "txt"];
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      toast.error("Unsupported file format. Please upload pdf, doc, or txt.");
      return;
    }

    setFile({
      name: selectedFile.name,
      size: `${sizeInMB} MB`,
    });

    // Extract base name without extension
    const baseName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf(".")) || selectedFile.name;
    setFileName(baseName);
    toast.success(`Selected file: ${selectedFile.name}`);
  };

  const handleChooseFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearFile = () => {
    setFile(null);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadSubmit = () => {
    if (!file) {
      toast.error("Please choose a file to upload.");
      return;
    }
    if (!fileName.trim()) {
      toast.error("Please enter a file name.");
      return;
    }

    setIsUploading(true);
    // Simulate premium upload action
    setTimeout(() => {
      setIsUploading(false);
      toast.success(`Successfully uploaded "${fileName}"!`);
      onOpenChange(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] rounded-3xl border border-slate-100 bg-white p-6 shadow-xl overflow-hidden focus-visible:outline-none">
        {/* Title */}
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Import File</h2>
        </div>

        {/* Drag and Drop Container */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 transition-all ${
            isDragging 
              ? "border-[#dd5437] bg-[#dd5437]/5" 
              : "border-[#dd5437]/40 hover:border-[#dd5437]/70 bg-white"
          }`}
          style={{ borderColor: "#dd5437", borderStyle: "dashed" }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
          />

          {/* Circular Upload Icon */}
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dd5437]/10 text-[#dd5437] transition-transform hover:scale-105 duration-200">
            <Upload className="h-6 w-6 stroke-[2.5]" />
          </div>

          <p className="text-center text-xs font-semibold text-slate-500">
            Drag and drop file here of{" "}
            <span
              onClick={handleChooseFileClick}
              className="text-[#dd5437] font-bold underline cursor-pointer hover:text-[#c9452b] transition-colors"
            >
              Choose File
            </span>
          </p>
        </div>

        {/* Support specifications row */}
        <div className="mt-2.5 flex items-center justify-between text-[10px] font-bold tracking-wide uppercase text-slate-400">
          <span>Supported format: pdf, doc, txt</span>
          <span>Maximum size: 10 MB</span>
        </div>

        {/* Active Upload Card */}
        {file && (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:shadow-2xs">
            <div className="flex items-center gap-3">
              {/* peach circle and document icon */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/50 bg-[#dd5437]/10 text-[#dd5437]">
                <FileText className="h-5 w-5 stroke-[2]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                  {file.name}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {file.size}
                </span>
              </div>
            </div>
            
            {/* Close button to clear */}
            <button
              onClick={handleClearFile}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200/40 hover:text-slate-700 transition-colors cursor-pointer border-0 bg-transparent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* File Name input field */}
        {file && (
          <div className="mt-4 text-left">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              File Name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name"
              className="w-full rounded-xl border border-slate-200/80 bg-white py-2.5 px-4 text-xs font-semibold text-slate-700 outline-none focus:border-[#dd5437] focus:ring-2 focus:ring-[#dd5437]/20 transition-all placeholder:text-slate-400 shadow-3xs"
            />
          </div>
        )}

        {/* Actions Button Footer */}
        <div className="mt-6 flex gap-3.5">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-extrabold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-3xs border-0 text-center"
          >
            Cancel
          </button>
          
          <button
            onClick={handleUploadSubmit}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#dd5437] hover:bg-[#c9452b] py-3 text-xs font-extrabold text-white shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AddLocationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AddLocationSheet({ open, onOpenChange }: AddLocationSheetProps) {
  const createOffice = useCreateOffice();
  const usersQuery = useUsers({ limit: 200 });
  const users = usersQuery.data?.items ?? [];

  const [form, setForm] = useState({
    name: "",
    additionalContact: "",
    tradingName: "",
    legalEntityName: "",
    abn: "",
    zone: "",
    accountManager: "",
    openedAt: "",
    address: "",
    suburb: "",
    state: "",
    postcode: "",
    principalLicense: "",
    hopm: "",
    accountsPayable: "",
    platform: "",
    pum: 0,
    estimatedMonthlySpend: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (key: keyof typeof form, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Agency Name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createOffice.mutateAsync({
        name: form.name,
        tradingName: form.tradingName || undefined,
        legalEntityName: form.legalEntityName || undefined,
        abn: form.abn || undefined,
        zone: form.zone || undefined,
        accountManager: form.accountManager || undefined,
        openedAt: form.openedAt || undefined,
        address: form.address || undefined,
        suburb: form.suburb || undefined,
        state: form.state || undefined,
        postcode: form.postcode || undefined,
        platform: form.platform || undefined,
        pum: Number(form.pum) || 0,
        estimatedMonthlySpend: Number(form.estimatedMonthlySpend) || undefined,
        status: "Active",
      });
      
      onOpenChange(false);
      // Reset form
      setForm({
        name: "",
        additionalContact: "",
        tradingName: "",
        legalEntityName: "",
        abn: "",
        zone: "",
        accountManager: "",
        openedAt: "",
        address: "",
        suburb: "",
        state: "",
        postcode: "",
        principalLicense: "",
        hopm: "",
        accountsPayable: "",
        platform: "",
        pum: 0,
        estimatedMonthlySpend: "",
      });
    } catch (err) {
      // Error toast already handled by showError in useCreateOffice
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelCls = "block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5";
  const inputCls = "w-full rounded-xl border border-slate-200 bg-white py-2 px-3.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#dd5437] focus:ring-2 focus:ring-[#dd5437]/20 transition-all placeholder:text-slate-400";
  const selectCls = "w-full rounded-xl border border-slate-200 bg-white py-2 px-3.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#dd5437] focus:ring-2 focus:ring-[#dd5437]/20 transition-all cursor-pointer appearance-none";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-[480px] overflow-hidden bg-white border-l border-slate-100 shadow-xl focus-visible:outline-none">
        {/* Header */}
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="text-xl font-bold text-slate-800 tracking-tight">Add Location</SheetTitle>
        </SheetHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Business Details */}
          <div className="space-y-4 text-left">
            <h3 className="text-sm font-black text-slate-800 tracking-wide border-b border-slate-100 pb-1">Business Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Agency Name</label>
                <input
                  type="text"
                  placeholder="Write here"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Additional Contact</label>
                <input
                  type="text"
                  placeholder="Write here"
                  value={form.additionalContact}
                  onChange={(e) => updateField("additionalContact", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Inactivity Alert */}
          <div className="space-y-4 text-left">
            <h3 className="text-sm font-black text-slate-800 tracking-wide border-b border-slate-100 pb-1 font-bold">Inactivity Alert</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Trading Name</label>
                <input
                  type="text"
                  placeholder="Write Here"
                  value={form.tradingName}
                  onChange={(e) => updateField("tradingName", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Legal Entity Name</label>
                <input
                  type="text"
                  placeholder="Write Here"
                  value={form.legalEntityName}
                  onChange={(e) => updateField("legalEntityName", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>ABN</label>
                <input
                  type="text"
                  placeholder="Write Here"
                  value={form.abn}
                  onChange={(e) => updateField("abn", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Zone</label>
                <input
                  type="text"
                  placeholder="Write Here"
                  value={form.zone}
                  onChange={(e) => updateField("zone", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Account Manager</label>
                <div className="relative">
                  <select
                    value={form.accountManager}
                    onChange={(e) => updateField("accountManager", e.target.value)}
                    className={selectCls}
                  >
                    <option value="">None</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Opened Date</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="dd/mm/yy"
                    value={form.openedAt}
                    onChange={(e) => updateField("openedAt", e.target.value)}
                    className={inputCls}
                  />
                  <Calendar className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Office Address</label>
              <input
                type="text"
                placeholder="Write Here"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Suburb</label>
                <input
                  type="text"
                  placeholder="Write Here"
                  value={form.suburb}
                  onChange={(e) => updateField("suburb", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <input
                  type="text"
                  placeholder="Write Here"
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Post Code</label>
                <input
                  type="text"
                  placeholder="Write Here"
                  value={form.postcode}
                  onChange={(e) => updateField("postcode", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Key Contact & Metrics */}
          <div className="space-y-4 text-left">
            <h3 className="text-sm font-black text-slate-800 tracking-wide border-b border-slate-100 pb-1">Key Contact & Metrics</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Principal / License</label>
                <div className="relative">
                  <select
                    value={form.principalLicense}
                    onChange={(e) => updateField("principalLicense", e.target.value)}
                    className={selectCls}
                  >
                    <option value="">None</option>
                    <option value="assigned">Assigned</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Head of Property Mangement</label>
                <div className="relative">
                  <select
                    value={form.hopm}
                    onChange={(e) => updateField("hopm", e.target.value)}
                    className={selectCls}
                  >
                    <option value="">None</option>
                    <option value="assigned">Assigned</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Accounts Payable Contact</label>
                <div className="relative">
                  <select
                    value={form.accountsPayable}
                    onChange={(e) => updateField("accountsPayable", e.target.value)}
                    className={selectCls}
                  >
                    <option value="">None</option>
                    <option value="assigned">Assigned</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Platform & System</label>
                <input
                  type="text"
                  placeholder="Write Here"
                  value={form.platform}
                  onChange={(e) => updateField("platform", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Total Properties</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.pum}
                  onChange={(e) => updateField("pum", Number(e.target.value))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Est. Monthly Spend</label>
                <input
                  type="text"
                  placeholder="Write Here"
                  value={form.estimatedMonthlySpend}
                  onChange={(e) => updateField("estimatedMonthlySpend", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 px-6 bg-slate-50/50 flex gap-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-extrabold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-3xs border-0 text-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || createOffice.isPending}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#dd5437] hover:bg-[#c9452b] py-3 text-xs font-extrabold text-white shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0"
          >
            {isSubmitting || createOffice.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Property Manager"
            )}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
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

function CustomizeWidgetsSheet({ open, onOpenChange, activeWidgets, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeWidgets: Record<string, boolean>;
  onSave: (widgets: Record<string, boolean>) => void;
}) {
  const [localWidgets, setLocalWidgets] = useState<Record<string, boolean>>(activeWidgets);

  useEffect(() => {
    if (open) {
      setLocalWidgets(activeWidgets);
    }
  }, [open, activeWidgets]);

  const activeCount = Object.values(localWidgets).filter(Boolean).length;

  const handleToggle = (opt: string, checked: boolean) => {
    if (checked && activeCount >= 5) {
      return;
    }
    setLocalWidgets(prev => ({
      ...prev,
      [opt]: checked
    }));
  };

  const handleReset = () => {
    setLocalWidgets({
      "Total Offices": true,
      "Active Offices": true,
      "Lapsing Offices": true,
      "Inactive Offices": true,
      "Unassigned Offices": true,
      "Archived Offices": false,
    });
    toast.success("Reset widgets to default");
  };

  const handleSave = () => {
    onSave(localWidgets);
    toast.success("Customized widgets saved successfully");
    onOpenChange(false);
  };

  const WIDGET_OPTIONS = [
    "Total Offices",
    "Active Offices",
    "Lapsing Offices",
    "Inactive Offices",
    "Unassigned Offices",
    "Archived Offices"
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-[480px] overflow-hidden bg-white border-l border-slate-100 shadow-xl focus-visible:outline-none">
        {/* Header */}
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="text-xl font-bold text-slate-800 tracking-tight">Customize Widgets</SheetTitle>
        </SheetHeader>

        {/* Scrollable List Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide">
            <span>Active Widgets ({activeCount}/5)</span>
          </div>

          {/* Warning Banner when at capacity */}
          {activeCount === 5 && (
            <div className="rounded-xl border border-orange-100 bg-[#fff8f6] p-3.5 text-[11px] font-semibold text-[#c9452b] text-left leading-normal animate-in fade-in-50 duration-200">
              You have reached the maximum limit. Turn off a widget to enable another.
            </div>
          )}

          {/* Widgets List */}
          <div className="rounded-2xl border border-slate-100 bg-white p-3 space-y-1">
            {WIDGET_OPTIONS.map((opt) => {
              const isChecked = !!localWidgets[opt];
              const isMaxReached = activeCount === 5;
              const isDisabled = !isChecked && isMaxReached;

              return (
                <div 
                  key={opt}
                  className={`flex items-center justify-between py-3 px-2 border-b border-slate-50 last:border-0 transition-all duration-200 ${
                    isDisabled ? "opacity-40" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-slate-300 cursor-grab shrink-0" />
                    <span className="text-xs font-bold text-slate-700/90">{opt}</span>
                  </div>
                  <Switch
                    checked={isChecked}
                    disabled={isDisabled}
                    onCheckedChange={(checked) => handleToggle(opt, checked)}
                    className="data-[state=checked]:bg-[#dd5437]"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 px-6 bg-slate-50/50 flex gap-4">
          <button
            onClick={handleReset}
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-extrabold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-3xs border-0 text-center"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#dd5437] hover:bg-[#c9452b] py-3 text-xs font-extrabold text-white shadow-md active:scale-[0.98] transition-all cursor-pointer border-0"
          >
            Save
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MaxChatSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [messages, setMessages] = useState<{ id: string; sender: "user" | "max"; text: string; timestamp?: string }[]>([
    {
      id: "1",
      sender: "max",
      text: "3. Andrew Webset - Regional Manager\n\nIf there's anything else you need, feel free to ask!",
    },
    {
      id: "2",
      sender: "user",
      text: "how many properties do they manage?",
    },
    {
      id: "3",
      sender: "max",
      text: "Jackson Rowe manages a total of **600 properties**. If you need more information or have any other questions, feel free to ask!",
      timestamp: "05:36",
    },
    {
      id: "4",
      sender: "user",
      text: "how many century 21 offices do we work for?",
    },
    {
      id: "5",
      sender: "max",
      text: "You are currently working with **1 Century 21 office**, which is:\n\n• **Century 21 Specialist Realty** located in Hurstville, NSW.\n\nIf you need more details or have further questions, feel free to ask!",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) {
      setTimeout(scrollToBottom, 100);
    }
  }, [open, messages, isTyping]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    const newMsg = {
      id: String(Date.now()),
      sender: "user" as const,
      text: userText,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      setIsTyping(false);
      let replyText = "I'm looking into that for you. Let me know if there's any other details you need!";
      
      const normalized = userText.toLowerCase();
      if (normalized.includes("belle")) {
        replyText = "You are currently working with **3 Belle Property offices**, which are:\n\n• **Belle Property Parramatta**\n• **Belle Property Ryde**\n• **Belle Property Castle Hill**\n\nIf you need more details or have further questions, feel free to ask!";
      } else if (normalized.includes("properties") || normalized.includes("manage")) {
        replyText = "Our active portfolio offices manage a total of **1,840 properties** across Sydney. You can review specific PM metrics inside the Stats cards or Listing overview.";
      } else if (normalized.includes("century 21")) {
        replyText = "We work with **1 Century 21 office** currently: Century 21 Specialist Realty in Hurstville. Let me know if you need to assign new account managers to them!";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: "max" as const,
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        },
      ]);
    }, 1500);
  };

  // Helper to parse bold markers "**text**" into HTML strong tags
  const renderMessageContent = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} className="font-extrabold text-slate-950">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-[440px] overflow-hidden bg-[#f8fafc] border-l border-slate-100 shadow-2xl focus-visible:outline-none h-full [&>button]:hidden">
        {/* Header */}
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#fdf2f0] text-[#dd5437] rounded-full flex items-center justify-center font-bold text-base border border-orange-100/50 shadow-3xs">
              M
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-black text-slate-800 tracking-tight leading-none">Max</span>
              <span className="text-[10px] font-bold text-[#dd5437] mt-1 uppercase tracking-wider leading-none">Assistant</span>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full border border-orange-200/60 p-1 bg-white text-orange-700 hover:bg-orange-50/50 cursor-pointer shadow-3xs flex items-center justify-center transition-colors"
            style={{ width: "24px", height: "24px" }}
          >
            <X className="h-3.5 w-3.5 stroke-[2.5px]" />
          </button>
        </div>

        {/* Message List Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#f8fafc]">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            if (isUser) {
              return (
                <div key={msg.id} className="flex justify-end items-start gap-2.5 animate-in fade-in-50 duration-200">
                  <div className="bg-[#dd5437] text-white px-5 py-3 rounded-3xl rounded-tr-xs text-xs font-bold leading-relaxed shadow-xs max-w-[75%] break-words text-left">
                    {msg.text}
                  </div>
                  <div className="h-8 w-8 rounded-full bg-[#f1f5f9] text-slate-500 font-black text-xs flex items-center justify-center border border-slate-200/50 uppercase tracking-wide shrink-0 shadow-3xs">
                    j
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className="flex justify-start items-start gap-2.5 animate-in fade-in-50 duration-200">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
                  alt="Max Avatar"
                  className="h-8 w-8 rounded-full object-cover border border-blue-200/80 shadow-3xs shrink-0"
                />
                <div className="flex flex-col text-left max-w-[78%]">
                  <div className="text-xs text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap">
                    {renderMessageContent(msg.text)}
                  </div>
                  {msg.timestamp && (
                    <span className="text-[10px] text-slate-400 mt-1 pl-1 font-semibold">
                      {msg.timestamp}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start items-start gap-2.5 animate-in fade-in-50 duration-200">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
                alt="Max Avatar"
                className="h-8 w-8 rounded-full object-cover border border-blue-200/80 shadow-3xs shrink-0 animate-pulse"
              />
              <div className="flex items-center gap-1 bg-slate-100/80 px-4 py-2.5 rounded-2xl rounded-tl-xs">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce duration-1000" />
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce duration-1000 delay-150" />
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce duration-1000 delay-300" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="border-t border-slate-100 bg-white p-3.5 flex items-center gap-2.5 shadow-md shrink-0">
          <div className="flex-1 bg-slate-100/50 hover:bg-slate-100/80 focus-within:bg-slate-100/80 focus-within:ring-1.5 focus-within:ring-[#dd5437]/20 rounded-xl px-4 py-2 flex items-center gap-2 transition-all">
            <input
              type="text"
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none text-xs text-slate-700 font-semibold placeholder:text-slate-400"
            />
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => toast.info("Attachments are not enabled in this sandbox")}
              className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center shrink-0"
              title="Attach File"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => toast.info("Voice recognition triggered")}
              className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center shrink-0"
              title="Voice Message"
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              type="submit"
              className="p-2.5 bg-[#dd5437] hover:bg-[#c9452b] rounded-full text-white transition-all shadow-xs hover:shadow-sm flex items-center justify-center shrink-0 cursor-pointer border-0"
              title="Send Message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
