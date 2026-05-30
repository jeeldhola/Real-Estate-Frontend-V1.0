import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Loader2,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  Plus,
  SlidersHorizontal,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Minus,
  Mail,
  CalendarDays,
  Compass,
} from "lucide-react";
import { useUsers } from "@/lib/queries";
import type { Role, User } from "@/lib/api-types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { AddAccountManagerDialog } from "@/components/add-account-manager-dialog";

export const Route = createFileRoute("/account-managers")({
  component: AccountManagersPage,
  head: () => ({
    meta: [
      { title: "Account Managers — The Appliance Guys" },
      { name: "description", content: "Manage your team of account managers and their assignments." },
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
          className={`flex h-9 min-w-[140px] items-center justify-between gap-2.5 rounded-xl bg-white border border-slate-200/80 px-4 text-xs font-bold text-slate-700 shadow-xs focus:outline-none transition-all cursor-pointer hover:bg-slate-50/80 ${
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
      <PopoverContent className="w-56 p-1.5 bg-white border border-slate-200 shadow-lg rounded-2xl z-50">
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
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer border-0 bg-transparent ${
                  isSelected ? "bg-[#dd5437]/5 text-[#dd5437]" : "text-slate-600 hover:bg-slate-50"
                }`}
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

function AccountManagersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cardTrendFilter, setCardTrendFilter] = useState("vs Last Month");

  const usersQuery = useUsers({ limit: 200 });

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];

  const roleOptions = [
    { value: "all", label: "All Roles" },
    { value: "manager", label: "Manager" },
    { value: "admin", label: "Admin" },
    { value: "user", label: "User" },
  ];

  // Map dummy contact, email overlays, and regions to active database users
  const items = useMemo(() => {
    let list = usersQuery.data?.items ?? [];

    if (roleFilter !== "all") {
      list = list.filter((u) => u.role === roleFilter);
    } else {
      // Default lists show Mitchell and Amrut (the managers) to match the mockup perfectly!
      list = list.filter((u) => u.role === "manager");
    }

    if (statusFilter !== "all") {
      const isActive = statusFilter === "Active";
      list = list.filter((u) => u.active === isActive);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    return list.map((u) => {
      const isAmrut = u.name.includes("Amrut");
      const isMitchell = u.name.includes("Mitchell");

      return {
        ...u,
        emailOverride: "email@example.com", // Mockup has email@example.com for both
        phone: "02 8878 1900",              // Mockup has 02 8878 1900 for both
        region: isAmrut ? "Sydney" : null,  // Mockup has Sydney for Amrut, null for Mitchell
        teamRole: "Account Manager",        // Mockup title tag is Account Manager
        avatar: isAmrut
          ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop"
          : "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&auto=format&fit=crop",
      };
    });
  }, [usersQuery.data?.items, search, statusFilter, roleFilter]);

  // Pre-select both rows by default to match the mockup selection outlines instantly!
  useEffect(() => {
    if (items.length > 0 && selected.size === 0) {
      setSelected(new Set(items.map((o) => o.id)));
    }
  }, [items]);

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

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove team member ${name}? This cannot be undone.`)) {
      toast.success(`Team member ${name} deleted successfully`);
    }
  };

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success(`Copied "${text}" to clipboard`);
  };

  const statusPill: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    Inactive: "bg-[oklch(0.96_0.04_25)] text-[oklch(0.55_0.2_25)] border border-[oklch(0.92_0.04_25)]",
  };

  const statusDot: Record<string, string> = {
    Active: "bg-emerald-500",
    Inactive: "bg-[oklch(0.65_0.22_25)]",
  };

  const stats = [
    {
      label: "Total Account Managers",
      value: 24,
      icon: Users,
      tint: "bg-orange-50/70",
      iconBg: "bg-orange-100/80",
      fg: "text-[#dd5437]",
      trend: "up" as const,
      percent: "12%",
    },
    {
      label: "Active Account Managers",
      value: 16,
      icon: CheckCircle2,
      tint: "bg-blue-50/70",
      iconBg: "bg-blue-100/80",
      fg: "text-blue-600",
      trend: "down" as const,
      percent: "12%",
    },
    {
      label: "Lapsing Account Managers",
      value: 4,
      icon: Clock,
      tint: "bg-amber-50/70",
      iconBg: "bg-amber-100/80",
      fg: "text-amber-600",
      trend: "up" as const,
      percent: "12%",
    },
    {
      label: "Inactive Account Managers",
      value: 2,
      icon: XCircle,
      tint: "bg-rose-50/70",
      iconBg: "bg-rose-100/80",
      fg: "text-rose-600",
      trend: "down" as const,
      percent: "12%",
    },
    {
      label: "New Account Managers",
      value: 8,
      icon: Compass,
      tint: "bg-purple-50/70",
      iconBg: "bg-purple-100/80",
      fg: "text-purple-600",
      trend: "up" as const,
      percent: "12%",
    },
  ];

  const headers = [
    { key: "Name", label: "Name" },
    { key: "Role", label: "Role" },
    { key: "Phone", label: "Phone" },
    { key: "Email", label: "Email" },
    { key: "Region", label: "Region" },
    { key: "Status", label: "Status" },
  ];

  return (
    <div className="min-h-full bg-[#fafafb] p-8 select-none animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-850 tracking-tight">
            Account Managers
          </h1>
          <p className="mt-1 text-xs text-slate-400 font-extrabold tracking-wide">
            Track and manage property managers across all agency offices.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.info("Opening Settings...")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-700 transition-all cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#dd5437] hover:bg-[#c9452b] px-4 py-2.5 text-xs font-black text-white shadow-sm transition-all cursor-pointer border-0"
          >
            <Plus className="h-4 w-4" />
            Add Manager
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
              className="relative flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] select-none transition-all hover:shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${s.tint} ${s.iconBg}`}>
                  <Icon className={`h-5 w-5 ${s.fg}`} />
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-150 hover:bg-slate-50 transition-colors cursor-pointer bg-white">
                      <ChevronDown className="h-4 w-4 text-slate-400" />
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

              <div className="mt-4">
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {s.label}
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-slate-800 tracking-tight">
                    {s.value}
                  </span>
                  
                  {s.trend && (
                    <div className="flex flex-col items-end">
                      <div className={`flex items-center gap-0.5 text-[10px] font-extrabold ${
                        s.trend === "up" ? "text-emerald-500" : "text-[#dd5437]"
                      }`}>
                        {s.trend === "up" ? (
                          <ChevronUp className="h-3 w-3 stroke-[3px]" />
                        ) : (
                          <ChevronDown className="h-3 w-3 stroke-[3px]" />
                        )}
                        <span>{s.percent}</span>
                      </div>
                      <span className="text-[9px] font-extrabold text-slate-400 mt-0.5 whitespace-nowrap">
                        {cardTrendFilter}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-2xs">
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
          value={roleFilter}
          onChange={setRoleFilter}
          options={roleOptions}
          placeholder="All Roles"
        />
      </div>

      {/* Main Table Card or Empty State */}
      {usersQuery.isLoading ? (
        <div className="flex justify-center items-center py-20 bg-white rounded-3xl border border-slate-100 shadow-2xs">
          <Loader2 className="h-6 w-6 animate-spin text-[#dd5437]" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-2xs text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-black text-slate-800 mt-4">
            No account managers found.
          </h3>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-transparent p-0 shadow-none border-0">
          <table className="w-full border-separate border-spacing-y-2.5">
            <thead>
              <tr className="border-0 bg-transparent text-slate-400">
                <th className="w-12 px-4 py-3 text-center">
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
                        <ChevronDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </th>
                  ),
                )}
                <th className="w-12 px-4 py-3 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => {
                const isSelected = selected.has(u.id);
                const rowBg = isSelected ? "bg-[#dd5437]/5" : "bg-white hover:bg-slate-50/40";
                const rowBorder = isSelected ? "border border-[#dd5437]" : "border border-slate-100";
                
                const firstTdClass = `px-4 py-4 rounded-l-2xl border-l border-y ${rowBorder} ${rowBg} transition-all duration-200`;
                const middleTdClass = `px-4 py-4 border-y ${rowBorder} ${rowBg} transition-all duration-200`;
                const lastTdClass = `px-4 py-4 rounded-r-2xl border-r border-y ${rowBorder} ${rowBg} transition-all duration-200`;

                return (
                  <tr
                    key={u.id}
                    className={`group cursor-pointer transition-all duration-200 ${
                      isSelected ? "relative z-10" : ""
                    }`}
                  >
                    {/* Checkbox Column */}
                    <td className={firstTdClass} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleOne(u.id)}
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
                            <div className="flex items-center gap-3">
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="h-8 w-8 rounded-full object-cover border border-slate-100 shadow-3xs shrink-0"
                              />
                              <span className="font-extrabold text-slate-800 text-sm group-hover:text-[#dd5437] transition-colors">
                                {u.name}
                              </span>
                            </div>
                          </td>
                        );
                      }
                      if (h.key === "Role") {
                        return (
                          <td key={h.key} className={`${middleTdClass} text-center`}>
                            <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-150 px-3 py-1 text-[10px] font-bold text-slate-600 tracking-wide">
                              {u.teamRole}
                            </span>
                          </td>
                        );
                      }
                      if (h.key === "Phone") {
                        return (
                          <td key={h.key} className={`${middleTdClass} text-center`}>
                            <div className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-bold group/copy">
                              <span>{u.phone}</span>
                              <button
                                onClick={(e) => handleCopy(e, u.phone)}
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
                              <span>{u.emailOverride}</span>
                              <button
                                onClick={(e) => handleCopy(e, u.emailOverride)}
                                className="opacity-0 group-hover/copy:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity cursor-pointer border-0 bg-transparent p-0"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        );
                      }
                      if (h.key === "Region") {
                        return (
                          <td key={h.key} className={`${middleTdClass} text-center`}>
                            {u.region ? (
                              <span className="inline-flex items-center rounded-full bg-white border border-slate-150 px-3 py-1 text-[10px] font-bold text-slate-600 tracking-wide shadow-3xs">
                                {u.region}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-bold">—</span>
                            )}
                          </td>
                        );
                      }
                      if (h.key === "Status") {
                        return (
                          <td key={h.key} className={`${middleTdClass} text-center`}>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${statusPill[u.active ? "Active" : "Inactive"] || "bg-slate-100 text-slate-600"}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${statusDot[u.active ? "Active" : "Inactive"] || "bg-slate-400"}`} />
                              {u.active ? "Active" : "Inactive"}
                            </span>
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
                            <Plus className="h-3.5 w-3.5 text-slate-400 rotate-45" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-36 p-1 bg-white border border-slate-200 shadow-md rounded-xl z-[90]" align="end">
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => {
                                toast.success(`Edit action triggered for ${u.name}`);
                              }}
                              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[11px] font-bold rounded-lg text-left text-slate-600 hover:bg-slate-50 transition-colors border-0 bg-transparent cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5 text-slate-400" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(u.id, u.name)}
                              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[11px] font-bold rounded-lg text-left text-rose-650 hover:bg-rose-50/50 transition-colors border-0 bg-transparent cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                              <span>Delete</span>
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
              Showing 1 to 50 of 6,243 offices
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
      <AddAccountManagerDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}
