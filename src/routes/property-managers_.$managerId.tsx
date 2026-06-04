import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  X,
  Check,
  Star,
  Mail,
  Phone,
  Building2,
  Calendar,
  Briefcase,
  Tag,
  Hash,
  ExternalLink,
  ChevronLeft,
  Copy,
  Archive,
  Trash2,
  Pencil,
  FileText,
  MessageSquare,
  Clock,
  Heart,
  Users,
  Linkedin,
  ThumbsUp,
  Contact,
  User,
  Sparkles,
  CalendarDays,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { type PmRole } from "@/lib/api-types";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/property-managers_/$managerId")({
  component: PropertyManagerDetailsPage,
});

type TabType = "Overview" | "Meetings" | "Notes";

const PM_ROLES = ["Property Manager", "Senior Property Manager", "Regional Manager", "Director"];

function PropertyManagerDetailsPage() {
  const { managerId } = Route.useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("Overview");
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  // Shared mockup database mapping to managerId
  const pmDb = useMemo(() => {
    return [
      {
        id: "pm-mock-1",
        firstName: "Peter",
        lastName: "Frank",
        fullName: "Peter Frank",
        role: "Senior Property Manager" as PmRole,
        officeName: "Jackson Rowe Real Estate",
        phone: "0414 547 33 447",
        email: "dejan@stonedoc.com.au",
        dob: "20 Dec 1985",
        startDate: "29 Jan 2026",
        specialization: "Residential",
        propertiesManaged: "200",
        engagement: 4,
        brands: ["Westinghouse", "Omega"],
        status: "Active",
        avatar: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=256&auto=format&fit=crop",
      },
      {
        id: "pm-mock-2",
        firstName: "Simon",
        lastName: "Lee",
        fullName: "Simon Lee",
        role: "Senior Property Manager" as PmRole,
        officeName: "Jackson Rowe Real Estate",
        phone: "02 8878 1900",
        email: "behrouz@theapplianceguys.com.au",
        dob: "10 May 1990",
        startDate: "15 Jan 2025",
        specialization: "Residential",
        propertiesManaged: "0",
        engagement: 4,
        brands: ["Westinghouse", "Omega"],
        status: "Active",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop",
      },
      {
        id: "pm-mock-3",
        firstName: "Andrew",
        lastName: "Webset",
        fullName: "Andrew Webset",
        role: "Regional Manager" as PmRole,
        officeName: "Jackson Rowe Real Estate",
        phone: "02 8878 1900",
        email: "andrew@example.com",
        dob: "14 Aug 1988",
        startDate: "10 Mar 2024",
        specialization: "Residential",
        propertiesManaged: "0",
        engagement: 1,
        brands: [],
        status: "Active",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&auto=format&fit=crop",
      },
      {
        id: "pm-mock-4",
        firstName: "Ali",
        lastName: "Hasan",
        fullName: "Ali Hasan",
        role: "Property Manager" as PmRole,
        officeName: "All Sydney Real Estate",
        phone: "02 8878 1900",
        email: "ali@example.com",
        dob: "22 Feb 1992",
        startDate: "05 Nov 2023",
        specialization: "Residential",
        propertiesManaged: "200",
        engagement: 3,
        brands: ["Westinghouse"],
        status: "Active",
        avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=256&auto=format&fit=crop",
      },
      {
        id: "pm-mock-5",
        firstName: "Simon",
        lastName: "Long",
        fullName: "Simon Long",
        role: "Property Manager" as PmRole,
        officeName: "Belle Property Willoughby",
        phone: "02 8878 1900",
        email: "simon.long@example.com",
        dob: "30 Oct 1987",
        startDate: "12 Sep 2022",
        specialization: "Residential",
        propertiesManaged: "0",
        engagement: 2,
        brands: ["Franke", "Euromaid"],
        status: "Active",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&auto=format&fit=crop",
      }
    ];
  }, []);

  // Find initial details dynamically matching managerId
  const initialPm = useMemo(() => {
    return pmDb.find(x => x.id === managerId) || pmDb[0];
  }, [pmDb, managerId]);

  // Track page-level property manager details in state so they are interactive/editable
  const [pm, setPm] = useState(initialPm);

  // Sync state whenever the managerId changes
  useEffect(() => {
    setPm(initialPm);
  }, [initialPm]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied "${text}" to clipboard`);
  };

  const handleBack = () => {
    navigate({ to: "/property-managers" });
  };

  const handleSaveEdits = (updatedPm: typeof pm) => {
    setPm(updatedPm);
    toast.success("Property Manager details updated successfully!");
    setEditSheetOpen(false);
  };

  const statusPill: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    "On Leave": "bg-[oklch(0.96_0.06_60)] text-[oklch(0.5_0.16_50)] border border-[oklch(0.92_0.06_60)]",
    Inactive: "bg-[oklch(0.96_0.04_25)] text-[oklch(0.55_0.2_25)] border border-[oklch(0.92_0.04_25)]",
  };

  const statusDot: Record<string, string> = {
    Active: "bg-emerald-500",
    "On Leave": "bg-[oklch(0.7_0.18_60)]",
    Inactive: "bg-[oklch(0.65_0.22_25)]",
  };

  // Dynamic details field item rendering helper - Bare minimal design to match mockup
  const FieldItem = ({
    label,
    value,
    icon: Icon,
    isLink = false,
    href = "#",
  }: {
    label: string;
    value: string;
    icon: any;
    isLink?: boolean;
    href?: string;
  }) => (
    <div className="flex items-start gap-3 py-3.5 border-b border-slate-100 last:border-0 min-h-[52px]">
      <div className="flex shrink-0 items-center justify-center text-slate-400 w-4 h-4 mt-1.5">
        <Icon className="h-4 w-4 stroke-[1.8px]" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">
          {label}
        </span>
        {isLink ? (
          <a
            href={href}
            onClick={(e) => {
              if (href === "#") {
                e.preventDefault();
                toast.success(`Simulating external navigation: ${value}`);
              }
            }}
            className="inline-flex items-center gap-0.5 text-xs font-bold text-[#dd5437] hover:underline cursor-pointer transition-colors"
          >
            <span className="truncate">{value}</span>
            <ExternalLink className="h-3 w-3 stroke-[2.2px] shrink-0 text-[#dd5437]" />
          </a>
        ) : (
          <span className="block text-xs font-bold text-slate-700 truncate" title={value}>
            {value}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-[#fafafb] p-8 select-none">
      {/* Header Row */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleBack}
            className="inline-flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-0 bg-transparent p-1 -ml-2"
            title="Back to Property Managers"
          >
            <ChevronLeft className="h-5 w-5 stroke-[2.5px]" />
          </button>
          
          <h1 className="text-xl font-bold tracking-tight text-slate-800 -ml-1">
            {pm.fullName}
          </h1>

          <button
            onClick={() => handleCopy(pm.fullName)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer border-0 bg-transparent transition-colors p-0.5"
            title="Copy Name"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>

          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">
            #2001
          </span>

          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold ${statusPill[pm.status]}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusDot[pm.status]}`} />
            {pm.status}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.success("Manager archived")}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
          >
            <Archive className="h-3.5 w-3.5 text-slate-400" />
            Archive Manager
          </button>
          
          <button
            onClick={() => toast.error("Manager deletion simulated")}
            className="flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50/50 shadow-2xs transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
            Delete Manager
          </button>
        </div>
      </div>

      {/* Tabs and Edit Row */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-slate-100/60 p-1 border border-[#1F1F1F]/4">
          {(["Overview", "Meetings", "Notes"] as TabType[]).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-md px-5 py-2 text-xs font-black transition-all cursor-pointer border-0 ${
                  isSelected
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 bg-transparent"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setEditSheetOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-700 transition-colors cursor-pointer shadow-2xs"
          title="Edit Details"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      {/* Primary Tab Content */}
      {activeTab === "Overview" ? (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Personal Contact Left Card */}
            <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="mb-6 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-[#dd5437]">
                  <Contact className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-black text-slate-800">Personal Contact</h3>
              </div>

              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="shrink-0 flex justify-center">
                  {/* Premium circular headshot avatar from mockup */}
                  <img
                    src={pm.avatar}
                    alt={pm.fullName}
                    className="h-20 w-20 rounded-full object-cover border-2 border-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] bg-slate-50"
                  />
                </div>

                {/* Left & Right columns in one grid, grouped by divs for perfect last:border-0 support */}
                <div className="grid flex-1 grid-cols-1 gap-x-8 sm:grid-cols-2">
                  <div className="flex flex-col">
                    <FieldItem label="ID Number" value="#11001" icon={Hash} />
                    <FieldItem label="Title" value={pm.role} icon={Briefcase} />
                    <FieldItem label="Phone number" value={pm.phone} icon={Phone} />
                    <FieldItem label="Official Profile" value="View Profile" icon={ExternalLink} isLink />
                    <FieldItem label="Start Date" value={pm.startDate} icon={Calendar} />
                  </div>
                  <div className="flex flex-col">
                    <FieldItem label="Fullname" value={pm.fullName} icon={Tag} />
                    <FieldItem label="Email" value={pm.email} icon={Mail} />
                    <FieldItem label="LinkedIn Profile" value="View Profile" icon={Linkedin} isLink />
                    <FieldItem label="Office" value={pm.officeName} icon={Building2} isLink />
                    <FieldItem label="Date of Birth" value={pm.dob} icon={Calendar} />
                  </div>
                </div>
              </div>
            </div>

            {/* Role & Relationship Right Card */}
            <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <div className="mb-6 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-[#dd5437]">
                    <Users className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800">Role & Relationship</h3>
                </div>

                {/* Left & Right columns in one grid, grouped by divs for perfect last:border-0 support */}
                <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                  <div className="flex flex-col">
                    <FieldItem label="Specialization" value={pm.specialization} icon={Star} />
                    <FieldItem label="Properties Managed (Text)" value="—" icon={FileText} />
                    <FieldItem label="Sentiment" value="—" icon={Heart} />
                    <FieldItem label="Interest" value="—" icon={ThumbsUp} />
                  </div>
                  <div className="flex flex-col">
                    <FieldItem label="Properties Managed" value={pm.fullName} icon={Tag} />
                    <FieldItem label="Communication style" value="—" icon={MessageSquare} />
                    <FieldItem label="Meeting Cadence" value="—" icon={Clock} />
                    <FieldItem label="Start Year" value="—" icon={Calendar} />
                  </div>
                </div>
              </div>

              {/* Preferred Brands option badges */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 min-w-max">
                  Preferred Brands
                </span>
                <div className="flex flex-wrap gap-2">
                  {pm.brands.length > 0 ? (
                    pm.brands.map(brand => (
                      <span
                        key={brand}
                        className="px-3.5 py-1 text-[11px] font-bold rounded-full border border-slate-200 bg-white text-slate-600 shadow-3xs hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {brand}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-medium text-slate-400">—</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Star Rating Card */}
          <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-[#dd5437]">
              <Users className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-black text-slate-800 min-w-max">Engagement</h3>
            
            <div className="flex items-center gap-1.5 ml-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4.5 w-4.5 ${
                    star <= pm.engagement
                      ? "fill-[#dd5437] stroke-none"
                      : "text-slate-200 stroke-[1.5px]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === "Meetings" ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-center animate-in fade-in-50 duration-300">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-black text-slate-800 mt-4">
            No meetings scheduled with {pm.fullName}.
          </h3>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-center animate-in fade-in-50 duration-300">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-black text-slate-800 mt-4">
            No notes added for {pm.fullName}.
          </h3>
        </div>
      )}

      {/* Edit Property Manager Right-Side Sheet panel */}
      <EditPmSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        pm={pm}
        onSave={handleSaveEdits}
      />
    </div>
  );
}

interface EditPmSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pm: any;
  onSave: (updatedPm: any) => void;
}

function EditPmSheet({ open, onOpenChange, pm, onSave }: EditPmSheetProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [startDate, setStartDate] = useState("");
  const [role, setRole] = useState<PmRole>("Property Manager" as PmRole);
  const [status, setStatus] = useState("Active");
  const [propertiesManaged, setPropertiesManaged] = useState("0");
  const [specialization, setSpecialization] = useState("Residential");
  const [officeName, setOfficeName] = useState("");
  const [engagement, setEngagement] = useState(4);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [avatar, setAvatar] = useState("");

  const brandOptions = [
    "Westinghouse", "Omega", "Artusi", "Fulgor",
    "Chef", "Electrolux", "Euromaid", "Franke"
  ];

  // Pre-populate fields on open or when manager changes
  useEffect(() => {
    if (open && pm) {
      setFullName(pm.fullName || "");
      setEmail(pm.email || "");
      setPhone(pm.phone || "");
      setDob(pm.dob || "");
      setStartDate(pm.startDate || "");
      setRole(pm.role || ("Property Manager" as PmRole));
      setStatus(pm.status || "Active");
      setPropertiesManaged(pm.propertiesManaged || "0");
      setSpecialization(pm.specialization || "Residential");
      setOfficeName(pm.officeName || "");
      setEngagement(pm.engagement || 4);
      setSelectedBrands(new Set(pm.brands || []));
      setAvatar(pm.avatar || "");
    }
  }, [open, pm]);

  function toggleBrand(brand: string) {
    setSelectedBrands(prev => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  }

  function handleSave() {
    if (!fullName.trim()) {
      toast.error("Full Name is required");
      return;
    }
    
    // Parse first name / last name
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || "New";
    const lastName = parts.slice(1).join(" ") || "";

    const updatedPm = {
      ...pm,
      firstName,
      lastName,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      dob: dob.trim(),
      startDate: startDate.trim(),
      role,
      status,
      propertiesManaged,
      specialization: specialization.trim(),
      officeName: officeName.trim(),
      engagement,
      brands: Array.from(selectedBrands),
      avatar,
    };

    onSave(updatedPm);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 bg-white border-0 shadow-2xl flex flex-col h-full z-[100]">
        <div className="flex items-center justify-between border-b border-slate-100 p-6 shrink-0">
          <h3 className="text-lg font-black text-slate-800">Edit Property Manager</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <img
              src={avatar || "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=256&auto=format&fit=crop"}
              alt="Avatar"
              className="h-16 w-16 rounded-full object-cover border border-slate-100 bg-slate-50 shadow-2xs"
            />
            <button
              type="button"
              onClick={() => {
                // Simulate avatar change by cycling through professional options
                const altAvatars = [
                  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=256&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop"
                ];
                const nextAvatar = altAvatars[Math.floor(Math.random() * altAvatars.length)];
                setAvatar(nextAvatar);
                toast.success("New headshot photo loaded successfully!");
              }}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-slate-200 focus-visible:ring-[#dd5437]/20 focus-visible:border-[#dd5437]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Phone
                </Label>
                <Input
                  placeholder="Write here"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl border-slate-200 focus-visible:ring-[#dd5437]/20 focus-visible:border-[#dd5437]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Date of Birth
                </Label>
                <div className="relative">
                  <Input
                    placeholder="dd/mm/yy"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="rounded-xl border-slate-200 focus-visible:ring-[#dd5437]/20 focus-visible:border-[#dd5437] pr-10"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Start Date
                </Label>
                <div className="relative">
                  <Input
                    placeholder="dd/mm/yy"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-xl border-slate-200 focus-visible:ring-[#dd5437]/20 focus-visible:border-[#dd5437] pr-10"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
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
                  value={role}
                  onChange={(e) => setRole(e.target.value as PmRole)}
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
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
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
                  value={propertiesManaged}
                  onChange={(e) => setPropertiesManaged(e.target.value.replace(/\D/g, ""))}
                  className="rounded-xl border-slate-200 focus-visible:ring-[#dd5437]/20 focus-visible:border-[#dd5437]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Specialization
                </Label>
                <Input
                  placeholder="e.g. Residential"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="rounded-xl border-slate-200 focus-visible:ring-[#dd5437]/20 focus-visible:border-[#dd5437]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Office Name
              </Label>
              <Input
                placeholder="e.g. Jackson Rowe Real Estate"
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                className="rounded-xl border-slate-200 focus-visible:ring-[#dd5437]/20 focus-visible:border-[#dd5437]"
              />
            </div>
          </div>

          {/* Relationship & Engagement Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-1.5">
              Relationship & Engagement
            </h4>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Relationship Engagement Stars
              </Label>
              <div className="flex items-center gap-1.5 h-10 select-none">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEngagement(star)}
                    className="text-slate-200 hover:scale-110 transition-transform cursor-pointer border-0 bg-transparent p-0"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        star <= engagement
                          ? "fill-[#dd5437] stroke-none"
                          : "text-slate-300 stroke-[1.5px]"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Brands choice chips */}
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
                      className={`px-3.5 py-2 text-[10px] font-black rounded-full border transition-all cursor-pointer select-none ${
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
          </div>
        </div>

        <div className="border-t border-slate-100 p-6 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer border-0"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-[#dd5437] hover:bg-[#c9452b] px-6 py-3 text-xs font-black text-white transition-colors cursor-pointer border-0 shadow-xs"
          >
            Save Changes
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
