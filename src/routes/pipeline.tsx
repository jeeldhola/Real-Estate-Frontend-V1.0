import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { AddAgencyDialog } from "@/components/add-agency-dialog";
import {
  Users,
  UserPlus,
  AlertTriangle,
  UserX,
  Building2,
  Clock,
  UserMinus,
  Plus,
  LayoutGrid,
  List,
  ChevronDown,
  Loader2,
  Briefcase,
  FileText,
  SlidersHorizontal,
  GripVertical,
  Trash2,
} from "lucide-react";
import {
  usePipelineBoard,
  usePipelineSummary,
  useMoveStage,
  usePropertyManagers,
  useUpdatePropertyManager,
  useUsers,
  useCreatePropertyManager,
  useOffices,
} from "@/lib/queries";
import {
  PIPELINE_STAGES,
  type PipelineStage,
  type Office,
  type PropertyManager,
  accountManagerId,
  PM_ROLES,
  PM_PIPELINE_STAGES,
  type PmRole,
  type PmPipelineStage,
} from "@/lib/api-types";
import { ApiError } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/pipeline")({
  component: PipelinePage,
  head: () => ({
    meta: [
      { title: "Pipeline — The Appliance Guys" },
      { name: "description", content: "Engagement & retention pipeline." },
    ],
  }),
});

const getStageAccent = (stage: string) => {
  const accentMap: Record<string, { accent: string; dot: string }> = {
    // Client stages
    "Identified": { accent: "bg-[oklch(0.4_0.02_50)]", dot: "bg-[oklch(0.4_0.02_50)]" },
    "Contact Made": { accent: "bg-[oklch(0.55_0.18_240)]", dot: "bg-[oklch(0.55_0.18_240)]" },
    "Discovery / Needs Assessment": { accent: "bg-[oklch(0.55_0.2_300)]", dot: "bg-[oklch(0.55_0.2_300)]" },
    "Proposal Sent": { accent: "bg-amber-500", dot: "bg-amber-500" },
    "Pilot / First Order": { accent: "bg-teal-600", dot: "bg-teal-600" },
    "Active Account": { accent: "bg-emerald-600", dot: "bg-emerald-600" },
    // Onboarding stages
    "Onboarding Started": { accent: "bg-[oklch(0.55_0.15_240)]", dot: "bg-[oklch(0.55_0.15_240)]" },
    "Documents Sent": { accent: "bg-[oklch(0.55_0.2_300)]", dot: "bg-[oklch(0.55_0.2_300)]" },
    "Training Scheduled": { accent: "bg-[oklch(0.75_0.16_85)]", dot: "bg-[oklch(0.75_0.16_85)]" },
    "First Order Placed": { accent: "bg-[oklch(0.55_0.15_150)]", dot: "bg-[oklch(0.55_0.15_150)]" },
    "Onboarding Completed": { accent: "bg-[oklch(0.72_0.18_150)]", dot: "bg-[oklch(0.72_0.18_150)]" },
    // Lapsing stages
    "Lapsing Identified": { accent: "bg-slate-500", dot: "bg-slate-500" },
    "Re-Engagement Outreach": { accent: "bg-orange-500", dot: "bg-orange-500" },
    "Meeting Scheduled": { accent: "bg-indigo-500", dot: "bg-indigo-500" },
    "Offer / Incentive Sent": { accent: "bg-amber-500", dot: "bg-amber-500" },
    "Re-Activated": { accent: "bg-emerald-600", dot: "bg-emerald-600" },
    // PM pipeline stages
    "New PM Identified": { accent: "bg-slate-500", dot: "bg-slate-500" },
    "Introduction Made": { accent: "bg-blue-500", dot: "bg-blue-500" },
    "Relationship Building": { accent: "bg-purple-500", dot: "bg-purple-500" },
    "Active PM": { accent: "bg-emerald-600", dot: "bg-emerald-600" },
    // Lapsing PM pipeline stages
    "Lapsing PM Identified": { accent: "bg-slate-500", dot: "bg-slate-500" },
    "Offer Sent": { accent: "bg-amber-500", dot: "bg-amber-500" },
    "Re-Activated PM": { accent: "bg-emerald-600", dot: "bg-emerald-600" },
    // Inactive PM pipeline stages
    "Inactive PM Identified": { accent: "bg-slate-500", dot: "bg-slate-500" },
    "Win-Back Outreach": { accent: "bg-red-500", dot: "bg-red-500" },
    "Discovery Call": { accent: "bg-purple-500", dot: "bg-purple-500" },
    // PM roles
    "Principal": { accent: "bg-blue-600", dot: "bg-blue-600" },
    "Head of PM": { accent: "bg-indigo-600", dot: "bg-indigo-600" },
    "Property Manager": { accent: "bg-teal-600", dot: "bg-teal-600" },
    "Senior PM": { accent: "bg-purple-600", dot: "bg-purple-600" },
    "Assistant": { accent: "bg-emerald-600", dot: "bg-emerald-600" },
    "Accounts": { accent: "bg-amber-600", dot: "bg-amber-600" },
    "Other": { accent: "bg-slate-600", dot: "bg-slate-600" },
  };
  return accentMap[stage] ?? { accent: "bg-slate-400", dot: "bg-slate-400" };
};

const getStageBadgeStyles = (stage: string) => {
  if (!stage) {
    return {
      bg: "bg-slate-100",
      text: "text-slate-600"
    };
  }
  const stageLower = stage.toLowerCase();
  
  if (stageLower.includes("identified") || stageLower.includes("lapsed") || stageLower.includes("other") || stageLower === "principal") {
    return {
      bg: "bg-[#eef2f6]",
      text: "text-[#566a7f]"
    };
  }
  if (stageLower.includes("outreach") || stageLower.includes("win-back") || stageLower === "inactive") {
    return {
      bg: "bg-[#ffe2e5]",
      text: "text-[#f1416c]"
    };
  }
  if (stageLower.includes("discovery") || stageLower.includes("call") || stageLower.includes("building") || stageLower.includes("needs") || stageLower.includes("relationship")) {
    return {
      bg: "bg-[#f8f5ff]",
      text: "text-[#7239ea]"
    };
  }
  if (stageLower.includes("offer") || stageLower.includes("incentive") || stageLower.includes("sent") || stageLower.includes("placed")) {
    return {
      bg: "bg-[#fff5ec]",
      text: "text-[#ff9f43]"
    };
  }
  if (stageLower.includes("active") || stageLower.includes("won") || stageLower.includes("completed")) {
    return {
      bg: "bg-[#e8fff3]",
      text: "text-[#50cd89]"
    };
  }
  if (stageLower.includes("contact") || stageLower.includes("meeting") || stageLower.includes("schedule") || stageLower.includes("introduction") || stageLower.includes("training")) {
    return {
      bg: "bg-[#e1f0ff]",
      text: "text-[#009ef7]"
    };
  }
  return {
    bg: "bg-slate-100",
    text: "text-slate-600"
  };
};

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  widthClass?: string;
}

