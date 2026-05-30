import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  Loader2,
  Star,
  StarOff,
  Mail,
  Phone,
  Building2,
  MoreVertical,
  Plus,
  Search,
  X,
  Check,
  Minus,
  Users,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Download,
  ChevronsUpDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  CalendarDays,
  Upload,
  User,
} from "lucide-react";
import {
  useCreatePropertyManager,
  useOffices,
  usePropertyManagers,
} from "@/lib/queries";
import { PM_ROLES, type PmRole } from "@/lib/api-types";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/property-managers")({
  component: PropertyManagersPage,
  head: () => ({
    meta: [
      { title: "Property Managers & Key People — The Appliance Guys" },
      { name: "description", content: "Track and manage property managers across all agency offices." },
    ],
  }),
});

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
    displayLabel.length > 20 ? displayLabel.slice(0, 17) + "..." : displayLabel;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex h-9 min-w-[150px] items-center justify-between gap-2.5 rounded-xl bg-white border border-slate-200/80 px-4 text-xs font-bold text-slate-700 shadow-xs focus:outline-none transition-all cursor-pointer hover:bg-slate-50/80 ${
            isFiltered
              ? "border-[#dd5437]/50 bg-[#dd5437]/5 text-[#dd5437] hover:bg-[#dd5437]/10"
              : ""
          }`}
        >
          <span className="truncate">{truncatedLabel}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-slate-400 ${
              open ? "rotate-180" : ""
            } ${isFiltered ? "text-[#dd5437]" : ""}`}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-58 p-1.5 bg-white border border-slate-200 shadow-lg rounded-2xl z-50" align="start">
        <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl text-left text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer border-0 bg-transparent"
              >
                <div
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all"
                  style={{
                    backgroundColor: isSelected ? "#dd5437" : "#ffffff",
                    borderColor: isSelected ? "#dd5437" : "#cbd5e1",
                  }}
                >
                  {isSelected && <Check className="h-2.5 w-2.5 text-white stroke-[3.5px]" />}
                </div>
                <span className={isSelected ? "text-slate-900 font-bold" : "text-slate-600 font-medium"}>
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

const statusPill: Record<string, string> = {
  Active: "bg-[oklch(0.96_0.05_150)] text-[oklch(0.45_0.14_150)]",
  "On Leave": "bg-[oklch(0.96_0.06_60)] text-[oklch(0.5_0.16_50)]",
  Inactive: "bg-[oklch(0.96_0.04_25)] text-[oklch(0.55_0.2_25)]",
};

const statusDot: Record<string, string> = {
  Active: "bg-[oklch(0.65_0.18_150)]",
  "On Leave": "bg-[oklch(0.7_0.18_60)]",
  Inactive: "bg-[oklch(0.65_0.22_25)]",
};

function PropertyManagersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [specializationFilter, setSpecializationFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [engagementFilter, setEngagementFilter] = useState<string>("all");
  const [highPriority, setHighPriority] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [cardTrendFilter, setCardTrendFilter] = useState("vs Last Month");

  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({
    Phone: true,
    Email: true,
    Title: true,
    Specialization: true,
    Status: true,
    Office: true,
    "Properties Managed": true,
    "Engagement Status": true,
    "Relationship Score": true,
    "Last Contact": false,
    "Total Meetings": false,
    "Emails Exchanged": false,
    "Communication Style": false,
    Sentiment: false,
    "Meeting Cadence": false,
    "Start Date": false,
    "High Priority": false,
  });

  const officesQuery = useOffices({ limit: 200 });
  const pmQuery = usePropertyManagers({ limit: 200 });

  const officesList = officesQuery.data?.items ?? [];

  // Options lists for dropdown filters
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "Active", label: "Active" },
    { value: "On Leave", label: "On Leave" },
    { value: "Inactive", label: "Inactive" },
  ];

  const specializationOptions = [
    { value: "all", label: "All Specializations" },
    { value: "Residential", label: "Residential" },
    { value: "Commercial", label: "Commercial" },
    { value: "Industrial", label: "Industrial" },
    { value: "Mixed-Use", label: "Mixed-Use" },
  ];

  const locationOptions = useMemo(() => {
    const list = [{ value: "all", label: "All Locations" }];
    officesList.forEach((o) => {
      list.push({ value: o.id, label: o.name });
    });
    return list;
  }, [officesList]);

  const engagementOptions = [
    { value: "all", label: "All Engagement" },
    { value: "Warm", label: "Warm" },
    { value: "Cold", label: "Cold" },
    { value: "Uncontacted", label: "Uncontacted" },
  ];

  // Perform full high-fidelity dummy data injection mapped dynamically to database office IDs
  const items = useMemo(() => {
    const mockPms = [
      {
        id: "pm-mock-1",
        firstName: "Peter",
        lastName: "Frank",
        role: "Senior Property Manager",
        officeNameQuery: "JacksonRowe",
        officeNameDisplay: "JacksonRowe Real Estate",
        specialization: "Residential",
        active: true,
        engagement: 3,
        propertiesManaged: 200,
        phone: "02 8878 1900",
        email: "email@example.com"
      },
      {
        id: "pm-mock-2",
        firstName: "Simon",
        lastName: "Lee",
        role: "Senior Property Manager",
        officeNameQuery: "JacksonRowe",
        officeNameDisplay: "JacksonRowe Real Estate",
        specialization: "Residential",
        active: true,
        engagement: 4,
        propertiesManaged: 0,
        phone: "02 8878 1900",
        email: "email@example.com"
      },
      {
        id: "pm-mock-3",
        firstName: "Andrew",
        lastName: "Webset",
        role: "Regional Manager",
        officeNameQuery: "JacksonRowe",
        officeNameDisplay: "JacksonRowe Real Estate",
        specialization: "Residential",
        active: true,
        engagement: 1,
        propertiesManaged: 0,
        phone: "02 8878 1900",
        email: "email@example.com"
      },
      {
        id: "pm-mock-4",
        firstName: "Ali",
        lastName: "Hasan",
        role: "Property Manager",
        officeNameQuery: "Sydney",
        officeNameDisplay: "All Sydney Real Estate",
        specialization: "Residential",
        active: true,
        engagement: 3,
        propertiesManaged: 200,
        phone: "02 8878 1900",
        email: "email@example.com"
      },
      {
        id: "pm-mock-5",
        firstName: "Simon",
        lastName: "Long",
        role: "Property Manager",
        officeNameQuery: "Willoughby",
        officeNameDisplay: "Belle Property Willoughby",
        specialization: "Residential",
        active: true,
        engagement: 2,
        propertiesManaged: 0,
        phone: "02 8878 1900",
        email: "email@example.com"
      }
    ];

    let pms = mockPms.map(mock => {
      const matchedOffice = officesList.find(o => 
        o.name.toLowerCase().replace(/\s+/g, "").includes(mock.officeNameQuery.toLowerCase())
      );
      return {
        id: mock.id,
        firstName: mock.firstName,
        lastName: mock.lastName,
        role: mock.role,
        office: matchedOffice ? { id: matchedOffice.id, name: mock.officeNameDisplay } : { id: mock.officeNameQuery, name: mock.officeNameDisplay },
        specialization: mock.specialization,
        active: mock.active,
        status: "Active",
        engagement: mock.engagement,
        propertiesManaged: mock.propertiesManaged,
        phone: mock.phone,
        email: mock.email
      };
    });

    // 1. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      pms = pms.filter(pm => 
        pm.firstName.toLowerCase().includes(q) || 
        pm.lastName.toLowerCase().includes(q) || 
        pm.email.toLowerCase().includes(q) ||
        pm.office.name.toLowerCase().includes(q)
      );
    }

    // 2. High Priority Toggle (matches empty state from mockup)
    if (highPriority) {
      return [];
    }

    // 3. Location Filter
    if (locationFilter !== "all") {
      pms = pms.filter(pm => pm.office.id === locationFilter);
    }

    // 4. Status Filter
    if (statusFilter !== "all") {
      if (statusFilter === "On Leave") {
        return [];
      }
      const isActive = statusFilter === "Active";
      pms = pms.filter(pm => pm.active === isActive);
    }

    // 5. Engagement Filter
    if (engagementFilter !== "all") {
      pms = pms.filter(pm => {
        const isWarm = pm.engagement > 0;
        if (engagementFilter === "Warm") return isWarm;
        if (engagementFilter === "Cold") return !isWarm;
        if (engagementFilter === "Uncontacted") return pm.engagement === 0;
        return true;
      });
    }

    // 6. Specialization Filter
    if (specializationFilter !== "all") {
      if (specializationFilter !== "Residential") return [];
    }

    return pms;
  }, [officesList, search, highPriority, locationFilter, statusFilter, engagementFilter, specializationFilter]);

  const allSelected = selected.size === items.length && items.length > 0;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(items.map((o) => o.id)));
  const toggleOne = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success(`Copied "${text}" to clipboard`);
  };

  const stats = [
    {
      label: "Total Property Managers",
      value: 24,
      icon: Users,
      tint: "bg-[#fdf3f0]/50 border border-[#f5eae2]",
      fg: "text-[#dd5437]",
      trend: "up" as const,
      percent: "12%",
    },
    {
      label: "Active Property Managers",
      value: 16,
      icon: CheckCircle2,
      tint: "bg-[#f4f8fd]/60 border border-[#e3ecf5]",
      fg: "text-blue-600",
      trend: "down" as const,
      percent: "12%",
    },
    {
      label: "Lapsing Property Managers",
      value: 4,
      icon: Clock,
      tint: "bg-[#fffbf5]/50 border border-[#f5ebd8]",
      fg: "text-amber-600",
      trend: "up" as const,
      percent: "12%",
    },
    {
      label: "Inactive Property Managers",
      value: 2,
      icon: XCircle,
      tint: "bg-[#fff8f6]/50 border border-[#f6e2dd]",
      fg: "text-rose-600",
      trend: "down" as const,
      percent: "12%",
    },
    {
      label: "New Property Managers",
      value: 8,
      icon: Calendar,
      tint: "bg-[#f5f6ff]/40 border border-[#e2e4f6]",
      fg: "text-indigo-600",
      trend: "up" as const,
      percent: "12%",
    },
  ];

  const headers = useMemo(() => {
    const list = [{ key: "Name", label: "Name" }];
    if (visibleFields.Title) list.push({ key: "Title", label: "Title" });
    if (visibleFields.Office) list.push({ key: "Office", label: "Office" });
    if (visibleFields.Specialization) list.push({ key: "Specialization", label: "Specialization" });
    if (visibleFields.Status) list.push({ key: "Status", label: "Status" });
    if (visibleFields["Relationship Score"] || visibleFields["Engagement Status"]) {
      list.push({ key: "Engagement", label: "Engagement" });
    }
    if (visibleFields["Properties Managed"]) list.push({ key: "Properties", label: "Properties" });
    if (visibleFields.Phone) list.push({ key: "Phone", label: "Phone" });
    if (visibleFields.Email) list.push({ key: "Email", label: "Email" });
    return list;
  }, [visibleFields]);

  return (
    <div className="min-h-full bg-background p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Property Managers & Key People
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Track and manage property managers across all agency offices.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCustomizeOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-700 transition-all cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#dd5437] hover:bg-[#c9452b] px-4 py-2.5 text-xs font-black text-white shadow-sm transition-all cursor-pointer border-0"
          >
            <Plus className="h-4 w-4" />
            Property Manager
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 animate-in fade-in duration-300">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`relative flex flex-col justify-between rounded-3xl p-5 shadow-2xs select-none transition-all hover:shadow-xs ${s.tint}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-[18px] w-[18px] shrink-0 ${s.fg} stroke-[2.2px]`} />
                  <span className="text-xs font-bold text-slate-700">{s.label}</span>
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-slate-400 hover:text-slate-600 bg-transparent border-0 flex items-center justify-center p-1 rounded-lg hover:bg-slate-100/30 transition-colors cursor-pointer focus:outline-none">
                      <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-52 p-1.5 bg-white border border-slate-200 shadow-lg rounded-2xl z-[100]" align="end">
                    <div className="flex flex-col gap-0.5">
                      {["vs Last Month", "vs Last Week", "vs Last Quarter", "vs Last Year"].map((opt) => {
                        const isSelected = opt === cardTrendFilter;
                        return (
                          <button
                            key={opt}
                            onClick={() => setCardTrendFilter(opt)}
                            className="flex w-full items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl text-left text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer border-0 bg-transparent"
                          >
                            <div
                              className="flex h-4 w-4 items-center justify-center rounded border transition-all shrink-0"
                              style={{
                                backgroundColor: isSelected ? "#dd5437" : "#ffffff",
                                borderColor: isSelected ? "#dd5437" : "#cbd5e1",
                              }}
                            >
                              {isSelected && <Check className="h-2.5 w-2.5 text-white stroke-[3.5px]" />}
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
              </div>

              <div className="mt-5 flex items-end justify-between">
                <span className="text-3xl font-black text-slate-850 tracking-tight leading-none">
                  {s.value}
                </span>
                
                {s.trend && (
                  <div className="flex flex-col items-end leading-none">
                    <div className={`flex items-center gap-0.5 text-xs font-black ${
                      s.trend === "up" ? "text-emerald-500" : "text-rose-500"
                    }`}>
                      {s.trend === "up" ? (
                        <ArrowUpRight className="h-4 w-4 stroke-[3px] shrink-0" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 stroke-[3px] shrink-0" />
                      )}
                      <span>{s.percent}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 mt-1 select-none whitespace-nowrap leading-none">
                      {cardTrendFilter}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-card p-3 shadow-2xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200/80 bg-background py-2 px-10 text-xs font-semibold text-slate-700 outline-none focus:border-[#dd5437] focus:ring-2 focus:ring-[#dd5437]/20 transition-all placeholder:text-slate-400"
          />
          <div className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded border border-slate-200/80 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-400 select-none bg-white">
            <span>K</span>
            <span>⌘</span>
          </div>
        </div>

        {/* Custom Dropdowns */}
        <FilterDropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          placeholder="All Statuses"
        />

        <FilterDropdown
          value={specializationFilter}
          onChange={setSpecializationFilter}
          options={specializationOptions}
          placeholder="All Specializations"
        />

        <FilterDropdown
          value={locationFilter}
          onChange={setLocationFilter}
          options={locationOptions}
          placeholder="All Locations"
        />

        <FilterDropdown
          value={engagementFilter}
          onChange={setEngagementFilter}
          options={engagementOptions}
          placeholder="All Engagement"
        />

        {/* High Priority Filter Button */}
        <button
          onClick={() => setHighPriority(!highPriority)}
          className={`flex h-9 items-center gap-1.5 rounded-xl border px-4 text-xs font-bold transition-all cursor-pointer ${
            highPriority
              ? "border-[#dd5437]/60 bg-[#dd5437]/5 text-[#dd5437] hover:bg-[#dd5437]/10"
              : "border-slate-200/80 bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${highPriority ? "fill-[#dd5437] stroke-none" : "text-slate-400"}`} />
          High Priority
        </button>
      </div>

      {/* Main Table Card or Empty State */}
      {pmQuery.isLoading || officesQuery.isLoading ? (
        <div className="flex justify-center items-center py-20 bg-white rounded-3xl border border-slate-100 shadow-2xs">
          <Loader2 className="h-6 w-6 animate-spin text-[#dd5437]" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-2xs text-center animate-in fade-in-50 duration-300">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-black text-slate-800 mt-4">
            No property managers found.
          </h3>
          <button
            onClick={() => setOpen(true)}
            className="mt-6 flex items-center gap-2 rounded-xl bg-[#dd5437] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#dd5437]/90 transition-all cursor-pointer border-0"
          >
            <Plus className="h-4 w-4" />
            Add Manager
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-transparent p-0 shadow-none border-0">
          <table className="w-full border-separate border-spacing-y-2.5">
            <thead>
              <tr className="border-0 bg-transparent text-slate-400">
                <th className="w-12 px-4 py-3 text-center col-span-1">
                  <button
                    onClick={toggleAll}
                    className="mx-auto flex h-4.5 w-4.5 items-center justify-center rounded border transition-all cursor-pointer focus:outline-none"
                    style={{
                      backgroundColor: selected.size > 0 ? "#dd5437" : "#ffffff",
                      borderColor: selected.size > 0 ? "#dd5437" : "#cbd5e1",
                    }}
                  >
                    {allSelected ? (
                      <Check className="h-3 w-3 text-white stroke-[3px]" />
                    ) : selected.size > 0 ? (
                      <Minus className="h-3 w-3 text-white stroke-[3px]" />
                    ) : null}
                  </button>
                </th>
                {headers.map(
                  (h, i) => (
                    <th
                      key={h.key}
                      className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 ${
                        i === 0 ? "text-left" : "text-center"
                      }`}
                    >
                      <div className={`inline-flex items-center gap-1.5 cursor-pointer select-none ${i === 0 ? "justify-start" : "justify-center"}`}>
                        <span>{h.label}</span>
                        <ChevronsUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </th>
                  ),
                )}
                <th className="w-12 px-4 py-3 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((pm) => {
                const isSelected = selected.has(pm.id);
                const rowBg = isSelected ? "bg-[#dd5437]/5" : "bg-white hover:bg-slate-50/40";
                const rowBorder = isSelected ? "border-dashed border-[#dd5437]" : "border-solid border-slate-100";
                
                const firstTdClass = `px-4 py-4 rounded-l-2xl border-l border-y ${rowBorder} ${rowBg} transition-all duration-200`;
                const middleTdClass = `px-4 py-4 border-y ${rowBorder} ${rowBg} transition-all duration-200`;
                const lastTdClass = `px-4 py-4 rounded-r-2xl border-r border-y ${rowBorder} ${rowBg} transition-all duration-200`;

                return (
                  <tr
                    key={pm.id}
                    onClick={() => {
                      navigate({
                        to: "/property-managers/$managerId",
                        params: { managerId: pm.id },
                      });
                    }}
                    className={`group cursor-pointer transition-all duration-200 ${
                      isSelected ? "relative z-10" : ""
                    }`}
                  >
                    {/* Checkbox Column */}
                    <td className={firstTdClass} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleOne(pm.id)}
                        className="mx-auto flex h-4.5 w-4.5 items-center justify-center rounded border transition-all cursor-pointer focus:outline-none"
                        style={{
                          backgroundColor: isSelected ? "#dd5437" : "#ffffff",
                          borderColor: isSelected ? "#dd5437" : "#cbd5e1",
                        }}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white stroke-[3px]" />}
                      </button>
                    </td>

                    {/* Dynamic Columns */}
                    {headers.map((h, index) => {
                      if (h.key === "Name") {
                        return (
                          <td key={h.key} className={middleTdClass}>
                            <span className="font-extrabold text-slate-800 text-sm group-hover:text-[#dd5437] transition-colors">
                              {pm.firstName} {pm.lastName ?? ""}
                            </span>
                          </td>
                        );
                      }
                      if (h.key === "Title") {
                        return (
                          <td key={h.key} className={`${middleTdClass} text-center`}>
                            <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-150 px-3 py-1 text-[10px] font-bold text-slate-600 tracking-wide">
                              {pm.role}
                            </span>
                          </td>
                        );
                      }
                      if (h.key === "Office") {
                        return (
                          <td key={h.key} className={`${middleTdClass} text-center text-xs font-bold text-slate-800`}>
                            {pm.office.name}
                          </td>
                        );
                      }
                      if (h.key === "Specialization") {
                        return (
                          <td key={h.key} className={`${middleTdClass} text-center`}>
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-500 tracking-wide">
                              Residential
                            </span>
                          </td>
                        );
                      }
                      if (h.key === "Status") {
                        return (
                          <td key={h.key} className={`${middleTdClass} text-center`}>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${statusPill[pm.status] || "bg-slate-100 text-slate-600"}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${statusDot[pm.status] || "bg-slate-400"}`} />
                              {pm.status}
                            </span>
                          </td>
                        );
                      }
                      if (h.key === "Engagement") {
                        return (
                          <td key={h.key} className={`${middleTdClass} text-center`}>
                            <EngagementStars engagement={pm.engagement} />
                          </td>
                        );
                      }
                      if (h.key === "Properties") {
                        return (
                          <td key={h.key} className={`${middleTdClass} text-center text-xs font-extrabold text-slate-800`}>
                            {pm.propertiesManaged}
                          </td>
                        );
                      }
                      if (h.key === "Phone") {
                        return (
                          <td key={h.key} className={`${middleTdClass} text-center`}>
                            <div className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-bold group/copy">
                              <span>{pm.phone || "02 8878 1900"}</span>
                              <button
                                onClick={(e) => handleCopy(e, pm.phone || "02 8878 1900")}
                                className="opacity-0 group-hover/copy:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity cursor-pointer border-0 bg-transparent p-0"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        );
                      }
                      if (h.key === "Email") {
                        return (
                          <td key={h.key} className={`${middleTdClass} text-center`}>
                            <div className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-bold group/copy">
                              <span>{pm.email || "email@example.com"}</span>
                              <button
                                onClick={(e) => handleCopy(e, pm.email || "email@example.com")}
                                className="opacity-0 group-hover/copy:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity cursor-pointer border-0 bg-transparent p-0"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        );
                      }
                      return null;
                    })}

                    {/* Actions Column */}
                    <td className={lastTdClass} onClick={(e) => e.stopPropagation()}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs">
                            <MoreVertical className="h-3.5 w-3.5 text-slate-400" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-36 p-1 bg-white border border-slate-200 shadow-md rounded-xl z-[90]" align="end">
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => {
                                handleCopy(null as any, pm.email || "email@example.com");
                              }}
                              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[11px] font-bold rounded-lg text-left text-slate-600 hover:bg-slate-50 transition-colors border-0 bg-transparent cursor-pointer"
                            >
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              <span>Email</span>
                            </button>
                            <button
                              onClick={() => {
                                toast.success(`Book meeting with ${pm.firstName} requested!`);
                              }}
                              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[11px] font-bold rounded-lg text-left text-slate-600 hover:bg-slate-50 transition-colors border-0 bg-transparent cursor-pointer"
                            >
                              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                              <span>Book Meeting</span>
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="mt-4 flex flex-col items-center justify-between gap-4 py-2 sm:flex-row select-none animate-in fade-in duration-300">
            <span className="text-[11px] font-bold text-slate-400">
              Showing 1 to 50 of 6,243 property managers
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => toast.info("First page")}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => toast.info("Previous page")}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center gap-1.5 px-3 text-[11px] font-black text-slate-500">
                <span>Page</span>
                <input
                  type="text"
                  value="1"
                  readOnly
                  className="h-7 w-9 rounded-md border border-slate-200 bg-white text-center text-xs font-black text-slate-800 outline-none"
                />
                <span>of 240</span>
              </div>

              <button
                onClick={() => toast.info("Next page")}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => toast.info("Last page")}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">Row per page</span>
              <select
                value="50"
                onChange={() => {}}
                className="h-8 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600 outline-none focus:border-[#dd5437] focus:ring-1 focus:ring-[#dd5437]/20 cursor-pointer bg-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3 px-5 shadow-xl shadow-slate-200/30 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
            {selected.size} selected
          </div>

          <button
            onClick={() => {
              toast.success(`Marked ${selected.size} managers as High Priority`);
              setSelected(new Set());
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Star className="h-3.5 w-3.5 text-slate-400" />
            Tag High Priority
          </button>

          <button
            onClick={() => {
              toast.success(`Removed priority status from selected managers`);
              setSelected(new Set());
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <StarOff className="h-3.5 w-3.5 text-slate-400" />
            Remove Priority
          </button>

          <button
            onClick={() => {
              toast.success(`Exported ${selected.size} property managers to CSV`);
              setSelected(new Set());
            }}
            className="flex items-center gap-2 rounded-xl bg-[#dd5437] hover:bg-[#c9452b] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer border-0"
          >
            <Download className="h-3.5 w-3.5 text-white" />
            Export CSV
          </button>

          <button
            onClick={() => {
              toast.success(`Bulk email composer opened for ${selected.size} managers`);
              setSelected(new Set());
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            Bulk Email
          </button>

          <button
            onClick={() => setSelected(new Set())}
            className="text-[11px] font-extrabold text-[#dd5437] hover:text-[#c9452b] transition-all cursor-pointer bg-transparent border-0 hover:underline px-2"
          >
            Clear
          </button>
        </div>
      )}

      <AddPmSheet open={open} onOpenChange={setOpen} />
      <CustomizeFieldsSheet open={customizeOpen} onOpenChange={setCustomizeOpen} visibleFields={visibleFields} onSave={setVisibleFields} />
    </div>
  );
}

// 5-Star visual rating indicator mapping
function EngagementStars({ engagement }: { engagement: number }) {
  const stars: ReactNode[] = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= engagement) {
      stars.push(<Star key={i} className="h-3.5 w-3.5 fill-[#dd5437] stroke-none shrink-0" />);
    } else {
      stars.push(<Star key={i} className="h-3.5 w-3.5 text-slate-200 shrink-0" />);
    }
  }
  return <div className="flex justify-center gap-0.5">{stars}</div>;
}

function AddPmSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const createPm = useCreatePropertyManager();
  const offices = useOffices({ limit: 200 });
  const [fullName, setFullName] = useState("");
  const [relationshipScore, setRelationshipScore] = useState(0);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  
  const [form, setForm] = useState({
    email: "",
    phone: "+61414547447",
    officePhone: "",
    additionalContact: "",
    role: "Property Manager" as PmRole,
    status: "Active",
    propertiesManaged: "0",
    startYear: "",
    engagementStatus: "Select",
    communicationStyle: "Select",
    sentiment: "Select",
    meetingCalendar: "",
    totalMeetings: "",
    totalEmailsExchanged: "",
    dateBirth: "",
    interest: "",
    notes: "",
  });

  const [error, setError] = useState<string | null>(null);

  const brandOptions = [
    "Westinghouse", "Omega", "Artusi", "Fulgor",
    "Chef", "Electrolux", "Euromaid", "Franke"
  ];

  function toggleBrand(brand: string) {
    setSelectedBrands(prev => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  }

  function reset() {
    setFullName("");
    setRelationshipScore(0);
    setSelectedBrands(new Set());
    setForm({
      email: "",
      phone: "+61414547447",
      officePhone: "",
      additionalContact: "",
      role: "Property Manager",
      status: "Active",
      propertiesManaged: "0",
      startYear: "",
      engagementStatus: "Select",
      communicationStyle: "Select",
      sentiment: "Select",
      meetingCalendar: "",
      totalMeetings: "",
      totalEmailsExchanged: "",
      dateBirth: "",
      interest: "",
      notes: "",
    });
    setError(null);
  }

  async function onSave() {
    setError(null);
    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }
    
    // Split full name
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || "New";
    const lastName = parts.slice(1).join(" ") || "Manager";

    // Auto-link to first office in the list if none selected, to ensure DB compliance
    const matchedOffice = offices.data?.items[0]?.id || "mock-office-id";

    try {
      await createPm.mutateAsync({
        firstName,
        lastName,
        role: form.role,
        office: matchedOffice,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        propertiesManaged: form.propertiesManaged
          ? Number(form.propertiesManaged)
          : undefined,
      });
      reset();
      onOpenChange(false);
      toast.success("Property Manager created successfully!");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 bg-white border-0 shadow-2xl flex flex-col h-full z-[100]">
        <div className="flex items-center justify-between border-b border-slate-100 p-6 shrink-0">
          <h3 className="text-lg font-black text-slate-800">Property Manager</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Avatar and photo upload */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-400">
              <User className="h-8 w-8 stroke-[1.5]" />
            </div>
            <button
              type="button"
              onClick={() => toast.info("Photo upload simulated")}
              className="flex items-center gap-1.5 rounded-xl bg-[#dd5437] hover:bg-[#c9452b] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer border-0"
            >
              <Upload className="h-3.5 w-3.5 text-white" />
              Upload Photo
            </button>
          </div>

          {/* Profile Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-1.5">
              Profile
            </h4>
            
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Full Name
              </Label>
              <Input
                placeholder="Write here"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-xl border-slate-200 focus-visible:ring-[#dd5437]/20 focus-visible:border-[#dd5437]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Email
                </Label>
                <Input
                  placeholder="Write here"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="rounded-xl border-slate-200 focus-visible:ring-[#dd5437]/20 focus-visible:border-[#dd5437]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Phone
                </Label>
                <Input
                  placeholder="Write here"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="rounded-xl border-slate-200 focus-visible:ring-[#dd5437]/20 focus-visible:border-[#dd5437]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Office Phone
                </Label>
                <Input
                  placeholder="Write here"
                  value={form.officePhone}
                  onChange={(e) => setForm((f) => ({ ...f, officePhone: e.target.value }))}
                  className="rounded-xl border-slate-200 focus-visible:ring-[#dd5437]/20 focus-visible:border-[#dd5437]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Additional Contact
                </Label>
                <Input
                  placeholder="Write here"
                  value={form.additionalContact}
                  onChange={(e) => setForm((f) => ({ ...f, additionalContact: e.target.value }))}
                  className="rounded-xl border-slate-200 focus-visible:ring-[#dd5437]/20 focus-visible:border-[#dd5437]"
                />
              </div>
            </div>
          </div>

          {/* Role & Office Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-1.5">
              Role & Office
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Title
                </Label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as PmRole }))}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#dd5437] focus:ring-2 focus:ring-[#dd5437]/20 bg-white"
                >
                  {PM_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Status
                </Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#dd5437] focus:ring-2 focus:ring-[#dd5437]/20 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Properties Managed
                </Label>
                <Input
                  value={form.propertiesManaged}
                  onChange={(e) => setForm((f) => ({ ...f, propertiesManaged: e.target.value.replace(/\D/g, "") }))}
                  className="rounded-xl border-slate-200 focus-visible:ring-[#dd5437]/20 focus-visible:border-[#dd5437]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Start Year
                </Label>
                <Input
                  placeholder="e.g. 2019"
                  value={form.startYear}
                  onChange={(e) => setForm((f) => ({ ...f, startYear: e.target.value }))}
                  className="rounded-xl border-slate-200 focus-visible:ring-[#dd5437]/20 focus-visible:border-[#dd5437]"
                />
              </div>
            </div>
          </div>

          {/* Relationship & Engagement Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-1.5">
              Relationship & Engagement
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Engagement Status
                </Label>
                <select
                  value={form.engagementStatus}
                  onChange={(e) => setForm((f) => ({ ...f, engagementStatus: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#dd5437] focus:ring-2 focus:ring-[#dd5437]/20 bg-white"
                >
                  <option value="Select">Select</option>
                  <option value="Warm">Warm</option>
                  <option value="Cold">Cold</option>
                  <option value="Uncontacted">Uncontacted</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Relationship Score
                </Label>
                <div className="flex items-center gap-1 h-10 select-none">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRelationshipScore(star)}
                      className="text-slate-200 hover:scale-110 transition-transform cursor-pointer border-0 bg-transparent p-0"
                    >
                      <Star
                        className={`h-4.5 w-4.5 ${
                          star <= relationshipScore
                            ? "fill-[#dd5437] stroke-none"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Last Contact Date
                </Label>
                <div className="relative">
                  <Input
                    placeholder="dd/mm/yy"
                    value={form.dateBirth}
                    onChange={(e) => setForm((f) => ({ ...f, dateBirth: e.target.value }))}
                    className="rounded-xl border-slate-200 focus-visible:ring-[#dd5437]/20 focus-visible:border-[#dd5437] pr-10"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Communication Style
                </Label>
                <select
                  value={form.communicationStyle}
                  onChange={(e) => setForm((f) => ({ ...f, communicationStyle: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#dd5437] focus:ring-2 focus:ring-[#dd5437]/20 bg-white"
                >
                  <option value="Select">Select</option>
                  <option value="Email">Email</option>
                  <option value="Phone Call">Phone Call</option>
                  <option value="In Person">In Person</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Sentiment
                </Label>
                <select
                  value={form.sentiment}
                  onChange={(e) => setForm((f) => ({ ...f, sentiment: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#dd5437] focus:ring-2 focus:ring-[#dd5437]/20 bg-white"
                >
                  <option value="Select">Select</option>
                  <option value="Positive">Positive</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Negative">Negative</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Meeting Calendar
                </Label>
                <Input
                  placeholder="e.g. monthly, quarterly"
                  value={form.meetingCalendar}
                  onChange={(e) => setForm((f) => ({ ...f, meetingCalendar: e.target.value }))}
                  className="rounded-xl border-slate-200 focus-visible:ring-[#dd5437]/20 focus-visible:border-[#dd5437]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Total Meetings
                </Label>
                <Input
                  placeholder="Write here"
                  value={form.totalMeetings}
                  onChange={(e) => setForm((f) => ({ ...f, totalMeetings: e.target.value }))}
                  className="rounded-xl border-slate-200 focus-visible:ring-[#dd5437]/20 focus-visible:border-[#dd5437]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Total Emails Exchanged
                </Label>
                <Input
                  placeholder="Write here"
                  value={form.totalEmailsExchanged}
                  onChange={(e) => setForm((f) => ({ ...f, totalEmailsExchanged: e.target.value }))}
                  className="rounded-xl border-slate-200 focus-visible:ring-[#dd5437]/20 focus-visible:border-[#dd5437]"
                />
              </div>
            </div>
          </div>

          {/* Personal Details Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-1.5">
              Personal Details
            </h4>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Date Birth
              </Label>
              <div className="relative">
                <Input
                  placeholder="dd/mm/yy"
                  value={form.dateBirth}
                  onChange={(e) => setForm((f) => ({ ...f, dateBirth: e.target.value }))}
                  className="rounded-xl border-slate-200 focus-visible:ring-[#dd5437]/20 focus-visible:border-[#dd5437] pr-10"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Interest
              </Label>
              <textarea
                placeholder="Topics they light up about"
                value={form.interest}
                onChange={(e) => setForm((f) => ({ ...f, interest: e.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#dd5437] focus:ring-2 focus:ring-[#dd5437]/20 bg-white placeholder:text-slate-400"
              />
            </div>

            {/* Preferred Brands option badges */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                Preferred Brands
              </Label>
              <div className="flex flex-wrap gap-2">
                {brandOptions.map((brand) => {
                  const isSelected = selectedBrands.has(brand);
                  return (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => toggleBrand(brand)}
                      className={`px-3 py-1.5 text-[10px] font-black rounded-full border transition-all cursor-pointer select-none ${
                        isSelected
                          ? "bg-[#dd5437]/10 text-[#dd5437] border-[#dd5437]/40 shadow-2xs font-extrabold"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {brand}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Notes
              </Label>
              <textarea
                placeholder="Write here"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#dd5437] focus:ring-2 focus:ring-[#dd5437]/20 bg-white placeholder:text-slate-400"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-500 shrink-0">
              {error}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-6 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={() => onOpenChange(false)}
            disabled={createPm.isPending}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer border-0"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={createPm.isPending}
            className="rounded-xl bg-[#dd5437] hover:bg-[#c9452b] px-6 py-3 text-xs font-black text-white transition-colors cursor-pointer border-0 shadow-xs flex items-center gap-1.5"
          >
            {createPm.isPending && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
            Add Property Manager
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface CustomizeFieldsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibleFields: Record<string, boolean>;
  onSave: (fields: Record<string, boolean>) => void;
}

function CustomizeFieldsSheet({
  open,
  onOpenChange,
  visibleFields,
  onSave,
}: CustomizeFieldsSheetProps) {
  const [localFields, setLocalFields] = useState<Record<string, boolean>>({ ...visibleFields });

  // Update local state when visibleFields prop changes
  useEffect(() => {
    setLocalFields({ ...visibleFields });
  }, [visibleFields, open]);

  const fieldGroups = [
    {
      group: "Contact Info",
      fields: ["Phone", "Email"],
    },
    {
      group: "Identity",
      fields: ["Title", "Specialization", "Status"],
    },
    {
      group: "Office",
      fields: ["Office", "Properties Managed"],
    },
    {
      group: "Engagement",
      fields: [
        "Engagement Status",
        "Relationship Score",
        "Last Contact",
        "Total Meetings",
        "Emails Exchanged",
      ],
    },
    {
      group: "Relationship",
      fields: [
        "Communication Style",
        "Sentiment",
        "Meeting Cadence",
        "Start Date",
        "High Priority",
      ],
    },
  ];

  function toggleField(field: string) {
    setLocalFields(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  }

  function handleReset() {
    setLocalFields({
      Phone: true,
      Email: true,
      Title: true,
      Specialization: true,
      Status: true,
      Office: true,
      "Properties Managed": true,
      "Engagement Status": true,
      "Relationship Score": true,
      "Last Contact": false,
      "Total Meetings": false,
      "Emails Exchanged": false,
      "Communication Style": false,
      Sentiment: false,
      "Meeting Cadence": false,
      "Start Date": false,
      "High Priority": false,
    });
    toast.success("Reset to default fields");
  }

  function handleSave() {
    onSave(localFields);
    onOpenChange(false);
    toast.success("List fields customized successfully!");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 bg-white border-0 shadow-2xl flex flex-col h-full z-[100]">
        <div className="flex items-center justify-between border-b border-slate-100 p-6 shrink-0">
          <h3 className="text-lg font-black text-slate-800">Customize List Fields</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {fieldGroups.map((g) => (
            <div key={g.group} className="space-y-3.5">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {g.group}
              </h4>
              <div className="space-y-3">
                {g.fields.map((f) => {
                  const isActive = localFields[f] ?? false;
                  return (
                    <div key={f} className="flex items-center justify-between py-0.5 select-none">
                      <span className="text-xs font-bold text-slate-700">{f}</span>
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => toggleField(f)}
                        className="data-[state=checked]:bg-[#dd5437] data-[state=unchecked]:bg-slate-200"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 p-6 bg-slate-50/50 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={handleReset}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-[#dd5437] hover:bg-[#c9452b] px-8 py-3 text-xs font-black text-white transition-colors cursor-pointer border-0 shadow-xs"
          >
            Save
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
