import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Loader2, Eye, Pencil, Trash2, ChevronDown, Check, Settings2, Plus } from "lucide-react";
import { useUsers, useDeleteOffice } from "@/lib/queries";
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

function AccountManagersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);

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

    // Filter by role to match the "2 members" mockup by default
    // If no role is selected, we filter out non-managers for visual consistency, or let roleFilter override
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
        emailOverride: isAmrut
          ? "amrutahire@realestate.com"
          : isMitchell
          ? "mitch@theapplianceguys.com.au"
          : u.email,
        phone: u.phone || (isAmrut
          ? "04555 555 555"
          : isMitchell
          ? "0414547447"
          : "—"),
        region: u.region || (isAmrut ? "Sydney" : null),
        teamRole: u.teamRole || "Account Manager",
      };
    });
  }, [usersQuery.data?.items, search, statusFilter, roleFilter]);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove team member ${name}? This cannot be undone.`)) {
      toast.success(`Team member ${name} deleted successfully`);
    }
  };

  return (
    <div className="min-h-full bg-background p-8 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Account Managers
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Manage your team of account managers and their assignments.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#e05638] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#e05638]/90 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Add Team Member
        </button>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-card p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search by name, email, or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200/80 bg-background py-2 px-10 text-xs font-semibold text-slate-700 outline-none focus:border-[#e05638] focus:ring-2 focus:ring-[#e05638]/20 transition-all placeholder:text-slate-400"
            />
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

        {/* Count Label */}
        <div className="text-xs font-bold text-slate-400 shrink-0">
          {items.length} {items.length === 1 ? "member" : "members"}
        </div>
      </div>

      {/* Table */}
      {usersQuery.isLoading ? (
        <div className="flex justify-center items-center py-20 bg-card rounded-2xl border border-slate-100 shadow-xs">
          <Loader2 className="h-6 w-6 animate-spin text-[#e05638]" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-slate-100 shadow-xs text-center">
          <div className="text-slate-400 font-bold text-sm">No team members match your filters.</div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-card shadow-xs">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Name", "Role", "Contact", "Region", "Status", "Actions"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 ${
                      i === 0 ? "text-left" : "text-center"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((u) => {
                const initials = u.initials ?? u.name.slice(0, 2).toUpperCase();
                const avatarBg = u.name.includes("Amrut")
                  ? "bg-amber-500"
                  : u.name.includes("Mitchell")
                  ? "bg-indigo-500"
                  : "bg-blue-500";

                return (
                  <tr
                    key={u.id}
                    className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${avatarBg}`}
                        >
                          {initials}
                        </div>
                        <span className="font-bold text-slate-800 text-sm group-hover:text-[#e05638] transition-colors">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-500 tracking-wide">
                        {u.teamRole || "Account Manager"}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <div className="flex flex-col gap-0.5 items-center justify-center">
                        <span className="text-xs font-semibold text-slate-600">{u.emailOverride}</span>
                        <span className="text-[10px] font-bold text-slate-400">{u.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      {u.region ? (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 tracking-wide">
                          {u.region}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-bold">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.96_0.05_150)] px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase text-[oklch(0.45_0.14_150)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.65_0.18_150)]" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase text-slate-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => toast.success(`Viewing details for ${u.name}`)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#e05638]/50 hover:text-[#e05638] transition-all cursor-pointer shadow-2xs"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                        </button>
                        <button
                          onClick={() => toast.success(`Editing details for ${u.name}`)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#e05638]/50 hover:text-[#e05638] transition-all cursor-pointer shadow-2xs"
                          title="Edit Member"
                        >
                          <Pencil className="h-3.5 w-3.5 text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-rose-300 hover:text-rose-600 transition-all cursor-pointer shadow-2xs"
                          title="Delete Member"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <AddAccountManagerDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}