function CustomDropdown({ value, onChange, options, placeholder, widthClass = "w-44" }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || { value, label: placeholder };

  return (
    <div className="relative inline-block text-left animate-fade-in" ref={ref}>
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center justify-between ${widthClass} rounded-xl border border-slate-200 bg-background px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-xs hover:bg-slate-50 focus:outline-none cursor-pointer transition-all`}
        >
          <span className="truncate">{selectedOption.label}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-1.5 w-52 origin-top-left rounded-2xl bg-white p-1 shadow-lg border border-slate-100 focus:outline-none animate-in fade-in slide-in-from-top-1 duration-100">
          <div className="flex flex-col gap-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#fff5f2] text-[#e05638] font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="w-4 flex items-center justify-center shrink-0">
                    {isSelected && <span className="text-[#e05638] font-bold">✓</span>}
                  </span>
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "Active":
      return "rounded-md bg-[#e05638] text-white px-2 py-0.5 text-[10px] font-bold border-none";
    case "Lapsing":
      return "rounded-md bg-amber-500 text-white px-2 py-0.5 text-[10px] font-bold border-none";
    case "Inactive":
      return "rounded-md bg-red-500 text-white px-2 py-0.5 text-[10px] font-bold border-none";
    default:
      return "rounded-md bg-slate-500 text-white px-2 py-0.5 text-[10px] font-bold border-none";
  }
};

const DEFAULT_STAGES = {
  client: [
    "Identified",
    "Contact Made",
    "Discovery / Needs Assessment",
    "Proposal Sent",
    "Pilot / First Order",
    "Active Account",
  ],
  onboarding: [
    "Onboarding Started",
    "Documents Sent",
    "Training Scheduled",
    "First Order Placed",
    "Onboarding Completed",
  ],
  lapsing: [
    "Lapsing Identified",
    "Re-Engagement Outreach",
    "Meeting Scheduled",
    "Offer / Incentive Sent",
    "Re-Activated",
  ],
  newPm: [
    "New PM Identified",
    "Introduction Made",
    "Relationship Building",
    "First Order Placed",
    "Active PM",
  ],
  lapsingPm: [
    "Lapsing PM Identified",
    "Re-Engagement Outreach",
    "Meeting Scheduled",
    "Offer Sent",
    "Re-Activated PM",
  ],
  inactivePm: [
    "Inactive PM Identified",
    "Win-Back Outreach",
    "Discovery Call",
    "Offer Sent",
    "Re-Activated PM",
  ]
};

function PipelinePage() {
  const [activeTab, setActiveTab] = useState<string>("New Client");
  const [open, setOpen] = useState(false);
  const [pmOpen, setPmOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [amFilter, setAmFilter] = useState<string>("All");
  const [sourceFilter, setSourceFilter] = useState<string>("All");

  // Stage Manager Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCategory, setDrawerCategory] = useState<string>("New Property Manager");
  const [editingStages, setEditingStages] = useState<string[]>([]);

  // Load stages from localStorage or fallback to defaults
  const [clientStages, setClientStages] = useState<string[]>(() => {
    const saved = localStorage.getItem("pipeline_clientStages");
    return saved ? JSON.parse(saved) : [...DEFAULT_STAGES.client];
  });

  const [onboardingStages, setOnboardingStages] = useState<string[]>(() => {
    const saved = localStorage.getItem("pipeline_onboardingStages");
    return saved ? JSON.parse(saved) : [...DEFAULT_STAGES.onboarding];
  });

  const [lapsingStages, setLapsingStages] = useState<string[]>(() => {
    const saved = localStorage.getItem("pipeline_lapsingStages");
    return saved ? JSON.parse(saved) : [...DEFAULT_STAGES.lapsing];
  });

  const [newPmStages, setNewPmStages] = useState<string[]>(() => {
    const saved = localStorage.getItem("pipeline_newPmStages");
    return saved ? JSON.parse(saved) : [...DEFAULT_STAGES.newPm];
  });

  const [lapsingPmStages, setLapsingPmStages] = useState<string[]>(() => {
    const saved = localStorage.getItem("pipeline_lapsingPmStages");
    return saved ? JSON.parse(saved) : [...DEFAULT_STAGES.lapsingPm];
  });

  const [inactivePmStages, setInactivePmStages] = useState<string[]>(() => {
    const saved = localStorage.getItem("pipeline_inactivePmStages");
    return saved ? JSON.parse(saved) : [...DEFAULT_STAGES.inactivePm];
  });

  const board = usePipelineBoard();
  const summaryQ = usePipelineSummary();
  const moveStage = useMoveStage();
  const pmsQuery = usePropertyManagers({ limit: 200 });
  const updatePm = useUpdatePropertyManager();
  const usersQuery = useUsers({ limit: 200 });

  const managers = usersQuery.data?.items.filter(u => u.role === "manager") ?? [];

  // All loaded offices
  const allOffices = board.data?.columns.flatMap(col => col.cards) ?? [];

  // Helpers to get properties from PM's populated office
  const getOfficeStatus = (pm: PropertyManager) => {
    if (!pm || !pm.office || typeof pm.office === "string") return undefined;
    return pm.office.status;
  };
  const getOfficeAmId = (pm: PropertyManager) => {
    if (!pm || !pm.office || typeof pm.office === "string") return undefined;
    return accountManagerId(pm.office.accountManager);
  };
  const getOfficeSource = (pm: PropertyManager) => {
    if (!pm || !pm.office || typeof pm.office === "string") return undefined;
    return pm.office.source;
  };

  const openSettingsDrawer = () => {
    let cat = "New Property Manager";
    if (activeTab === "New Client" || activeTab === "Inactive") cat = "New Client";
    else if (activeTab === "Lapsing") cat = "Lapsing Client";
    else if (activeTab === "Onboarding") cat = "Onboarding";
    else if (activeTab === "New PM") cat = "New Property Manager";
    else if (activeTab === "Lapsing PM") cat = "Lapsing Property Manager";
    else if (activeTab === "Inactive PM") cat = "Inactive Property Manager";
    
    setDrawerCategory(cat);
    setDrawerOpen(true);
  };

  const openSettingsForTab = (tabName: string) => {
    setActiveTab(tabName);
    let cat = "New Property Manager";
    if (tabName === "New Client" || tabName === "Inactive") cat = "New Client";
    else if (tabName === "Lapsing") cat = "Lapsing Client";
    else if (tabName === "Onboarding") cat = "Onboarding";
    else if (tabName === "New PM") cat = "New Property Manager";
    else if (tabName === "Lapsing PM") cat = "Lapsing Property Manager";
    else if (tabName === "Inactive PM") cat = "Inactive Property Manager";
    
    setDrawerCategory(cat);
    setDrawerOpen(true);
  };

  const handleDrawerCategoryChange = (cat: string) => {
    setDrawerCategory(cat);
    if (cat === "New Client") setActiveTab("New Client");
    else if (cat === "Lapsing Client") setActiveTab("Lapsing");
    else if (cat === "Onboarding") setActiveTab("Onboarding");
    else if (cat === "New Property Manager") setActiveTab("New PM");
    else if (cat === "Lapsing Property Manager") setActiveTab("Lapsing PM");
    else if (cat === "Inactive Property Manager") setActiveTab("Inactive PM");
  };

  useEffect(() => {
    if (drawerOpen) {
      if (drawerCategory === "New Client") setEditingStages([...clientStages]);
      else if (drawerCategory === "Lapsing Client") setEditingStages([...lapsingStages]);
      else if (drawerCategory === "Onboarding") setEditingStages([...onboardingStages]);
      else if (drawerCategory === "New Property Manager") setEditingStages([...newPmStages]);
      else if (drawerCategory === "Lapsing Property Manager") setEditingStages([...lapsingPmStages]);
      else if (drawerCategory === "Inactive Property Manager") setEditingStages([...inactivePmStages]);
    }
  }, [drawerOpen, drawerCategory, clientStages, lapsingStages, onboardingStages, newPmStages, lapsingPmStages, inactivePmStages]);

  const saveDrawerChanges = () => {
    if (drawerCategory === "New Client") {
      setClientStages([...editingStages]);
      localStorage.setItem("pipeline_clientStages", JSON.stringify(editingStages));
    } else if (drawerCategory === "Lapsing Client") {
      setLapsingStages([...editingStages]);
      localStorage.setItem("pipeline_lapsingStages", JSON.stringify(editingStages));
    } else if (drawerCategory === "Onboarding") {
      setOnboardingStages([...editingStages]);
      localStorage.setItem("pipeline_onboardingStages", JSON.stringify(editingStages));
    } else if (drawerCategory === "New Property Manager") {
      setNewPmStages([...editingStages]);
      localStorage.setItem("pipeline_newPmStages", JSON.stringify(editingStages));
    } else if (drawerCategory === "Lapsing Property Manager") {
      setLapsingPmStages([...editingStages]);
      localStorage.setItem("pipeline_lapsingPmStages", JSON.stringify(editingStages));
    } else if (drawerCategory === "Inactive Property Manager") {
      setInactivePmStages([...editingStages]);
      localStorage.setItem("pipeline_inactivePmStages", JSON.stringify(editingStages));
    }
    setDrawerOpen(false);
  };

  const resetDrawerToDefaults = () => {
    let defaults: string[] = [];
    if (drawerCategory === "New Client") defaults = [...DEFAULT_STAGES.client];
    else if (drawerCategory === "Lapsing Client") defaults = [...DEFAULT_STAGES.lapsing];
    else if (drawerCategory === "Onboarding") defaults = [...DEFAULT_STAGES.onboarding];
    else if (drawerCategory === "New Property Manager") defaults = [...DEFAULT_STAGES.newPm];
    else if (drawerCategory === "Lapsing Property Manager") defaults = [...DEFAULT_STAGES.lapsingPm];
    else if (drawerCategory === "Inactive Property Manager") defaults = [...DEFAULT_STAGES.inactivePm];
    
    setEditingStages(defaults);
  };

  const [draggedStageIdx, setDraggedStageIdx] = useState<number | null>(null);

  const handleStageDragStart = (idx: number) => {
    setDraggedStageIdx(idx);
  };

  const handleStageDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedStageIdx === null || draggedStageIdx === idx) return;
    const items = [...editingStages];
    const draggedItem = items[draggedStageIdx];
    items.splice(draggedStageIdx, 1);
    items.splice(idx, 0, draggedItem);
    setDraggedStageIdx(idx);
    setEditingStages(items);
  };

  const pms = pmsQuery.data?.items ?? [];

  // Apply filters to PMs
  const filteredPms = pms.filter(pm => {
    if (!pm) return false;
    const statusMatch = statusFilter === "All" || getOfficeStatus(pm) === statusFilter;
    const amMatch = amFilter === "All" || getOfficeAmId(pm) === amFilter;
    const sourceMatch = sourceFilter === "All" || getOfficeSource(pm) === sourceFilter;
    return statusMatch && amMatch && sourceMatch;
  });

  // Dynamic counts for tab buttons
  const newClientCount = allOffices.filter(o => {
    const amMatch = amFilter === "All" || accountManagerId(o.accountManager) === amFilter;
    const sourceMatch = sourceFilter === "All" || o.source === sourceFilter;
    return o.status === "Active" && o.pipelineStage && clientStages.includes(o.pipelineStage) && amMatch && sourceMatch;
  }).length;

  const lapsingCount = allOffices.filter(o => {
    const amMatch = amFilter === "All" || accountManagerId(o.accountManager) === amFilter;
    const sourceMatch = sourceFilter === "All" || o.source === sourceFilter;
    return o.status === "Lapsing" && o.pipelineStage && lapsingStages.includes(o.pipelineStage) && amMatch && sourceMatch;
  }).length;

  const inactiveCount = allOffices.filter(o => {
    const amMatch = amFilter === "All" || accountManagerId(o.accountManager) === amFilter;
    const sourceMatch = sourceFilter === "All" || o.source === sourceFilter;
    return o.status === "Inactive" && amMatch && sourceMatch;
  }).length;

  const onboardingCount = allOffices.filter(o => {
    const amMatch = amFilter === "All" || accountManagerId(o.accountManager) === amFilter;
    const sourceMatch = sourceFilter === "All" || o.source === sourceFilter;
    return o.pipelineStage && onboardingStages.includes(o.pipelineStage) && amMatch && sourceMatch;
  }).length;

  const newPmCount = filteredPms.filter(pm => pm.active && pm.pipelineStage && newPmStages.includes(pm.pipelineStage)).length;
  const lapsingPmCount = filteredPms.filter(pm => pm.active && pm.pipelineStage && lapsingPmStages.includes(pm.pipelineStage)).length;
  const inactivePmCount = filteredPms.filter(pm => !pm.active && pm.pipelineStage && inactivePmStages.includes(pm.pipelineStage)).length;

  // Drag and Drop support
  function onDragStart(e: React.DragEvent, office: Office) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/x-office-id", office.id);
  }

  function onPmDragStart(e: React.DragEvent, pm: PropertyManager) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/x-pm-id", pm.id);
  }

  async function onDrop(e: React.DragEvent, stage: string) {
    e.preventDefault();
    setDragOverStage(null);
    const officeId = e.dataTransfer.getData("application/x-office-id");
    const pmId = e.dataTransfer.getData("application/x-pm-id");

    if (officeId) {
      try {
        await moveStage.mutateAsync({ id: officeId, pipelineStage: stage as PipelineStage });
      } catch (err) {
        alert((err as Error).message);
      }
    } else if (pmId) {
      try {
        let patch: any = {};
        if (newPmStages.includes(stage) || lapsingPmStages.includes(stage) || inactivePmStages.includes(stage)) {
          patch.pipelineStage = stage;
          if (stage === "Re-Activated PM" || stage === "Active PM") {
            patch.active = true;
          } else if (inactivePmStages.includes(stage)) {
            patch.active = false;
          } else if (newPmStages.includes(stage) || lapsingPmStages.includes(stage)) {
            patch.active = true;
          }
        } else {
          patch.role = stage;
        }
        await updatePm.mutateAsync({ id: pmId, patch });
      } catch (err) {
        alert((err as Error).message);
      }
    }
  }

  // Columns & data selection based on tab & filters
  let displayColumns: { stage: string; cards: any[] }[] = [];

  if (activeTab === "New Client" || activeTab === "Inactive") {
    const cols = board.data?.columns ?? [];
    displayColumns = clientStages.map(stageName => {
      const col = cols.find(c => c.stage === stageName);
      let cards = col?.cards ?? [];
      cards = cards.filter(c => c !== null && c !== undefined);
      
      if (activeTab === "New Client") {
        cards = cards.filter(c => c.status === "Active");
      } else if (activeTab === "Inactive") {
        cards = cards.filter(c => c.status === "Inactive");
      }

      // Dropdown status filter
      if (statusFilter !== "All") {
        cards = cards.filter(c => c.pipelineStatus === statusFilter);
      }

      // Dropdown AM filter
      if (amFilter !== "All") {
        cards = cards.filter(c => accountManagerId(c.accountManager) === amFilter);
      }

      // Dropdown Source filter
      if (sourceFilter !== "All") {
        cards = cards.filter(c => c.source === sourceFilter);
      }

      return { stage: stageName, cards };
    });
  } else if (activeTab === "Lapsing") {
    const cols = board.data?.columns ?? [];
    displayColumns = lapsingStages.map(stageName => {
      const col = cols.find(c => c.stage === stageName);
      let cards = col?.cards ?? [];
      cards = cards.filter(c => c !== null && c !== undefined);

      cards = cards.filter(c => c.status === "Lapsing");

      // Dropdown status filter
      if (statusFilter !== "All") {
        cards = cards.filter(c => c.pipelineStatus === statusFilter);
      }

      // Dropdown AM filter
      if (amFilter !== "All") {
        cards = cards.filter(c => accountManagerId(c.accountManager) === amFilter);
      }

      // Dropdown Source filter
      if (sourceFilter !== "All") {
        cards = cards.filter(c => c.source === sourceFilter);
      }

      return { stage: stageName, cards };
    });
  } else if (activeTab === "Onboarding") {
    const cols = board.data?.columns ?? [];
    displayColumns = onboardingStages.map(stageName => {
      const col = cols.find(c => c.stage === stageName);
      let cards = col?.cards ?? [];
      cards = cards.filter(c => c !== null && c !== undefined);

      // Dropdown status filter
      if (statusFilter !== "All") {
        cards = cards.filter(c => c.pipelineStatus === statusFilter);
      }

      // Dropdown AM filter
      if (amFilter !== "All") {
        cards = cards.filter(c => accountManagerId(c.accountManager) === amFilter);
      }

      // Dropdown Source filter
      if (sourceFilter !== "All") {
        cards = cards.filter(c => c.source === sourceFilter);
      }

      return { stage: stageName, cards };
    });
  } else if (activeTab === "New PM") {
    displayColumns = newPmStages.map(stageName => ({
      stage: stageName,
      cards: filteredPms.filter(pm => pm && pm.active && pm.pipelineStage === stageName),
    }));
  } else if (activeTab === "Lapsing PM") {
    displayColumns = lapsingPmStages.map(stageName => ({
      stage: stageName,
      cards: filteredPms.filter(pm => pm && pm.active && pm.pipelineStage === stageName),
    }));
  } else if (activeTab === "Inactive PM") {
    displayColumns = inactivePmStages.map(stageName => ({
      stage: stageName,
      cards: filteredPms.filter(pm => pm && !pm.active && pm.pipelineStage === stageName),
    }));
  } else {
    // PM tab is active
    const pmRoles = [
      "Principal",
      "Head of PM",
      "Property Manager",
      "Senior PM",
      "Assistant",
      "Accounts",
      "Other",
    ];

    displayColumns = pmRoles.map(role => ({
      stage: role,
      cards: filteredPms.filter(pm => pm && pm.role === role),
    }));
  }

  // Summary stats row calculation
  let statsList: { label: string; value: number; color: string }[] = [];
  if (activeTab === "New Client" || activeTab === "Lapsing" || activeTab === "Inactive" || activeTab === "Onboarding" || activeTab === "New PM" || activeTab === "Lapsing PM" || activeTab === "Inactive PM") {
    const total = displayColumns.reduce((n, col) => n + col.cards.length, 0);
    let active = 0;
    let stalled = 0;
    let lost = 0;
    let won = 0;

    const boardCards = displayColumns.flatMap(c => c.cards);

    if (activeTab === "Onboarding") {
      stalled = boardCards.filter(c => c.pipelineStage === "Onboarding Started").length;
      won = boardCards.filter(c => c.pipelineStage === "Onboarding Completed").length;
      active = total - stalled - won;
    } else if (activeTab === "New PM") {
      won = boardCards.filter(c => c.pipelineStage === "Active PM").length;
      active = total - won;
    } else if (activeTab === "Lapsing PM") {
      won = boardCards.filter(c => c.pipelineStage === "Re-Activated PM").length;
      active = total - won;
    } else if (activeTab === "Inactive PM") {
      won = boardCards.filter(c => c.pipelineStage === "Re-Activated PM").length;
      active = total - won;
    } else {
      stalled = boardCards.filter(c => c.pipelineStatus === "Stalled").length;
      won = boardCards.filter(c => c.pipelineStatus === "Won").length;
      lost = boardCards.filter(c => c.pipelineStatus === "Lost").length;
      active = boardCards.filter(c => c.pipelineStatus === "Active").length;
    }

    statsList = [
      { label: "Total", value: total, color: "text-slate-800" },
      { label: "Active", value: active, color: "text-[#e05638]" },
      { label: "Stalled", value: stalled, color: "text-[#e05638]" },
      { label: "Lost", value: lost, color: "text-[#e05638]" },
      { label: "Won", value: won, color: "text-blue-600" },
    ];
  } else {
    const total = displayColumns.reduce((n, col) => n + col.cards.length, 0);
    const active = displayColumns.flatMap(c => c.cards).filter(pm => pm.active).length;
    const inactive = displayColumns.flatMap(c => c.cards).filter(pm => !pm.active).length;

    statsList = [
      { label: "Total PMs", value: total, color: "text-foreground" },
      { label: "Active", value: active, color: "text-[oklch(0.55_0.15_150)]" },
      { label: "Inactive", value: inactive, color: "text-[oklch(0.6_0.22_25)]" },
    ];
  }

  const isLoading = board.isLoading || pmsQuery.isLoading || usersQuery.isLoading;
  const isPM = activeTab === "New PM" || activeTab === "Lapsing PM" || activeTab === "Inactive PM";

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Engagement &amp; Retention Pipeline
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track prospective and lapsed agency offices through your sales funnel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openSettingsDrawer}
            className="inline-flex items-center justify-center p-2.5 rounded-lg border border-slate-200 bg-background text-slate-600 hover:bg-slate-50 cursor-pointer shadow-xs transition-colors"
          >
            <SlidersHorizontal className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => {
              if (isPM) {
                setPmOpen(true);
              } else {
                setOpen(true);
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#e05638] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#e05638]/90 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {isPM ? "Add Property Manager" : "Add Agency"}
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="mt-6 rounded-2xl border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Section: Clients */}
          <div className="flex items-center gap-2 px-2 text-muted-foreground">
            <Briefcase className="h-4.5 w-4.5" />
            <span className="text-sm font-bold tracking-wide">Clients</span>
          </div>

          <button
            onClick={() => setActiveTab("New Client")}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "New Client"
                ? "bg-[#1b8354] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <UserPlus className={`h-4 w-4 ${activeTab === "New Client" ? "text-white" : "text-[#1b8354]"}`} />
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  openSettingsForTab("New Client");
                }}
                className={`p-0.5 rounded-md hover:bg-black/10 transition-colors cursor-pointer ${
                  activeTab === "New Client" ? "text-white/80 hover:text-white" : "text-slate-400 hover:text-slate-600"
                }`}
                title="Settings"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </span>
            </div>
            <span>New Client</span>
            <span className={activeTab === "New Client" ? "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 text-white px-1.5 text-[11px] font-bold" : "text-[11px] font-bold text-[#1b8354]"}>
              {newClientCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("Lapsing")}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "Lapsing"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <AlertTriangle className={`h-4 w-4 ${activeTab === "Lapsing" ? "text-white" : "text-amber-500"}`} />
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  openSettingsForTab("Lapsing");
                }}
                className={`p-0.5 rounded-md hover:bg-black/10 transition-colors cursor-pointer ${
                  activeTab === "Lapsing" ? "text-white/80 hover:text-white" : "text-slate-400 hover:text-slate-600"
                }`}
                title="Settings"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </span>
            </div>
            <span>Lapsing</span>
            <span className={activeTab === "Lapsing" ? "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 text-white px-1.5 text-[11px] font-bold" : "text-[11px] font-bold text-amber-500"}>
              {lapsingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("Inactive")}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "Inactive"
                ? "bg-red-500 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <UserX className={`h-4 w-4 ${activeTab === "Inactive" ? "text-white" : "text-red-500"}`} />
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  openSettingsForTab("Inactive");
                }}
                className={`p-0.5 rounded-md hover:bg-black/10 transition-colors cursor-pointer ${
                  activeTab === "Inactive" ? "text-white/80 hover:text-white" : "text-slate-400 hover:text-slate-600"
                }`}
                title="Settings"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </span>
            </div>
            <span>Inactive</span>
            <span className={activeTab === "Inactive" ? "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 text-white px-1.5 text-[11px] font-bold" : "text-[11px] font-bold text-red-500"}>
              {inactiveCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("Onboarding")}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "Onboarding"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <FileText className={`h-4 w-4 ${activeTab === "Onboarding" ? "text-white" : "text-teal-600"}`} />
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  openSettingsForTab("Onboarding");
                }}
                className={`p-0.5 rounded-md hover:bg-black/10 transition-colors cursor-pointer ${
                  activeTab === "Onboarding" ? "text-white/80 hover:text-white" : "text-slate-400 hover:text-slate-600"
                }`}
                title="Settings"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </span>
            </div>
            <span>Onboarding</span>
            <span className={activeTab === "Onboarding" ? "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 text-white px-1.5 text-[11px] font-bold" : "text-[11px] font-bold text-teal-600"}>
              {onboardingCount}
            </span>
          </button>

          {/* Vertical Divider */}
          <span className="h-6 w-px bg-border mx-2" />

          {/* Section: Property Managers */}
          <div className="flex items-center gap-2 px-2 text-slate-500">
            <Users className="h-4.5 w-4.5" />
            <span className="text-sm font-bold tracking-wide">Property Managers</span>
          </div>

          <button
            onClick={() => setActiveTab("New PM")}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "New PM"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <UserPlus className={`h-4 w-4 ${activeTab === "New PM" ? "text-white" : "text-blue-500"}`} />
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  openSettingsForTab("New PM");
                }}
                className={`p-0.5 rounded-md hover:bg-black/10 transition-colors cursor-pointer ${
                  activeTab === "New PM" ? "text-white/80 hover:text-white" : "text-slate-400 hover:text-slate-600"
                }`}
                title="Settings"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </span>
            </div>
            <span>New PM</span>
            <span className={activeTab === "New PM" ? "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 text-white px-1.5 text-[11px] font-bold" : "text-[11px] font-bold text-blue-500"}>
              {newPmCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("Lapsing PM")}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "Lapsing PM"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Clock className={`h-4 w-4 ${activeTab === "Lapsing PM" ? "text-white" : "text-purple-500"}`} />
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  openSettingsForTab("Lapsing PM");
                }}
                className={`p-0.5 rounded-md hover:bg-black/10 transition-colors cursor-pointer ${
                  activeTab === "Lapsing PM" ? "text-white/80 hover:text-white" : "text-slate-400 hover:text-slate-600"
                }`}
                title="Settings"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </span>
            </div>
            <span>Lapsing PM</span>
            <span className={activeTab === "Lapsing PM" ? "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 text-white px-1.5 text-[11px] font-bold" : "text-[11px] font-bold text-purple-500"}>
              {lapsingPmCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("Inactive PM")}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "Inactive PM"
                ? "bg-[#dc2626] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <UserMinus className={`h-4 w-4 ${activeTab === "Inactive PM" ? "text-white" : "text-[#dc2626]"}`} />
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  openSettingsForTab("Inactive PM");
                }}
                className={`p-0.5 rounded-md hover:bg-black/10 transition-colors cursor-pointer ${
                  activeTab === "Inactive PM" ? "text-white/80 hover:text-white" : "text-slate-400 hover:text-slate-600"
                }`}
                title="Settings"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </span>
            </div>
            <span>Inactive PM</span>
            <span className={activeTab === "Inactive PM" ? "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 text-white px-1.5 text-[11px] font-bold" : "text-[11px] font-bold text-[#dc2626]"}>
              {inactivePmCount}
            </span>
          </button>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="mt-4 rounded-2xl border bg-card px-5 py-3.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {statsList.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              {i > 0 && <span className="h-4 w-px bg-border" />}
              <span className={`font-bold ${s.color}`}>{s.value}</span>
              <span className={s.color}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Select Filters */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <CustomDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "All", label: "All Statuses" },
              { value: "Active", label: "Active" },
              { value: "Stalled", label: "Stalled" },
              { value: "Lost", label: "Lost" },
              { value: "Won", label: "Won" },
            ]}
            placeholder="All Statuses"
            widthClass="w-40"
          />

          {/* AM Filter */}
          <CustomDropdown
            value={amFilter}
            onChange={setAmFilter}
            options={[
              { value: "All", label: "All AMs" },
              ...managers.map(m => ({ value: m.id, label: m.name })),
            ]}
            placeholder="All AMs"
            widthClass="w-40"
          />

          {/* Source Filter */}
          <CustomDropdown
            value={sourceFilter}
            onChange={setSourceFilter}
            options={[
              { value: "All", label: "All Sources" },
              { value: "Cold Outreach", label: "Cold Outreach" },
              { value: "Inbound", label: "Inbound" },
              { value: "Referral", label: "Referral" },
              { value: "Event", label: "Event" },
              { value: "Lapsed Client", label: "Lapsed Client" },
              { value: "Other", label: "Other" },
            ]}
            placeholder="All Sources"
            widthClass="w-44"
          />
        </div>

        <div className="flex gap-1 rounded-lg border bg-card p-1">
          <button className="rounded-md bg-accent px-2 py-1.5 text-primary">
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button className="rounded-md px-2 py-1.5 text-muted-foreground hover:text-foreground">
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="mt-10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="mt-5 flex gap-4 overflow-x-auto pb-4">
          {displayColumns.map(({ stage, cards }) => {
            const tone = getStageAccent(stage);
            const isPM = activeTab === "New PM" || activeTab === "Lapsing PM" || activeTab === "Inactive PM";
            const badgeStyles = getStageBadgeStyles(stage);

            return (
              <div
                key={stage}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverStage !== stage) setDragOverStage(stage);
                }}
                onDragLeave={() => {
                  if (dragOverStage === stage) setDragOverStage(null);
                }}
                onDrop={(e) => onDrop(e, stage)}
                className={`flex w-72 shrink-0 flex-col overflow-hidden rounded-xl bg-card border transition-shadow ${
                  dragOverStage === stage ? "ring-2 ring-primary shadow-md" : "shadow-sm"
                }`}
              >
                <div className={`h-1.5 ${tone.accent}`} />
                <div className="flex items-center justify-between px-4 py-3 bg-muted/10 border-b">
                  <div className="flex items-center gap-2 overflow-hidden mr-1">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-foreground truncate max-w-[145px]" title={stage}>
                      {stage}
                    </span>
                    <span className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold ${badgeStyles.bg} ${badgeStyles.text}`}>
                      {cards.length}
                    </span>
                  </div>
                  <button
                    className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted cursor-pointer shrink-0 transition-colors"
                    aria-label={isPM ? "Add Property Manager" : "Add Agency"}
                    onClick={() => {
                      if (isPM) {
                        setSelectedStage(stage);
                        setPmOpen(true);
                      } else {
                        setOpen(true);
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex flex-col gap-2 px-3 py-4 min-h-[300px] bg-muted/5">
                  {cards.map((c) => {
                    if (isPM) {
                      const pm = c as PropertyManager;
                      return (
                        <div
                          key={pm.id}
                          draggable
                          onDragStart={(e) => onPmDragStart(e, pm)}
                          className="cursor-grab rounded-lg border bg-background p-3.5 text-left shadow-xs transition-shadow hover:shadow active:cursor-grabbing border-muted/50"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold text-foreground">{pm.firstName} {pm.lastName || ""}</p>
                            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${pm.active ? "bg-emerald-500" : "bg-muted"}`} />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {typeof pm.office === "string" ? pm.office : pm.office?.name || "—"}
                          </p>
                          {pm.email && <p className="mt-1.5 text-[10px] text-muted-foreground truncate">{pm.email}</p>}
                          {pm.phone && <p className="mt-0.5 text-[10px] text-muted-foreground">{pm.phone}</p>}
                          <span className="mt-2.5 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground border">
                            {pm.role}
                          </span>
                        </div>
                      );
                    } else {
                      const office = c as Office;
                      return (
                        <div
                          key={office.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, office)}
                          className="cursor-grab rounded-lg border bg-background p-3.5 text-left shadow-xs transition-shadow hover:shadow active:cursor-grabbing border-muted/50"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold text-foreground">{office.name}</p>
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[oklch(0.55_0.18_240)]" />
                          </div>
                          {office.suburb && <p className="mt-1 text-xs text-muted-foreground">{office.suburb}</p>}
                          {office.phone && <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{office.phone}</p>}
                          <div className="flex gap-1.5 mt-2.5">
                            <span className={getStatusBadgeClass(office.status)}>
                              {office.status}
                            </span>
                            {office.zone && (
                              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground border">
                                Zone {office.zone}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                  })}
                  {cards.length === 0 && (
                    <div className="flex h-28 items-center justify-center rounded-lg border-2 border-dashed border-border/80 text-xs text-muted-foreground/80 bg-background/50">
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddAgencyDialog open={open} onOpenChange={setOpen} />
      <AddPmDialog open={pmOpen} onOpenChange={setPmOpen} defaultStage={selectedStage} activeTab={activeTab} />
      
      {/* Stage Manager Drawer */}
      <StageManagerDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        category={drawerCategory}
        onCategoryChange={handleDrawerCategoryChange}
        stages={editingStages}
        onStagesChange={setEditingStages}
        onSave={saveDrawerChanges}
        onReset={resetDrawerToDefaults}
        onDragStart={handleStageDragStart}
        onDragOver={handleStageDragOver}
      />
    </div>
  );
}

interface StageManagerDrawerProps {
  open: boolean;
  onClose: () => void;
  category: string;
  onCategoryChange: (cat: string) => void;
  stages: string[];
  onStagesChange: (stages: string[]) => void;
  onSave: () => void;
  onReset: () => void;
  onDragStart: (idx: number) => void;
  onDragOver: (e: React.DragEvent, idx: number) => void;
}

function StageManagerDrawer({
  open,
  onClose,
  category,
  onCategoryChange,
  stages,
  onStagesChange,
  onSave,
  onReset,
  onDragStart,
  onDragOver,
}: StageManagerDrawerProps) {
  const [newPhaseName, setNewPhaseName] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowAddInput(false);
      setNewPhaseName("");
    }
  }, [open]);

  const handleAddPhase = () => {
    if (!newPhaseName.trim()) return;
    onStagesChange([...stages, newPhaseName.trim()]);
    setNewPhaseName("");
    setShowAddInput(false);
  };

  const getDrawerTitle = (cat: string) => {
    if (cat === "New Client") return "New Client";
    if (cat === "Lapsing Client") return "Lapsing Client";
    if (cat === "Onboarding") return "Onboarding";
    if (cat === "New Property Manager") return "New PM";
    if (cat === "Lapsing Property Manager") return "Lapsing PM";
    if (cat === "Inactive Property Manager") return "Inactive PM";
    return cat;
  };

  return (
    <>
      {/* Background Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/45 z-50 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer Container */}
      <div
        className={`fixed top-0 right-0 h-full w-[380px] max-w-full bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between relative">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Pipeline Stages — {getDrawerTitle(category)}
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              Manage pipeline phases for each category independently
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <Plus className="h-5 w-5 transform rotate-45 text-slate-500" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Category Dropdown */}
          <div className="space-y-1.5">
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full rounded-xl border border-[#e05638] bg-background px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#e05638] cursor-pointer transition-all"
            >
              <option value="New Client">New Client</option>
              <option value="Lapsing Client">Lapsing Client</option>
              <option value="Onboarding">Onboarding</option>
              <option value="New Property Manager">New Property Manager</option>
              <option value="Lapsing Property Manager">Lapsing Property Manager</option>
              <option value="Inactive Property Manager">Inactive Property Manager</option>
            </select>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Stages List */}
          <div className="space-y-2.5">
            {stages.map((stageName, idx) => {
              const tone = getStageAccent(stageName);
              return (
                <div
                  key={`${stageName}-${idx}`}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={(e) => onDragOver(e, idx)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-colors cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className={`h-6 w-6 rounded-lg shrink-0 ${tone.dot}`} />
                  <input
                    type="text"
                    value={stageName}
                    onChange={(e) => {
                      const newStages = [...stages];
                      newStages[idx] = e.target.value;
                      onStagesChange(newStages);
                    }}
                    className="flex-1 bg-transparent border-none text-sm font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-100 rounded px-1.5 py-0.5"
                  />
                  <button
                    onClick={() => {
                      const newStages = [...stages];
                      newStages.splice(idx, 1);
                      onStagesChange(newStages);
                    }}
                    className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}

            {/* Dash border + Add Phase button */}
            {showAddInput ? (
              <div className="flex gap-2 items-center p-2 rounded-xl border border-slate-200 bg-slate-50 animate-fade-in">
                <input
                  type="text"
                  placeholder="Enter stage name..."
                  value={newPhaseName}
                  onChange={(e) => setNewPhaseName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddPhase();
                  }}
                  className="flex-1 px-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
                <button
                  onClick={handleAddPhase}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#e05638] rounded-lg cursor-pointer"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddInput(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddInput(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-400 hover:text-slate-600 hover:border-slate-300 bg-slate-50/30 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Phase</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex flex-col items-center">
          <button
            onClick={onReset}
            className="text-sm font-bold text-slate-500 hover:text-slate-700 hover:underline transition-colors cursor-pointer"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onSave}
            className="w-full py-3 bg-[#e05638] hover:bg-[#e05638]/90 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg cursor-pointer mt-4 text-sm tracking-wide"
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}

const labelCls = "block text-sm font-semibold text-foreground mb-2";
const fieldCls =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20";

function AddPmDialog({
  open,
  onOpenChange,
  defaultStage,
  activeTab,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultStage?: string;
  activeTab?: string;
}) {
  const createPm = useCreatePropertyManager();
  const offices = useOffices({ limit: 200 });
  
  const [form, setForm] = useState({
    contactName: "",
    office: "",
    category: "",
    stage: "",
    status: "Active",
    source: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    amName: "",
    amEmail: "",
    nextFollowUp: "",
    expectedClose: "",
    notes: "",
  });
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      let cat = "New Property Manager";
      let initialStage = "New PM Identified";
      let initialStatus = "Active";

      if (activeTab === "New PM") {
        cat = "New Property Manager";
        initialStage = defaultStage || "New PM Identified";
        initialStatus = "Active";
      } else if (activeTab === "Lapsing PM") {
        cat = "Lapsing Property Manager";
        initialStage = defaultStage || "Lapsing PM Identified";
        initialStatus = "Active";
      } else if (activeTab === "Inactive PM") {
        cat = "Inactive Property Manager";
        initialStage = defaultStage || "Inactive PM Identified";
        initialStatus = "Inactive";
      }

      setForm({
        contactName: "",
        office: "",
        category: cat,
        stage: initialStage,
        status: initialStatus,
        source: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        amName: "",
        amEmail: "",
        nextFollowUp: "",
        expectedClose: "",
        notes: "",
      });
      setError(null);
    }
  }, [open, defaultStage, activeTab]);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function onSave() {
    setError(null);
    if (!form.contactName.trim() || !form.office) {
      setError("Contact name and office are required");
      return;
    }
    try {
      const nameParts = form.contactName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || undefined;
      const active = form.status === "Active";

      await createPm.mutateAsync({
        firstName,
        lastName,
        role: "Property Manager",
        office: form.office,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        pipelineStage: form.stage as PmPipelineStage,
        active,
        notes: form.notes.trim() || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    }
  }

  const getStageOptions = () => {
    if (activeTab === "New PM") {
      const saved = localStorage.getItem("pipeline_newPmStages");
      return saved ? JSON.parse(saved) : ["New PM Identified", "Introduction Made", "Relationship Building", "First Order Placed", "Active PM"];
    }
    if (activeTab === "Lapsing PM") {
      const saved = localStorage.getItem("pipeline_lapsingPmStages");
      return saved ? JSON.parse(saved) : ["Lapsing PM Identified", "Re-Engagement Outreach", "Meeting Scheduled", "Offer Sent", "Re-Activated PM"];
    }
    if (activeTab === "Inactive PM") {
      const saved = localStorage.getItem("pipeline_inactivePmStages");
      return saved ? JSON.parse(saved) : ["Inactive PM Identified", "Win-Back Outreach", "Discovery Call", "Offer Sent", "Re-Activated PM"];
    }
    return [];
  };

  const canSubmit = form.contactName.trim().length > 0 && form.office.length > 0 && !createPm.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(95vw,720px)] max-w-none overflow-y-auto rounded-2xl border-0 bg-card p-0 animate-fade-in">
        <DialogHeader className="sticky top-0 z-10 bg-card px-7 pt-7 pb-4">
          <DialogTitle className="text-2xl font-bold text-foreground">Add Agency Office</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-7 pb-2">
          <div>
            <label className={labelCls} htmlFor="pm-office-select">
              Agency Office <span className="text-primary">*</span>
            </label>
            <select
              id="pm-office-select"
              name="office"
              value={form.office}
              onChange={(e) => update("office", e.target.value)}
              className={`${fieldCls} ring-2 ring-primary/30`}
            >
              <option value="">
                {offices.isLoading ? "Loading offices…" : "Select an agency office..."}
              </option>
              {offices.data?.items.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="pm-category-select">
              Client Category <span className="text-primary">*</span>
            </label>
            <select
              id="pm-category-select"
              name="category"
              value={form.category}
              disabled
              className={`${fieldCls} bg-slate-50 cursor-not-allowed`}
            >
              <option value={form.category}>{form.category}</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground/80 font-semibold text-slate-400">Category is set from the active pipeline board.</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="pm-stage-select">Stage</label>
              <select
                id="pm-stage-select"
                name="stage"
                value={form.stage}
                onChange={(e) => update("stage", e.target.value)}
                className={fieldCls}
              >
                {getStageOptions().map((s: string) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="pm-status-select">Status</label>
              <select
                id="pm-status-select"
                name="status"
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                className={fieldCls}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="pm-source-select">Source Type</label>
            <select
              id="pm-source-select"
              name="source"
              value={form.source}
              onChange={(e) => update("source", e.target.value)}
              className={fieldCls}
            >
              <option value="">Select source</option>
              <option value="Referral">Referral</option>
              <option value="Cold Outreach">Cold Outreach</option>
              <option value="Inbound">Inbound</option>
              <option value="Event">Event</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="pm-contact-name-input">Contact Name</label>
              <input
                id="pm-contact-name-input"
                name="contactName"
                value={form.contactName}
                onChange={(e) => update("contactName", e.target.value)}
                maxLength={100}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="pm-contact-email-input">Contact Email</label>
              <input
                id="pm-contact-email-input"
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                maxLength={255}
                className={fieldCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="pm-contact-phone-input">Contact Phone</label>
            <input
              id="pm-contact-phone-input"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              maxLength={32}
              className={fieldCls}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="pm-address-input">Address</label>
              <input
                id="pm-address-input"
                name="address"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                maxLength={200}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="pm-city-input">City</label>
              <input
                id="pm-city-input"
                name="city"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                maxLength={100}
                className={fieldCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="pm-am-name-input">Assigned AM Name</label>
              <input
                id="pm-am-name-input"
                name="amName"
                value={form.amName}
                onChange={(e) => update("amName", e.target.value)}
                maxLength={100}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="pm-am-email-input">Assigned AM Email</label>
              <input
                id="pm-am-email-input"
                name="amEmail"
                type="email"
                value={form.amEmail}
                onChange={(e) => update("amEmail", e.target.value)}
                maxLength={255}
                className={fieldCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="pm-next-followup-input">Next Follow-Up</label>
              <input
                id="pm-next-followup-input"
                name="nextFollowUp"
                type="date"
                value={form.nextFollowUp}
                onChange={(e) => update("nextFollowUp", e.target.value)}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="pm-expected-close-input">Expected Close</label>
              <input
                id="pm-expected-close-input"
                name="expectedClose"
                type="date"
                value={form.expectedClose}
                onChange={(e) => update("expectedClose", e.target.value)}
                className={fieldCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="pm-notes-input">Notes</label>
            <textarea
              id="pm-notes-input"
              name="notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              maxLength={2000}
              rows={3}
              className={`${fieldCls} resize-none`}
            />
          </div>
        </div>

        {error && (
          <div className="mx-7 mb-3 rounded-lg border border-[oklch(0.85_0.1_25)] bg-[oklch(0.97_0.04_25)] px-3 py-2 text-sm text-[oklch(0.45_0.18_25)]">
            {error}
          </div>
        )}

        <div className="sticky bottom-0 z-10 mt-2 flex items-center justify-end gap-3 border-t border-border bg-card px-7 py-5">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={!canSubmit}
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-lg bg-[#e05638] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:bg-[#e05638]/90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {createPm.isPending && <Loader2 className="h-4 w-4 animate-spin text-white" />}
            Add to Pipeline
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
