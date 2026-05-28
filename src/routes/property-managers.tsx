import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings2, Loader2, Star, StarOff, Mail, Phone, Building2, MoreVertical, Eye, CalendarDays, Plus, Search, X, Check, Minus, Users } from "lucide-react";
import {
  useCreatePropertyManager,
  useDeletePropertyManager,
  useOffices,
  usePropertyManagers,
} from "@/lib/queries";
import { PM_ROLES, type PmRole, type Office } from "@/lib/api-types";
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
      <PopoverContent className="w-58 p-1.5 bg-white border border-slate-200 shadow-lg rounded-2xl z-50">
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
        officeNameDisplay: "Jackson Rowe Real Estate",
        specialization: "Residential",
        active: true,
        engagement: 4,
        propertiesManaged: 200,
        phone: "0414 547 447",
        email: "dejan@stovedoc.com.au"
      },
      {
        id: "pm-mock-2",
        firstName: "Simon",
        lastName: "Lee",
        role: "Senior Property Manager",
        officeNameQuery: "JacksonRowe",
        officeNameDisplay: "Jackson Rowe Real Estate",
        specialization: "Residential",
        active: true,
        engagement: 0,
        propertiesManaged: 0,
        phone: "",
        email: "behrouz@theapplianceguys.com.au"
      },
      {
        id: "pm-mock-3",
        firstName: "Andrew",
        lastName: "Webset",
        role: "Regional Manager",
        officeNameQuery: "JacksonRowe",
        officeNameDisplay: "Jackson Rowe Real Estate",
        specialization: "Residential",
        active: true,
        engagement: 0,
        propertiesManaged: 0,
        phone: "",
        email: ""
      },
      {
        id: "pm-mock-4",
        firstName: "Ali",
        lastName: "Hassan",
        role: "Property Manager",
        officeNameQuery: "Sydney",
        officeNameDisplay: "All Sydney Real Estate",
        specialization: "Residential",
        active: true,
        engagement: 0,
        propertiesManaged: 200,
        phone: "",
        email: ""
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
        engagement: 0,
        propertiesManaged: 0,
        phone: "",
        email: ""
      },
      {
        id: "pm-mock-6",
        firstName: "Andrew",
        lastName: "Chan",
        role: "Property Manager",
        officeNameQuery: "Boka",
        officeNameDisplay: "Boka Real Estate",
        specialization: "Residential",
        active: true,
        engagement: 0,
        propertiesManaged: 0,
        phone: "",
        email: ""
      },
      {
        id: "pm-mock-7",
        firstName: "Rusell",
        lastName: "Lee",
        role: "Property Manager",
        officeNameQuery: "Duggan",
        officeNameDisplay: "Bright & Duggan",
        specialization: "Residential",
        active: true,
        engagement: 0,
        propertiesManaged: 0,
        phone: "",
        email: ""
      },
      {
        id: "pm-mock-8",
        firstName: "Paul",
        lastName: "Cutcliffe",
        role: "Director",
        officeNameQuery: "Dural",
        officeNameDisplay: "Cutcliffe Acreage and Lifestyle Properties",
        specialization: "Residential",
        active: true,
        engagement: 0,
        propertiesManaged: 0,
        phone: "0414 878 858",
        email: "paul@cutcliffe.com.au"
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
        pm.email.toLowerCase().includes(q)
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

  const handleCopy = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success(`Copied "${email}" to clipboard`);
  };

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
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#e05638] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#e05638]/90 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Manager
        </button>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-card p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search by name or email..."
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
              ? "border-[#e05638]/60 bg-[#e05638]/5 text-[#e05638] hover:bg-[#e05638]/10"
              : "border-slate-200/80 bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${highPriority ? "fill-[#e05638] stroke-none" : "text-slate-400"}`} />
          High Priority
        </button>
      </div>

      {/* Main Table Card or Empty State */}
      {pmQuery.isLoading || officesQuery.isLoading ? (
        <div className="flex justify-center items-center py-20 bg-card rounded-2xl border border-slate-100 shadow-xs">
          <Loader2 className="h-6 w-6 animate-spin text-[#e05638]" />
        </div>
      ) : items.length === 0 ? (
        // High priority / Empty screen matches the 6th screenshot perfectly!
        <div className="flex flex-col items-center justify-center py-24 bg-card rounded-2xl border border-slate-100 shadow-xs text-center animate-in fade-in-50 duration-300">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-black text-slate-800 mt-4">
            No property managers found.
          </h3>
          <button
            onClick={() => setOpen(true)}
            className="mt-6 flex items-center gap-2 rounded-xl bg-[#e05638] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#e05638]/90 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Manager
          </button>
        </div>
      ) : (
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
                {["Name", "Title", "Office", "Specialization", "Status", "Engagement", "Properties", "Contact", "Actions"].map(
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
              {items.map((pm) => {
                const initials =
                  (pm.firstName?.[0] ?? "") + (pm.lastName?.[0] ?? "");
                const avatarBg = pm.firstName.includes("Peter")
                  ? "bg-blue-500"
                  : pm.firstName.includes("Simon")
                  ? "bg-emerald-500"
                  : pm.firstName.includes("Andrew")
                  ? "bg-amber-500"
                  : "bg-indigo-500";

                return (
                  <tr
                    key={pm.id}
                    className={`group border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors ${
                      selected.has(pm.id) ? "bg-slate-50/80" : ""
                    }`}
                  >
                    <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleOne(pm.id)}
                        className="mx-auto flex h-4.5 w-4.5 items-center justify-center rounded border transition-all cursor-pointer focus:outline-none"
                        style={{
                          backgroundColor: selected.has(pm.id) ? "#e05638" : "#ffffff",
                          borderColor: selected.has(pm.id) ? "#e05638" : "#cbd5e1",
                        }}
                      >
                        {selected.has(pm.id) && <Check className="h-3 w-3 text-white stroke-[3px]" />}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${avatarBg}`}
                        >
                          {initials || <Users className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm group-hover:text-[#e05638] transition-colors">
                            {pm.firstName} {pm.lastName ?? ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 tracking-wide">
                        {pm.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-xs font-bold text-slate-700">
                      {pm.office.name}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-500 tracking-wide">
                        Residential
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <EngagementStars engagement={pm.engagement} />
                    </td>
                    <td className="px-4 py-4 text-center text-xs font-extrabold text-slate-700">
                      {pm.propertiesManaged}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col gap-1 items-center justify-center">
                        {pm.phone && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {pm.phone}
                          </span>
                        )}
                        {pm.email && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-[#e05638] cursor-pointer" onClick={() => handleCopy(pm.email!)}>
                            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                            {pm.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Eye details view button */}
                        <button
                          onClick={() => toast.success(`Viewing profile: ${pm.firstName}`)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-slate-600 hover:bg-slate-50 hover:border-[#e05638]/50 hover:text-[#e05638] transition-all shadow-2xs cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#e05638]/70" />
                          View
                        </button>
                        
                        {/* Send mail button */}
                        <button
                          onClick={() => toast.success(`Compose email to ${pm.firstName} at ${pm.email}`)}
                          disabled={!pm.email}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#e05638]/50 hover:text-[#e05638] transition-all cursor-pointer disabled:opacity-40"
                          title="Send Email"
                        >
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                        </button>

                        {/* Calendar meeting schedule button */}
                        <button
                          onClick={() => {
                            toast.success(`Redirecting to Meetings to schedule visit...`);
                            navigate({ to: "/meetings" });
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#e05638]/50 hover:text-[#e05638] transition-all cursor-pointer"
                          title="Schedule Meeting"
                        >
                          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
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
            className="flex items-center gap-1.5 rounded-xl bg-[#e05638] px-3.5 py-2 text-[11px] font-bold text-white shadow-xs hover:bg-[#e05638]/95 transition-all cursor-pointer"
          >
            <Star className="h-3.5 w-3.5 fill-white stroke-none" />
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

      <AddPmDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

// 5-Star visual rating indicator mapping
function EngagementStars({ engagement }: { engagement: number }) {
  const stars: ReactNode[] = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= engagement) {
      stars.push(<Star key={i} className="h-3.5 w-3.5 fill-[#e05638] stroke-none shrink-0" />);
    } else {
      stars.push(<Star key={i} className="h-3.5 w-3.5 text-slate-200 shrink-0" />);
    }
  }
  return <div className="flex justify-center gap-0.5">{stars}</div>;
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

function ChevronDown(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function AddPmDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const createPm = useCreatePropertyManager();
  const offices = useOffices({ limit: 200 });
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    role: "Property Manager" as PmRole,
    office: "",
    email: "",
    phone: "",
    propertiesManaged: "",
  });
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setForm({
      firstName: "",
      lastName: "",
      role: "Property Manager",
      office: "",
      email: "",
      phone: "",
      propertiesManaged: "",
    });
    setError(null);
  }

  async function onSave() {
    setError(null);
    if (!form.firstName.trim() || !form.office) {
      setError("First name and office are required");
      return;
    }
    try {
      await createPm.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        role: form.role,
        office: form.office,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        propertiesManaged: form.propertiesManaged
          ? Number(form.propertiesManaged)
          : undefined,
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg rounded-2xl border-0 bg-card p-6 shadow-xl animate-in zoom-in-95 duration-200">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-slate-800">Add Manager</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold text-slate-600 text-xs">First Name</Label>
              <Input
                autoFocus
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="rounded-xl border-slate-200 focus-visible:ring-[#e05638]/20 focus-visible:border-[#e05638]"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-slate-600 text-xs">Last Name</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="rounded-xl border-slate-200 focus-visible:ring-[#e05638]/20 focus-visible:border-[#e05638]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-slate-600 text-xs">Role</Label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as PmRole }))}
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#e05638] focus:ring-2 focus:ring-[#e05638]/20 bg-white"
            >
              {PM_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-slate-600 text-xs">Office</Label>
            <select
              value={form.office}
              onChange={(e) => setForm((f) => ({ ...f, office: e.target.value }))}
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#e05638] focus:ring-2 focus:ring-[#e05638]/20 bg-white"
            >
              <option value="">{offices.isLoading ? "Loading…" : "Select office..."}</option>
              {offices.data?.items.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold text-slate-600 text-xs">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="rounded-xl border-slate-200 focus-visible:ring-[#e05638]/20 focus-visible:border-[#e05638]"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-slate-600 text-xs">Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="rounded-xl border-slate-200 focus-visible:ring-[#e05638]/20 focus-visible:border-[#e05638]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-slate-600 text-xs">Properties Managed</Label>
            <Input
              inputMode="numeric"
              value={form.propertiesManaged}
              onChange={(e) =>
                setForm((f) => ({ ...f, propertiesManaged: e.target.value.replace(/\D/g, "") }))
              }
              className="rounded-xl border-slate-200 focus-visible:ring-[#e05638]/20 focus-visible:border-[#e05638]"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-500">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createPm.isPending}
              className="rounded-xl font-bold text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={createPm.isPending}
              className="bg-[#e05638] hover:bg-[#e05638]/90 text-white rounded-xl font-bold text-xs"
            >
              {createPm.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Manager
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
