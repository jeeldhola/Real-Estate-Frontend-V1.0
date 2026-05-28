import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Building2,
  CalendarDays,
  MoreHorizontal,
  Loader2,
  Bookmark,
  Check,
  SlidersHorizontal,
  FileText,
  Trash2,
  Edit2,
  CheckSquare,
  Sparkles,
  X,
  Copy,
  Clock,
  ArrowRight,
  FolderOpen,
} from "lucide-react";
import {
  useCreateTask,
  useDeleteTask,
  useOffices,
  useTasks,
  useUpdateTask,
  useUsers,
  useMeetings,
} from "@/lib/queries";
import type { Task, TaskPriority, TaskScope, TaskStatus, Meeting } from "@/lib/api-types";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
  head: () => ({
    meta: [
      { title: "Tasks — The Appliance Guys" },
      { name: "description", content: "Manage and track work items across your team." },
    ],
  }),
});

const filterTabs: { label: string; scope: TaskScope }[] = [
  { label: "All Tasks", scope: "all" },
  { label: "My Tasks", scope: "mine" },
  { label: "Overdue", scope: "overdue" },
  { label: "Due Today", scope: "today" },
  { label: "This Week", scope: "week" },
  { label: "Scheduled", scope: "unassigned" },
  { label: "Unassigned", scope: "done" },
  { label: "Completed Recently", scope: "done" },
];

const priorityStyles: Record<TaskPriority, { text: string; bg: string; border: string; strip: string; badge: string }> = {
  Urgent: { text: "text-[#d93f3f] bg-[#fdf2f2] border-[#fbe5e5]", bg: "bg-red-50", border: "border-red-100", strip: "border-l-[#e05638]", badge: "bg-red-500" },
  High: { text: "text-[#d97706] bg-[#fffbeb] border-[#fef3c7]", bg: "bg-amber-50", border: "border-amber-100", strip: "border-l-[#f59e0b]", badge: "bg-amber-500" },
  Medium: { text: "text-[#d97706] bg-[#fffbeb] border-[#fef3c7]", bg: "bg-orange-50", border: "border-orange-100", strip: "border-l-[#ff9f43]", badge: "bg-orange-400" },
  Low: { text: "text-[#5e7e9e] bg-[#f0f4f8] border-[#e2e8f0]", bg: "bg-slate-50", border: "border-slate-100", strip: "border-l-[#cbd5e1]", badge: "bg-slate-400" },
};

const statusDotColors: Record<TaskStatus, string> = {
  "To Do": "bg-[#64748b]",
  "In Progress": "bg-[#3b82f6]",
  "Waiting on Client": "bg-[#f59e0b]",
  "Waiting on Internal Team": "bg-[#8b5cf6]",
  "Scheduled": "bg-[#06b6d4]",
  "Deferred": "bg-[#64748b]/60",
  "Approved": "bg-[#10b981]",
  "Done": "bg-[#10b981]",
};

const statusBorderColors: Record<TaskStatus, string> = {
  "To Do": "border-l-[#64748b]",
  "In Progress": "border-l-[#3b82f6]",
  "Waiting on Client": "border-l-[#f59e0b]",
  "Waiting on Internal Team": "border-l-[#8b5cf6]",
  "Scheduled": "border-l-[#06b6d4]",
  "Deferred": "border-l-[#64748b]/60",
  "Approved": "border-l-[#10b981]",
  "Done": "border-l-[#10b981]",
};

const statusPillStyles: Record<TaskStatus, string> = {
  "To Do": "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700",
  "In Progress": "bg-blue-50/50 hover:bg-blue-100/50 border-blue-200 text-blue-700",
  "Waiting on Client": "bg-amber-50/50 hover:bg-amber-100/50 border-amber-200 text-amber-700",
  "Waiting on Internal Team": "bg-purple-50/50 hover:bg-purple-100/50 border-purple-200 text-purple-700",
  "Scheduled": "bg-cyan-50/50 hover:bg-cyan-100/50 border-cyan-200 text-cyan-700",
  "Deferred": "bg-zinc-50/50 hover:bg-zinc-100/50 border-zinc-200 text-zinc-700",
  "Approved": "bg-teal-50/50 hover:bg-teal-100/50 border-teal-200 text-teal-700",
  "Done": "bg-emerald-50/50 hover:bg-emerald-100/50 border-emerald-200 text-emerald-700",
};

function formatDue(task: Task): { label: string; overdue: boolean } {
  if (!task.dueAt) return { label: "—", overdue: false };
  const due = new Date(task.dueAt);
  const now = new Date();
  
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = dueMidnight.getTime() - nowMidnight.getTime();
  const diffDays = Math.ceil(diffTime / 86_400_000);
  const overdue = diffDays < 0 && task.status !== "Done";
  
  if (overdue) return { label: `${-diffDays}d overdue`, overdue: true };
  if (diffDays === 0) return { label: "Due today", overdue: false };
  if (diffDays === 1) return { label: "Tomorrow", overdue: false };
  if (diffDays < 7 && diffDays > 1) return { label: `In ${diffDays}d`, overdue: false };
  return { label: due.toLocaleDateString(undefined, { month: "short", day: "numeric" }), overdue: false };
}

function parseChecklist(description?: string) {
  if (!description) return null;
  const matches = description.match(/- \[( |x)\]/gi);
  if (!matches) return null;
  const total = matches.length;
  const completed = (description.match(/- \[x\]/gi) || []).length;
  return { completed, total, percent: total > 0 ? (completed / total) * 100 : 0 };
}

function toggleSubtaskMarkdown(description: string, targetIdx: number) {
  let idx = 0;
  return description.replace(/- \[( |x)\]/gi, (match) => {
    if (idx === targetIdx) {
      idx++;
      return match.toLowerCase().includes("x") ? "- [ ]" : "- [x]";
    }
    idx++;
    return match;
  });
}

function addSubtaskMarkdown(description: string = "", newText: string) {
  const line = `- [ ] ${newText}`;
  return description ? `${description}\n${line}` : line;
}

function getDaysInMonth(year: number, month: number) {
  const date = new Date(year, month, 1);
  const startDay = date.getDay();
  const days: Date[] = [];
  
  const prevMonth = new Date(year, month, 0);
  const prevDaysCount = prevMonth.getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    days.push(new Date(year, month - 1, prevDaysCount - i));
  }
  
  const currentMonthDaysCount = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= currentMonthDaysCount; i++) {
    days.push(new Date(year, month, i));
  }
  
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }
  return days;
}

function CustomDropdown({
  label,
  options,
  selected,
  onSelect,
  width = "w-44",
  showDot = false,
  isGroupFilter = false,
}: {
  label: string;
  options: { value: string; label: string; dotColor?: string }[];
  selected: string;
  onSelect: (val: string) => void;
  width?: string;
  showDot?: boolean;
  isGroupFilter?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeOption = options.find((opt) => opt.value === selected);
  const borderStyle = isGroupFilter 
    ? "border-[#e05638] text-slate-800 focus:ring-[#e05638]/20 focus:border-[#e05638]" 
    : "border-slate-200 text-slate-700";

  return (
    <div ref={dropdownRef} className="relative inline-block text-left animate-fade-in">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border hover:bg-slate-50 transition-all shadow-xs cursor-pointer ${width} ${borderStyle}`}
      >
        <span className="truncate flex items-center gap-1.5">
          {showDot && activeOption?.dotColor && (
            <span className={`h-2 w-2 rounded-full shrink-0 ${activeOption.dotColor}`} />
          )}
          {activeOption?.label || label}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1 z-40 rounded-xl border border-slate-100 bg-white p-1 shadow-md max-h-80 overflow-y-auto min-w-[180px] animate-in fade-in slide-in-from-top-1 duration-100">
          {options.map((opt) => {
            const isSel = opt.value === selected;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  onSelect(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold hover:bg-slate-50 transition-colors ${
                  isSel ? "text-[#e05638] bg-[#fff5ec]" : "text-slate-700"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {opt.dotColor && <span className={`h-2 w-2 rounded-full ${opt.dotColor}`} />}
                  {opt.label}
                </span>
                {isSel && <Check className="h-3.5 w-3.5 text-[#e05638] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TasksPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [activeTab, setActiveTab] = useState<TaskScope>("all");
  const [search, setSearch] = useState("");
  
  // Dialog Open state
  const [newOpen, setNewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dueAt, setDueAt] = useState<Date | undefined>(undefined);

  // Selected task detail drawer state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Calendar state (defaults to May 2026 as seen in screenshots)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(4); // May (0-indexed)

  // Filter toolbar states
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("due-asc");
  const [groupBy, setGroupBy] = useState("status");

  // Expanded Groups toggle state
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Fetch queries
  const tasksQuery = useTasks({ limit: 200 });
  const officesQuery = useOffices({ limit: 200 });
  const usersQuery = useUsers({ limit: 200 });
  const meetingsQuery = useMeetings({ limit: 200 });
  
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();

  const offices = officesQuery.data?.items ?? [];
  const users = usersQuery.data?.items ?? [];
  const allTasks = tasksQuery.data?.items ?? [];
  const meetings = meetingsQuery.data?.items ?? [];

  // Mappings
  const officeNameById = useMemo(() => {
    const m = new Map<string, string>();
    offices.forEach((o) => m.set(o.id, o.name));
    return m;
  }, [offices]);

  const userNameById = useMemo(() => {
    const m = new Map<string, string>();
    users.forEach((u) => m.set(u.id, u.name));
    return m;
  }, [users]);

  // Compute tabs dynamic task count badges based on local client state
  const tabCounts = useMemo(() => {
    const counts = {
      all: 0,
      mine: 0,
      overdue: 0,
      today: 0,
      week: 0,
      unassigned: 0,
      scheduled: 0,
      done: 0,
    };
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    allTasks.forEach((t) => {
      counts.all++;
      if (t.assignee === user?.id) counts.mine++;
      
      const isComplete = t.status === "Done";
      if (t.dueAt && !isComplete) {
        const due = new Date(t.dueAt);
        if (due.getTime() < startOfToday.getTime()) counts.overdue++;
        if (due.getTime() >= startOfToday.getTime() && due.getTime() <= endOfToday.getTime()) counts.today++;
        if (due.getTime() >= startOfToday.getTime() && due.getTime() <= endOfWeek.getTime()) counts.week++;
        if (due.getTime() > endOfToday.getTime()) counts.scheduled++;
      }
      
      if (!t.assignee) counts.unassigned++;
      if (isComplete) counts.done++;
    });

    return counts;
  }, [allTasks, user]);

  // Client side search, filter, and sorting
  const processedTasks = useMemo(() => {
    let list = [...allTasks];

    // 1. Filter by Active Tab scope
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    switch (activeTab) {
      case "mine":
        list = list.filter((t) => t.assignee === user?.id);
        break;
      case "overdue":
        list = list.filter((t) => t.dueAt && new Date(t.dueAt).getTime() < startOfToday.getTime() && t.status !== "Done");
        break;
      case "today":
        list = list.filter((t) => t.dueAt && new Date(t.dueAt).getTime() >= startOfToday.getTime() && new Date(t.dueAt).getTime() <= endOfToday.getTime() && t.status !== "Done");
        break;
      case "week":
        list = list.filter((t) => t.dueAt && new Date(t.dueAt).getTime() >= startOfToday.getTime() && new Date(t.dueAt).getTime() <= endOfWeek.getTime() && t.status !== "Done");
        break;
      case "unassigned":
        list = list.filter((t) => !t.assignee);
        break;
      case "done":
        list = list.filter((t) => t.status === "Done");
        break;
    }

    // 2. Filter by status filter
    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter);
    }

    // 3. Filter by priority filter
    if (priorityFilter !== "all") {
      list = list.filter((t) => t.priority === priorityFilter);
    }

    // 4. Filter by assignee filter
    if (assigneeFilter !== "all") {
      list = list.filter((t) => t.assignee === assigneeFilter);
    }

    // 5. Search query
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.office && (officeNameById.get(t.office) || "").toLowerCase().includes(q))
      );
    }

    // 6. Sorting
    list.sort((a, b) => {
      if (sortBy === "due-asc") {
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      }
      if (sortBy === "due-desc") {
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;
        return new Date(b.dueAt).getTime() - new Date(a.dueAt).getTime();
      }
      if (sortBy === "priority") {
        const weight = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
        return weight[b.priority] - weight[a.priority];
      }
      if (sortBy === "assignee") {
        const uA = a.assignee ? (userNameById.get(a.assignee) || "") : "ZZZ";
        const uB = b.assignee ? (userNameById.get(b.assignee) || "") : "ZZZ";
        return uA.localeCompare(uB);
      }
      if (sortBy === "office") {
        const oA = a.office ? (officeNameById.get(a.office) || "") : "ZZZ";
        const oB = b.office ? (officeNameById.get(b.office) || "") : "ZZZ";
        return oA.localeCompare(oB);
      }
      if (sortBy === "created") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

    return list;
  }, [allTasks, activeTab, statusFilter, priorityFilter, assigneeFilter, search, sortBy, user, officeNameById, userNameById]);

  // Grouping computation for list view
  const taskGroups = useMemo(() => {
    const groups: Record<string, Task[]> = {};

    if (groupBy === "status") {
      const activeStatuses: TaskStatus[] = [
        "To Do",
        "In Progress",
        "Waiting on Client",
        "Waiting on Internal Team",
        "Scheduled",
        "Deferred",
        "Approved",
        "Done",
      ];
      activeStatuses.forEach((s) => {
        groups[s] = [];
      });
      processedTasks.forEach((t) => {
        if (!groups[t.status]) groups[t.status] = [];
        groups[t.status].push(t);
      });
    } else if (groupBy === "priority") {
      const activePriorities: TaskPriority[] = ["Urgent", "High", "Medium", "Low"];
      activePriorities.forEach((p) => {
        groups[p] = [];
      });
      processedTasks.forEach((t) => {
        if (!groups[t.priority]) groups[t.priority] = [];
        groups[t.priority].push(t);
      });
    } else if (groupBy === "assignee") {
      groups["Unassigned"] = [];
      users.forEach((u) => {
        groups[u.name] = [];
      });
      processedTasks.forEach((t) => {
        if (!t.assignee) {
          groups["Unassigned"]!.push(t);
        } else {
          const name = userNameById.get(t.assignee) || "Unassigned";
          if (!groups[name]) groups[name] = [];
          groups[name]!.push(t);
        }
      });
    }

    const defaultOpen: Record<string, boolean> = { ...openGroups };
    Object.keys(groups).forEach((key) => {
      if (defaultOpen[key] === undefined) {
        defaultOpen[key] = groups[key]!.length > 0 || key === "To Do" || key === "In Progress" || key === "Done";
      }
    });

    return { groups, defaultOpen };
  }, [processedTasks, groupBy, users, userNameById]);

  const computedGroups = taskGroups.groups;
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      Object.keys(taskGroups.defaultOpen).forEach((k) => {
        if (next[k] === undefined) {
          next[k] = taskGroups.defaultOpen[k]!;
        }
      });
      return next;
    });
  }, [taskGroups]);

  async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    await updateTask.mutateAsync({ id: taskId, patch: { status: newStatus } });
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) => prev ? { ...prev, status: newStatus } : null);
    }
  }

  // Pre-compiled filter dropdown options list
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "To Do", label: "To Do", dotColor: "bg-slate-400" },
    { value: "In Progress", label: "In Progress", dotColor: "bg-blue-500" },
    { value: "Waiting on Client", label: "Waiting on Client", dotColor: "bg-amber-500" },
    { value: "Waiting on Internal Team", label: "Waiting on Internal Team", dotColor: "bg-purple-500" },
    { value: "Scheduled", label: "Scheduled", dotColor: "bg-cyan-500" },
    { value: "Deferred", label: "Deferred", dotColor: "bg-zinc-400" },
    { value: "Approved", label: "Approved", dotColor: "bg-teal-500" },
    { value: "Done", label: "Done", dotColor: "bg-[#10b981]" },
  ];

  const priorityOptions = [
    { value: "all", label: "All Priorities" },
    { value: "Urgent", label: "Urgent" },
    { value: "High", label: "High" },
    { value: "Medium", label: "Medium" },
    { value: "Low", label: "Low" },
  ];

  const assigneeOptions = useMemo(() => {
    const list = [{ value: "all", label: "All Assignees" }];
    users.forEach((u) => {
      list.push({ value: u.id, label: u.name });
    });
    return list;
  }, [users]);

  const sortOptions = [
    { value: "due-asc", label: "Due Date (asc)" },
    { value: "due-desc", label: "Due Date (desc)" },
    { value: "priority", label: "Priority" },
    { value: "assignee", label: "Assignee (A-Z)" },
    { value: "office", label: "Office (A-Z)" },
    { value: "created", label: "Created (newest)" },
  ];

  const groupOptions = [
    { value: "status", label: "By Status" },
    { value: "priority", label: "By Priority" },
    { value: "assignee", label: "By Assignee" },
  ];

  // Calendar monthly generators & navigators
  const calendarDays = useMemo(() => {
    return getDaysInMonth(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const monthLabel = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [currentYear, currentMonth]);

  function prevMonth() {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }

  function nextMonth() {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }

  function goToday() {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row animate-fade-in relative overflow-hidden">
      {/* Left VIEWS panel sidebar */}
      <div className="w-full md:w-60 shrink-0 border-r border-slate-200/60 bg-white p-5 flex flex-col justify-between">
        <div className="space-y-5">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase select-none">Views</span>
            <div className="mt-2.5 flex flex-col gap-0.5">
              {filterTabs.map((t) => {
                const isActive = activeTab === t.scope;
                let count = 0;
                if (t.scope === "all") count = tabCounts.all;
                else if (t.scope === "mine") count = tabCounts.mine;
                else if (t.scope === "overdue") count = tabCounts.overdue;
                else if (t.scope === "today") count = tabCounts.today;
                else if (t.scope === "week") count = tabCounts.week;
                else if (t.scope === "unassigned") count = tabCounts.scheduled;
                else if (t.label === "Unassigned") count = tabCounts.unassigned;
                else count = tabCounts.done;

                return (
                  <button
                    key={t.label}
                    onClick={() => {
                      setActiveTab(t.scope);
                      setSelectedTask(null);
                    }}
                    className={`flex items-center justify-between w-full text-left rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#fff5ec] text-[#e05638]"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <span>{t.label}</span>
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        isActive ? "bg-[#e05638]/10 text-[#e05638]" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Views panel bottom items */}
        <div className="mt-6 pt-3 border-t border-slate-100 flex flex-col gap-0.5">
          <button className="flex items-center gap-2.5 w-full text-left rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Manage Statuses</span>
          </button>
          <button className="flex items-center gap-2.5 w-full text-left rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors">
            <FileText className="h-4 w-4" />
            <span>Templates</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-row min-w-0 overflow-hidden h-screen">
        {/* Task lists / Calendar board container */}
        <div className="flex-1 p-6 md:p-7 overflow-y-auto space-y-5 flex flex-col h-full min-w-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
            <div className="space-y-0.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tasks</h1>
              <p className="text-xs font-medium text-slate-400">
                Track follow-ups, onboarding, and internal work.
              </p>
            </div>

            {/* Action header items */}
            <div className="flex items-center flex-wrap gap-2">
              <div className="relative min-w-[240px] flex-1 md:flex-initial">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder="Search tasks, accounts, pe..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full md:w-60 rounded-lg border border-slate-200 bg-white py-1.5 pl-8.5 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#e05638]/20 focus:border-[#e05638] transition-all shadow-xs"
                />
              </div>
              <button
                onClick={() => setNewOpen(true)}
                className="inline-flex items-center justify-center gap-1 h-8 px-3 rounded-lg bg-[#e05638] text-xs font-bold text-white shadow-sm hover:bg-[#e05638]/90 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span>New Task</span>
              </button>
              <button className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer">
                My Focus
              </button>
            </div>
          </div>

          {/* Sub-header Filters Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/50 pb-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200/20 mr-1 shadow-xs">
                <button
                  onClick={() => {
                    setViewMode("list");
                    setSelectedTask(null);
                  }}
                  className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                    viewMode === "list"
                      ? "text-[#e05638] bg-white border border-[#e05638]/20 shadow-xs"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  aria-label="List view"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setViewMode("calendar");
                    setSelectedTask(null);
                  }}
                  className={`rounded-md p-1.5 transition-all cursor-pointer ${
                    viewMode === "calendar"
                      ? "text-[#e05638] bg-white border border-[#e05638] shadow-xs"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  aria-label="Calendar view"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Dropdowns filters */}
              <CustomDropdown
                label="All Statuses"
                options={statusOptions}
                selected={statusFilter}
                onSelect={setStatusFilter}
                showDot
                width="w-36"
              />
              <CustomDropdown
                label="All Priorities"
                options={priorityOptions}
                selected={priorityFilter}
                onSelect={setPriorityFilter}
                width="w-36"
              />
              <CustomDropdown
                label="All Assignees"
                options={assigneeOptions}
                selected={assigneeFilter}
                onSelect={setAssigneeFilter}
                width="w-40"
              />
              
              {viewMode === "list" && (
                <>
                  <CustomDropdown
                    label="Due Date (asc)"
                    options={sortOptions}
                    selected={sortBy}
                    onSelect={setSortBy}
                    width="w-36"
                  />
                  <CustomDropdown
                    label="By Status"
                    options={groupOptions}
                    selected={groupBy}
                    onSelect={setGroupBy}
                    width="w-32"
                    isGroupFilter={true}
                  />
                </>
              )}
            </div>

            <button className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors px-1 py-1 cursor-pointer">
              <Bookmark className="h-3.5 w-3.5" />
              <span>Save view</span>
            </button>
          </div>

          {/* Primary Tasks display state handler */}
          {tasksQuery.isLoading && (
            <div className="pt-12 flex items-center justify-center flex-col gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              <span className="text-xs font-semibold text-slate-400">Loading task items...</span>
            </div>
          )}
          {tasksQuery.isError && (
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-5 text-center text-xs text-red-600 font-semibold max-w-lg mx-auto shadow-sm">
              {(tasksQuery.error as Error).message || "Failed to load tasks database."}
            </div>
          )}

          {/* Render List View Mode */}
          {!tasksQuery.isLoading && !tasksQuery.isError && viewMode === "list" && (
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {Object.keys(computedGroups).map((groupKey) => {
                const groupTasks = computedGroups[groupKey] || [];
                const isOpen = openGroups[groupKey] !== false;
                const isCoreStatus = groupKey === "To Do" || groupKey === "In Progress" || groupKey === "Done";
                const hasFilters = statusFilter !== "all" || priorityFilter !== "all" || assigneeFilter !== "all" || search.trim() !== "";

                if (groupTasks.length === 0) {
                  if (hasFilters || !isCoreStatus) {
                    return null;
                  }
                }

                const isStatusType = groupBy === "status";
                const sBorder = isStatusType ? statusBorderColors[groupKey as TaskStatus] : "border-l-slate-300";

                return (
                  <div key={groupKey} className="space-y-2">
                    <div className={`flex items-center justify-between bg-white border border-slate-200/80 rounded-xl px-4 py-2 shadow-xs border-l-[3px] ${sBorder}`}>
                      <button
                        onClick={() =>
                          setOpenGroups((prev) => ({ ...prev, [groupKey]: !isOpen }))
                        }
                        className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer flex-1"
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
                        )}
                        <span className="text-sm font-bold text-slate-800 tracking-tight">{groupKey}</span>
                        <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-slate-100 px-1 text-[10px] font-bold text-slate-500">
                          {groupTasks.length}
                        </span>
                      </button>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setNewOpen(true)}
                          className="rounded-md p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                          aria-label="Add item"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                          aria-label="More group options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="space-y-1.5 pl-1">
                        {groupTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            officeName={task.office ? officeNameById.get(task.office) : undefined}
                            assigneeName={task.assignee ? userNameById.get(task.assignee) : undefined}
                            isSelected={selectedTask?.id === task.id}
                            onStatusChange={handleStatusChange}
                            onSelect={() => setSelectedTask(task)}
                            onEdit={(t) => {
                              setEditingTask(t);
                              setEditOpen(true);
                            }}
                            onDelete={async (id) => {
                              if (confirm("Delete this task?")) {
                                await deleteTask.mutateAsync(id);
                                if (selectedTask?.id === id) setSelectedTask(null);
                              }
                            }}
                          />
                        ))}
                        {groupTasks.length === 0 && (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-white/40 px-3 py-6 text-center text-xs font-semibold text-slate-400 italic">
                            No tasks inside this group
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Render Monthly Calendar View Mode */}
          {!tasksQuery.isLoading && !tasksQuery.isError && viewMode === "calendar" && (
            <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200/70 rounded-2xl p-4.5 shadow-xs space-y-4">
              <div className="flex items-center justify-between shrink-0">
                <span className="text-sm font-extrabold text-slate-800 tracking-tight">{monthLabel}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3.5 mr-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-[#ff9f43]" />
                      Task
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
                      Meeting
                    </span>
                  </div>
                  <div className="flex items-center bg-slate-50 border border-slate-200/60 rounded-lg p-0.5 shadow-xs">
                    <button
                      onClick={prevMonth}
                      className="p-1 rounded-md text-slate-500 hover:bg-white hover:text-slate-800 transition-all cursor-pointer"
                      aria-label="Previous month"
                    >
                      <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                    </button>
                    <button
                      onClick={goToday}
                      className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold text-slate-600 bg-white shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      onClick={nextMonth}
                      className="p-1 rounded-md text-slate-500 hover:bg-white hover:text-slate-800 transition-all cursor-pointer"
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-7 grid-rows-6 border-t border-l border-slate-100 rounded-lg overflow-hidden min-h-0 bg-slate-50/20">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName, idx) => (
                  <div
                    key={idx}
                    className="border-r border-b border-slate-100 py-1.5 bg-slate-50/50 text-center text-[10px] font-extrabold tracking-wide text-slate-400 uppercase select-none shrink-0"
                  >
                    {dayName}
                  </div>
                ))}

                {calendarDays.map((cellDate, idx) => {
                  const isCurrentMonth = cellDate.getMonth() === currentMonth;
                  const dateNum = cellDate.getDate();
                  const isToday = cellDate.getFullYear() === 2026 && cellDate.getMonth() === 4 && dateNum === 28;

                  const dayTasks = processedTasks.filter((t) => {
                    if (!t.dueAt) return false;
                    const due = new Date(t.dueAt);
                    return (
                      due.getFullYear() === cellDate.getFullYear() &&
                      due.getMonth() === cellDate.getMonth() &&
                      due.getDate() === dateNum
                    );
                  });

                  const dayMeetings = meetings.filter((m) => {
                    const start = new Date(m.startAt);
                    return (
                      start.getFullYear() === cellDate.getFullYear() &&
                      start.getMonth() === cellDate.getMonth() &&
                      start.getDate() === dateNum
                    );
                  });

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedTask(null);
                        setDueAt(cellDate);
                        setNewOpen(true);
                      }}
                      className={`border-r border-b border-slate-100 p-1 flex flex-col justify-between group/cell transition-colors cursor-pointer hover:bg-slate-50/45 min-h-[70px] ${
                        isCurrentMonth ? "bg-white" : "bg-slate-50/30 text-slate-300"
                      } ${isToday ? "border-[#e05638] border-2 bg-[#fff5ec]/15 rounded-md" : ""}`}
                    >
                      <div className="flex items-center justify-between shrink-0">
                        {isToday ? (
                          <span className="h-5 w-5 rounded-full flex items-center justify-center bg-[#e05638] text-white text-[10px] font-extrabold shadow-sm select-none">
                            {dateNum}
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold text-slate-400 select-none p-1">
                            {dateNum}
                          </span>
                        )}
                        
                        {dayTasks.length > 0 && !isToday && (
                          <span className="text-[9px] font-bold text-slate-300 pr-1 select-none">
                            {dayTasks.length}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col gap-0.5 justify-end mt-1 overflow-hidden select-none">
                        {dayMeetings.map((m) => (
                          <div
                            key={m.id}
                            className="bg-[#eff6ff] text-[#2563eb] border-l-2 border-[#2563eb] text-[9px] font-bold px-1 py-0.5 rounded-sm truncate flex items-center gap-0.5"
                          >
                            <Clock className="h-2 w-2 shrink-0" />
                            <span className="truncate">{m.title}</span>
                          </div>
                        ))}

                        {dayTasks.map((t) => {
                          const priorityBadge = priorityStyles[t.priority] || priorityStyles.Medium;
                          const isSel = selectedTask?.id === t.id;
                          return (
                            <div
                              key={t.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(t);
                              }}
                              className={`bg-[#fff5ec] text-[#e05638] border-l-2 border-[#e05638] text-[9px] font-extrabold px-1 py-0.5 rounded-sm truncate transition-all ${
                                isSel ? "ring-2 ring-[#e05638]" : "hover:brightness-95"
                              }`}
                            >
                              <span className="truncate">{t.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right-Hand Task Detail Drawer Panel */}
        {selectedTask && (
          <TaskDetailDrawer
            task={selectedTask}
            users={users}
            offices={offices}
            allTasks={allTasks}
            userNameById={userNameById}
            officeNameById={officeNameById}
            onClose={() => setSelectedTask(null)}
            onStatusChange={handleStatusChange}
            onTaskUpdate={async (updated) => {
              setSelectedTask(updated);
              tasksQuery.refetch();
            }}
            onDelete={async (id) => {
              if (confirm("Delete this task?")) {
                await deleteTask.mutateAsync(id);
                setSelectedTask(null);
              }
            }}
          />
        )}
      </div>

      <NewTaskDialog
        open={newOpen}
        onOpenChange={(val) => {
          setNewOpen(val);
          if (!val) setDueAt(undefined);
        }}
        users={users}
        offices={offices}
        allTasks={allTasks}
        defaultDueAt={dueAt}
      />
      <EditTaskDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        task={editingTask}
        users={users}
        offices={offices}
        allTasks={allTasks}
      />
    </div>
  );
}

// Right-Hand Task Details Drawer Component
function TaskDetailDrawer({
  task,
  users,
  offices,
  allTasks,
  userNameById,
  officeNameById,
  onClose,
  onStatusChange,
  onTaskUpdate,
  onDelete,
}: {
  task: Task;
  users: any[];
  offices: any[];
  allTasks: Task[];
  userNameById: Map<string, string>;
  officeNameById: Map<string, string>;
  onClose: () => void;
  onStatusChange: (id: string, s: TaskStatus) => void;
  onTaskUpdate: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const update = useUpdateTask();
  const create = useCreateTask();

  const [activeSubTab, setActiveSubTab] = useState<"overview" | "details" | "notes" | "activity">("overview");
  const [newCheckText, setNewCheckText] = useState("");

  const due = formatDue(task);
  const checklist = parseChecklist(task.description);

  async function handleFieldUpdate<K extends keyof Task>(key: K, val: any) {
    try {
      const updated = await update.mutateAsync({
        id: task.id,
        patch: { [key]: val },
      });
      onTaskUpdate(updated);
    } catch (e) {
      console.error(e);
    }
  }

  // Checklist Checkbox selection toggler
  async function toggleCheckIndex(idx: number) {
    if (!task.description) return;
    const newDesc = toggleSubtaskMarkdown(task.description, idx);
    await handleFieldUpdate("description", newDesc);
  }

  // Add a new checklist item
  async function addCheckItem() {
    if (!newCheckText.trim()) return;
    const newDesc = addSubtaskMarkdown(task.description || "", newCheckText.trim());
    await handleFieldUpdate("description", newDesc);
    setNewCheckText("");
  }

  // Duplicate task action
  async function duplicateTask() {
    try {
      await create.mutateAsync({
        title: `${task.title} (Copy)`,
        description: task.description,
        priority: task.priority,
        office: task.office,
        assignee: task.assignee,
        status: "To Do",
      });
      onClose();
    } catch (e) {
      console.error(e);
    }
  }

  // Extract separate checklist lists
  const checklistItems = useMemo(() => {
    if (!task.description) return [];
    const lines = task.description.split("\n");
    const list: { checked: boolean; text: string; rawIdx: number }[] = [];
    let rawIdx = 0;
    
    lines.forEach((line) => {
      const match = line.match(/^\s*-\s*\[( |x)\]\s*(.*)/i);
      if (match) {
        list.push({
          checked: match[1]!.toLowerCase().includes("x"),
          text: match[2] || "",
          rawIdx: rawIdx++,
        });
      }
    });
    return list;
  }, [task.description]);

  return (
    <div className="w-full md:w-[380px] shrink-0 border-l border-slate-200/80 bg-white p-5 h-full overflow-y-auto space-y-5 animate-slide-in shadow-lg select-none flex flex-col min-h-0 relative z-10">
      <div className="flex items-start justify-between gap-3 shrink-0">
        <div className="space-y-1.5 flex-1 min-w-0">
          <h2 className="text-sm font-bold text-slate-800 tracking-tight pr-2 leading-tight">
            {task.title}
          </h2>
          {due.overdue && (
            <span className="inline-flex items-center rounded-md bg-red-50 border border-red-100 px-2 py-0.5 text-[9px] font-extrabold uppercase text-red-600">
              {due.label}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3.5 shrink-0 bg-slate-50/50 p-3.5 border border-slate-200/30 rounded-xl">
        {/* Status selection */}
        <div className="grid grid-cols-3 items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase select-none">Status</span>
          <div className="col-span-2">
            <Select
              value={task.status}
              onValueChange={(v) => onStatusChange(task.id, v as TaskStatus)}
            >
              <SelectTrigger className="rounded-lg border-slate-200 text-xs h-8.5 bg-white select-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {Object.keys(statusDotColors).map((st) => (
                  <SelectItem key={st} value={st}>
                    <span className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusDotColors[st as TaskStatus]}`} />
                      {st}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Priority selection */}
        <div className="grid grid-cols-3 items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase select-none">Priority</span>
          <div className="col-span-2">
            <Select
              value={task.priority}
              onValueChange={(v) => handleFieldUpdate("priority", v as TaskPriority)}
            >
              <SelectTrigger className="rounded-lg border-slate-200 text-xs h-8.5 bg-white select-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="Urgent">Urgent</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Assignee selection */}
        <div className="grid grid-cols-3 items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase select-none">Assignee</span>
          <div className="col-span-2">
            <Select
              value={task.assignee || "none"}
              onValueChange={(v) => handleFieldUpdate("assignee", v === "none" ? undefined : v)}
            >
              <SelectTrigger className="rounded-lg border-slate-200 text-xs h-8.5 bg-white select-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="none">Unassigned</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Due date picker */}
        <div className="grid grid-cols-3 items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase select-none">Due Date</span>
          <div className="col-span-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start rounded-lg border-slate-200 text-xs h-8.5 bg-white text-left font-semibold">
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                  {task.dueAt ? new Date(task.dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : <span className="text-slate-400">Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                <Calendar
                  mode="single"
                  selected={task.dueAt ? new Date(task.dueAt) : undefined}
                  onSelect={(date) => handleFieldUpdate("dueAt", date ? date.toISOString() : undefined)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Action buttons section */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4 shrink-0 select-none">
        <button
          onClick={() => onStatusChange(task.id, "Done")}
          className="flex-1 inline-flex items-center justify-center gap-1 h-8 rounded-lg bg-[#e05638] text-white text-xs font-bold shadow-xs hover:bg-[#e05638]/90 transition-colors cursor-pointer"
        >
          <Check className="h-3.5 w-3.5 shrink-0" />
          <span>Complete</span>
        </button>
        <button
          onClick={duplicateTask}
          className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold cursor-pointer"
          aria-label="Duplicate"
        >
          <Copy className="h-3.5 w-3.5 shrink-0" />
          <span>Duplicate</span>
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="inline-flex items-center justify-center gap-1 h-8 px-2.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 text-xs font-bold cursor-pointer"
          aria-label="Delete"
        >
          <Trash2 className="h-3.5 w-3.5 shrink-0" />
          <span>Delete</span>
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200/50 shrink-0 select-none">
        {["Overview", "Details", "Notes", "Activity"].map((tabName) => {
          const tabKey = tabName.toLowerCase() as "overview" | "details" | "notes" | "activity";
          const isActive = activeSubTab === tabKey;
          return (
            <button
              key={tabKey}
              onClick={() => setActiveSubTab(tabKey)}
              className={`flex-1 pb-2.5 text-center text-xs font-bold border-b-2 cursor-pointer transition-colors ${
                isActive ? "border-[#e05638] text-[#e05638]" : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tabName}
            </button>
          );
        })}
      </div>

      {/* Tab Contents area */}
      <div className="flex-1 overflow-y-auto space-y-5 min-h-0">
        {activeSubTab === "overview" && (
          <div className="space-y-5 py-1">
            <div className="space-y-2 select-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase select-none tracking-wider flex items-center gap-1">
                <CheckSquare className="h-3.5 w-3.5" />
                Checklist
              </span>
              
              <div className="space-y-1.5 pl-0.5">
                {checklistItems.map((item) => (
                  <label
                    key={item.rawIdx}
                    className="flex items-start gap-2.5 rounded-lg p-1.5 hover:bg-slate-50 cursor-pointer transition-colors group/item"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleCheckIndex(item.rawIdx)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-[#e05638] focus:ring-[#e05638]/20 cursor-pointer"
                    />
                    <span className={`text-xs font-semibold leading-tight ${
                      item.checked ? "text-slate-400 line-through font-normal" : "text-slate-700"
                    }`}>
                      {item.text}
                    </span>
                  </label>
                ))}
                {checklistItems.length === 0 && (
                  <p className="text-xs font-semibold text-slate-400 italic pl-1 select-none">
                    No checklist items yet.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-2 select-none">
                <input
                  type="text"
                  placeholder="Add checklist item"
                  value={newCheckText}
                  onChange={(e) => setNewCheckText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCheckItem()}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#e05638]/20"
                />
                <button
                  onClick={addCheckItem}
                  className="rounded-lg p-1.5 border border-slate-200 hover:bg-slate-50 cursor-pointer shrink-0 text-slate-500 hover:text-slate-800 transition-colors"
                  aria-label="Add checklist item"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 select-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase select-none tracking-wider flex items-center gap-1">
                <ArrowRight className="h-3.5 w-3.5" />
                Subtasks
              </span>
              <p className="text-xs font-semibold text-slate-400 italic pl-1">
                No subtasks yet.
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <input
                  type="text"
                  placeholder="Add subtask"
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1"
                  disabled
                />
                <button className="rounded-lg p-1.5 border border-slate-200 text-slate-300 shrink-0 cursor-not-allowed" disabled>
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 select-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 select-none">
                <FolderOpen className="h-3.5 w-3.5 font-bold" />
                Blocked by
              </span>
              <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 text-xs font-semibold shadow-xs cursor-pointer select-none">
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span>Add dependency</span>
              </button>
            </div>
          </div>
        )}

        {activeSubTab === "details" && (
          <div className="space-y-3 py-1 bg-slate-50/20 p-2.5 rounded-xl border border-slate-100">
            <h3 className="text-xs font-bold text-slate-800">Metadata Details</h3>
            <div className="space-y-1.5 text-[11px] text-slate-600">
              <p><span className="font-semibold">Task ID:</span> {task.id}</p>
              <p><span className="font-semibold">Created By:</span> {userNameById.get(task.createdBy) || task.createdBy}</p>
              <p><span className="font-semibold">Created At:</span> {new Date(task.createdAt).toLocaleString()}</p>
              <p><span className="font-semibold">Last Updated:</span> {new Date(task.updatedAt).toLocaleString()}</p>
              {task.parentTask && <p><span className="font-semibold">Parent Task ID:</span> {task.parentTask}</p>}
              {task.recurring && <p><span className="font-semibold">Recurring Status:</span> Active</p>}
            </div>
          </div>
        )}

        {activeSubTab === "notes" && (
          <div className="space-y-3 py-1">
            <h3 className="text-xs font-bold text-slate-800">Additional Notes</h3>
            <textarea
              value={task.notes || ""}
              onChange={(e) => handleFieldUpdate("notes", e.target.value)}
              placeholder="Add additional task notes here..."
              rows={6}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 resize-none"
            />
          </div>
        )}

        {activeSubTab === "activity" && (
          <div className="space-y-3 py-1">
            <h3 className="text-xs font-bold text-slate-800">Activity History Log</h3>
            <p className="text-[10px] font-medium text-slate-400 italic">
              No recent changes logged.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact task list card with selection support
function TaskRow({
  task,
  officeName,
  assigneeName,
  isSelected,
  onStatusChange,
  onSelect,
  onEdit,
  onDelete,
}: {
  task: Task;
  officeName?: string;
  assigneeName?: string;
  isSelected?: boolean;
  onStatusChange: (id: string, s: TaskStatus) => void;
  onSelect: () => void;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pStyle = priorityStyles[task.priority] || priorityStyles.Medium;
  const due = formatDue(task);
  const checklist = parseChecklist(task.description);

  // Assignee initials
  const initials = useMemo(() => {
    if (!assigneeName) return "";
    const parts = assigneeName.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    }
    return parts[0] ? parts[0].substring(0, 2).toUpperCase() : "";
  }, [assigneeName]);

  // Color matching initials
  const avatarBg = useMemo(() => {
    if (!initials) return "bg-slate-100 text-slate-500";
    const sum = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
    const avColors = [
      "bg-[#eff6ff] text-[#2563eb] border-[#dbeafe]",
      "bg-[#faf5ff] text-[#7c3aed] border-[#f3e8ff]",
      "bg-[#fffbeb] text-[#d97706] border-[#fef3c7]",
      "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]",
      "bg-[#fff5f5] text-[#e53e3e] border-[#fed7d7]",
    ];
    return avColors[sum % avColors.length];
  }, [initials]);

  return (
    <div
      onClick={onSelect}
      onDoubleClick={() => onEdit(task)}
      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border bg-white px-4 py-3 transition-all hover:shadow-sm hover:border-slate-300 border-slate-200/80 border-l-[4px] ${pStyle.strip} shadow-xs cursor-pointer select-none ${
        isSelected ? "ring-2 ring-[#e05638] border-slate-300" : ""
      }`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2.5">
            <span
              className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase border tracking-wide shrink-0 ${pStyle.text}`}
            >
              {task.priority}
            </span>
            <p className="text-xs font-semibold text-slate-800 tracking-tight truncate max-w-[280px] sm:max-w-[400px]">
              {task.title}
            </p>
          </div>
          
          {officeName && (
            <p className="flex items-center gap-1 text-[10px] font-bold text-slate-400 truncate">
              <Building2 className="h-3 w-3 shrink-0" />
              {officeName}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end flex-wrap gap-3.5 shrink-0 ml-auto sm:ml-initial text-xs">
        {checklist && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100">
            <CheckSquare className="h-3 w-3 text-slate-400" />
            <span className="font-bold text-slate-500 text-[10px]">{`${checklist.completed}/${checklist.total}`}</span>
            <div className="h-1 w-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${checklist.percent}%` }} />
            </div>
          </div>
        )}

        {assigneeName ? (
          <div className="group/avatar relative select-none">
            <div
              className={`h-6.5 w-6.5 rounded-full flex items-center justify-center text-[9px] font-extrabold shadow-xs shrink-0 border ${avatarBg}`}
            >
              {initials}
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/avatar:block bg-slate-900 text-white text-[9px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap shadow-md z-50">
              {assigneeName}
            </div>
          </div>
        ) : (
          <div className="h-6.5 w-6.5 rounded-full flex items-center justify-center bg-slate-50 border border-dashed border-slate-300 text-[9px] text-slate-400 shrink-0 font-bold">
            —
          </div>
        )}

        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 font-bold ${
          due.overdue ? "text-red-500" : "text-slate-500"
        }`}>
          <CalendarDays className="h-3 w-3 shrink-0" />
          <span className="text-[10px]">{due.label}</span>
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold cursor-pointer transition-colors shadow-xs ${statusPillStyles[task.status]}`}
          >
            <span className={`h-1 w-1 rounded-full shrink-0 ${statusDotColors[task.status]}`} />
            {task.status}
          </button>
          
          {menuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-1 z-40 rounded-xl border border-slate-100 bg-white p-1 shadow-md min-w-[150px] animate-in fade-in slide-in-from-top-1 duration-100"
            >
              {Object.keys(statusDotColors).map((st) => (
                <button
                  key={st}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.id, st as TaskStatus);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[10px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusDotColors[st as TaskStatus]}`} />
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative group/actions inline-block text-left">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
            aria-label="Edit item"
          >
            <Edit2 className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
            aria-label="Delete item"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

const TaskCard = TaskRow;

function NewTaskDialog({
  open,
  onOpenChange,
  users,
  offices,
  allTasks,
  defaultDueAt,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  users: any[];
  offices: any[];
  allTasks: Task[];
  defaultDueAt?: Date;
}) {
  const create = useCreateTask();
  
  // Custom dialog form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("To Do");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [dueAt, setDueAt] = useState<Date | undefined>(undefined);
  const [assignee, setAssignee] = useState<string>("none");
  const [office, setOffice] = useState<string>("none");
  const [parentTask, setParentTask] = useState<string>("none");
  const [recurring, setRecurring] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [notes, setNotes] = useState("");
  
  // Checklist dynamic drafting
  const [checklist, setChecklist] = useState<string[]>([]);
  const [newCheckText, setNewCheckText] = useState("");
  
  // Blocked by dependencies selection
  const [blockedBy, setBlockedBy] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && defaultDueAt) {
      setDueAt(defaultDueAt);
    }
  }, [open, defaultDueAt]);

  function reset() {
    setTitle("");
    setDescription("");
    setStatus("To Do");
    setPriority("Medium");
    setStartDate(undefined);
    setDueAt(undefined);
    setAssignee("none");
    setOffice("none");
    setParentTask("none");
    setRecurring(false);
    setSaveAsTemplate(false);
    setNotes("");
    setChecklist([]);
    setNewCheckText("");
    setBlockedBy([]);
    setError(null);
  }

  async function onSave() {
    setError(null);
    try {
      // Compile checklists into markdown inside the description string
      const compiledDescription = [
        description.trim(),
        checklist.map((item) => `- [ ] ${item}`).join("\n"),
      ].filter(Boolean).join("\n\n");

      await create.mutateAsync({
        title: title.trim(),
        description: compiledDescription || undefined,
        status,
        priority,
        startDate: startDate ? startDate.toISOString() : undefined,
        dueAt: dueAt ? dueAt.toISOString() : undefined,
        assignee: assignee === "none" ? undefined : assignee,
        office: office === "none" ? undefined : office,
        parentTask: parentTask === "none" ? undefined : parentTask,
        recurring,
        saveAsTemplate,
        blockedBy: blockedBy.length > 0 ? blockedBy : undefined,
        notes: notes.trim() || undefined,
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create task");
    }
  }

  function addCheckItem() {
    if (!newCheckText.trim()) return;
    setChecklist((prev) => [...prev, newCheckText.trim()]);
    setNewCheckText("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-xl rounded-2xl border-0 p-0 max-h-[90vh] overflow-hidden flex flex-col bg-white shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100/80 bg-slate-50/50">
          <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e05638]/10 text-[#e05638]">
              <Sparkles className="h-4 w-4 shrink-0" />
            </span>
            New Task
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="rounded-lg border-slate-200 text-xs h-9.5 px-3.5 focus:border-[#e05638] focus:ring-2 focus:ring-[#e05638]/10 transition-all font-medium text-slate-800 placeholder:text-slate-400"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description"
              rows={3}
              className="w-full rounded-lg border border-slate-200 p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] resize-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger className="rounded-lg border-slate-200 text-xs h-9.5 focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all font-medium text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {Object.keys(statusDotColors).map((st) => (
                    <SelectItem key={st} value={st} className="text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusDotColors[st as TaskStatus]}`} />
                        {st}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="rounded-lg border-slate-200 text-xs h-9.5 focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all font-medium text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="Urgent" className="text-xs">Urgent</SelectItem>
                  <SelectItem value="High" className="text-xs">High</SelectItem>
                  <SelectItem value="Medium" className="text-xs">Medium</SelectItem>
                  <SelectItem value="Low" className="text-xs">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start Date & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start rounded-lg border-slate-200 text-xs text-left h-9.5 text-slate-700 font-medium hover:bg-slate-50/50 transition-all cursor-pointer">
                    <CalendarDays className="mr-2 h-4 w-4 text-slate-400 shrink-0" />
                    {startDate ? startDate.toLocaleDateString() : <span className="text-slate-400">Pick a start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start rounded-lg border-slate-200 text-xs text-left h-9.5 text-slate-700 font-medium hover:bg-slate-50/50 transition-all cursor-pointer">
                    <CalendarDays className="mr-2 h-4 w-4 text-slate-400 shrink-0" />
                    {dueAt ? dueAt.toLocaleDateString() : <span className="text-slate-400">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                  <Calendar mode="single" selected={dueAt} onSelect={setDueAt} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Assigned To & Related Office */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Assigned To</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger className="rounded-lg border-slate-200 text-xs h-9.5 focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all font-medium text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="none" className="text-xs">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-xs">
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Related Office</Label>
              <Select value={office} onValueChange={setOffice}>
                <SelectTrigger className="rounded-lg border-slate-200 text-xs h-9.5 focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all font-medium text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="none" className="text-xs">None</SelectItem>
                  {offices.map((o) => (
                    <SelectItem key={o.id} value={o.id} className="text-xs">
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Parent Task */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Parent Task (optional)</Label>
            <Select value={parentTask} onValueChange={setParentTask}>
              <SelectTrigger className="rounded-lg border-slate-200 text-xs h-9.5 focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all font-medium text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="none" className="text-xs">None (top-level task)</SelectItem>
                {allTasks.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recurring Task & Save as Template */}
          <div className="grid grid-cols-2 gap-4 py-1">
            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all select-none">
              <input
                type="checkbox"
                id="new-recurring-task-checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#e05638] focus:ring-[#e05638]/20 cursor-pointer transition-all"
              />
              <label htmlFor="new-recurring-task-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                Recurring Task
              </label>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all select-none">
              <input
                type="checkbox"
                id="new-save-template-checkbox"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#e05638] focus:ring-[#e05638]/20 cursor-pointer transition-all"
              />
              <label htmlFor="new-save-template-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                Save as Template
              </label>
            </div>
          </div>

          {/* Checklist Dynamic Area */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Checklist</Label>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {checklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-100 bg-slate-50/40 hover:bg-slate-50/80 transition-all select-none">
                  <CheckSquare className="h-3.5 w-3.5 text-[#e05638] shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 truncate">{item}</span>
                  <button
                    type="button"
                    onClick={() => setChecklist(prev => prev.filter((_, i) => i !== idx))}
                    className="ml-auto p-0.5 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-red-500 cursor-pointer shrink-0 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 mt-1 select-none">
              <input
                type="text"
                placeholder="Add checklist item"
                value={newCheckText}
                onChange={(e) => setNewCheckText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCheckItem())}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all h-9 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={addCheckItem}
                className="rounded-lg p-2 border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shrink-0 text-slate-500 hover:text-slate-800 transition-all h-9 w-9 flex items-center justify-center"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Blocked by Dependencies */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              Blocked by
            </Label>
            
            {blockedBy.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-slate-100 bg-slate-50/30">
                {blockedBy.map((depId) => {
                  const depTitle = allTasks.find(t => t.id === depId)?.title || depId;
                  return (
                    <span key={depId} className="inline-flex items-center gap-1 rounded-md bg-[#e05638]/5 border border-[#e05638]/10 px-2 py-0.5 text-[10px] font-bold text-slate-700 select-none">
                      {depTitle}
                      <button
                        type="button"
                        onClick={() => setBlockedBy(prev => prev.filter(id => id !== depId))}
                        className="text-slate-400 hover:text-red-500 cursor-pointer p-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            <Select onValueChange={(val) => {
              if (val !== "none" && !blockedBy.includes(val)) {
                setBlockedBy(prev => [...prev, val]);
              }
            }}>
              <SelectTrigger className="rounded-lg border-slate-200 text-xs h-9.5 focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all font-medium text-slate-700">
                <SelectValue placeholder="Search tasks to add as dependency..." />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="none" className="text-xs">Select task...</SelectItem>
                {allTasks.filter(t => !blockedBy.includes(t.id)).map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Notes</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
              rows={3}
              className="w-full rounded-lg border border-slate-200 p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] resize-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={create.isPending}
            className="rounded-lg cursor-pointer text-xs h-9 px-4 font-semibold text-slate-600 border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-800 transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={create.isPending || !title.trim()}
            className="rounded-lg bg-[#e05638] text-white hover:bg-[#e05638]/90 cursor-pointer shadow-md hover:shadow-lg transition-all text-xs h-9 px-5.5 font-bold"
          >
            {create.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin shrink-0" />}
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditTaskDialog({
  open,
  onOpenChange,
  task,
  users,
  offices,
  allTasks,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task: Task | null;
  users: any[];
  offices: any[];
  allTasks: Task[];
}) {
  const update = useUpdateTask();
  
  // Custom dialog form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("To Do");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [dueAt, setDueAt] = useState<Date | undefined>(undefined);
  const [assignee, setAssignee] = useState<string>("none");
  const [office, setOffice] = useState<string>("none");
  const [parentTask, setParentTask] = useState<string>("none");
  const [recurring, setRecurring] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [notes, setNotes] = useState("");
  
  // Checklist dynamic drafting
  const [checklist, setChecklist] = useState<string[]>([]);
  const [newCheckText, setNewCheckText] = useState("");
  
  // Blocked by dependencies selection
  const [blockedBy, setBlockedBy] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setStatus(task.status || "To Do");
      setPriority(task.priority || "Medium");
      setStartDate(task.startDate ? new Date(task.startDate) : undefined);
      setDueAt(task.dueAt ? new Date(task.dueAt) : undefined);
      setAssignee(task.assignee || "none");
      setOffice(task.office || "none");
      setParentTask(task.parentTask || "none");
      setRecurring(!!task.recurring);
      setSaveAsTemplate(!!task.saveAsTemplate);
      setNotes(task.notes || "");
      setBlockedBy(task.blockedBy || []);
      setError(null);

      // Extract raw description and check lists from markdown string
      if (task.description) {
        const lines = task.description.split("\n");
        const listText: string[] = [];
        const descText: string[] = [];

        lines.forEach((line) => {
          const match = line.match(/^\s*-\s*\[( |x)\]\s*(.*)/i);
          if (match) {
            listText.push(match[2] || "");
          } else {
            descText.push(line);
          }
        });
        setDescription(descText.join("\n").trim());
        setChecklist(listText);
      } else {
        setDescription("");
        setChecklist([]);
      }
    }
  }, [task, open]);

  async function onSave() {
    if (!task) return;
    setError(null);
    try {
      // Compile checklists into markdown inside the description string
      const compiledDescription = [
        description.trim(),
        checklist.map((item) => `- [ ] ${item}`).join("\n"),
      ].filter(Boolean).join("\n\n");

      await update.mutateAsync({
        id: task.id,
        patch: {
          title: title.trim(),
          description: compiledDescription || undefined,
          status,
          priority,
          startDate: startDate ? startDate.toISOString() : undefined,
          dueAt: dueAt ? dueAt.toISOString() : undefined,
          assignee: assignee === "none" ? undefined : assignee,
          office: office === "none" ? undefined : office,
          parentTask: parentTask === "none" ? undefined : parentTask,
          recurring,
          saveAsTemplate,
          blockedBy: blockedBy.length > 0 ? blockedBy : undefined,
          notes: notes.trim() || undefined,
        },
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update task");
    }
  }

  function addCheckItem() {
    if (!newCheckText.trim()) return;
    setChecklist((prev) => [...prev, newCheckText.trim()]);
    setNewCheckText("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl border-0 p-0 max-h-[90vh] overflow-hidden flex flex-col bg-white shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100/80 bg-slate-50/50">
          <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e05638]/10 text-[#e05638]">
              <Edit2 className="h-4 w-4 shrink-0" />
            </span>
            Edit Task
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border-slate-200 text-xs h-9.5 px-3.5 focus:border-[#e05638] focus:ring-2 focus:ring-[#e05638]/10 transition-all font-medium text-slate-800"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description"
              rows={3}
              className="w-full rounded-lg border border-slate-200 p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] resize-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger className="rounded-lg border-slate-200 text-xs h-9.5 focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all font-medium text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {Object.keys(statusDotColors).map((st) => (
                    <SelectItem key={st} value={st} className="text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusDotColors[st as TaskStatus]}`} />
                        {st}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="rounded-lg border-slate-200 text-xs h-9.5 focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all font-medium text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="Urgent" className="text-xs">Urgent</SelectItem>
                  <SelectItem value="High" className="text-xs">High</SelectItem>
                  <SelectItem value="Medium" className="text-xs">Medium</SelectItem>
                  <SelectItem value="Low" className="text-xs">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start Date & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start rounded-lg border-slate-200 text-xs text-left h-9.5 text-slate-700 font-medium hover:bg-slate-50/50 transition-all cursor-pointer">
                    <CalendarDays className="mr-2 h-4 w-4 text-slate-400 shrink-0" />
                    {startDate ? startDate.toLocaleDateString() : <span className="text-slate-400">Pick a start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start rounded-lg border-slate-200 text-xs text-left h-9.5 text-slate-700 font-medium hover:bg-slate-50/50 transition-all cursor-pointer">
                    <CalendarDays className="mr-2 h-4 w-4 text-slate-400 shrink-0" />
                    {dueAt ? dueAt.toLocaleDateString() : <span className="text-slate-400">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                  <Calendar mode="single" selected={dueAt} onSelect={setDueAt} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Assigned To & Related Office */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Assigned To</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger className="rounded-lg border-slate-200 text-xs h-9.5 focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all font-medium text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="none" className="text-xs">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-xs">
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Related Office</Label>
              <Select value={office} onValueChange={setOffice}>
                <SelectTrigger className="rounded-lg border-slate-200 text-xs h-9.5 focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all font-medium text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="none" className="text-xs">None</SelectItem>
                  {offices.map((o) => (
                    <SelectItem key={o.id} value={o.id} className="text-xs">
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Parent Task */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Parent Task (optional)</Label>
            <Select value={parentTask} onValueChange={setParentTask}>
              <SelectTrigger className="rounded-lg border-slate-200 text-xs h-9.5 focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all font-medium text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="none" className="text-xs">None (top-level task)</SelectItem>
                {allTasks.filter(t => t.id !== task?.id).map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recurring Task & Save as Template */}
          <div className="grid grid-cols-2 gap-4 py-1">
            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all select-none">
              <input
                type="checkbox"
                id="edit-recurring-task-checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#e05638] focus:ring-[#e05638]/20 cursor-pointer transition-all"
              />
              <label htmlFor="edit-recurring-task-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                Recurring Task
              </label>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all select-none">
              <input
                type="checkbox"
                id="edit-save-template-checkbox"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#e05638] focus:ring-[#e05638]/20 cursor-pointer transition-all"
              />
              <label htmlFor="edit-save-template-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                Save as Template
              </label>
            </div>
          </div>

          {/* Checklist Dynamic Area */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Checklist</Label>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {checklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-100 bg-slate-50/40 hover:bg-slate-50/80 transition-all select-none">
                  <CheckSquare className="h-3.5 w-3.5 text-[#e05638] shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 truncate">{item}</span>
                  <button
                    type="button"
                    onClick={() => setChecklist(prev => prev.filter((_, i) => i !== idx))}
                    className="ml-auto p-0.5 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-red-500 cursor-pointer shrink-0 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 mt-1 select-none">
              <input
                type="text"
                placeholder="Add checklist item"
                value={newCheckText}
                onChange={(e) => setNewCheckText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCheckItem())}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all h-9 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={addCheckItem}
                className="rounded-lg p-2 border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shrink-0 text-slate-500 hover:text-slate-800 transition-all h-9 w-9 flex items-center justify-center"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Blocked by Dependencies */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              Blocked by
            </Label>
            
            {blockedBy.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-slate-100 bg-slate-50/30">
                {blockedBy.map((depId) => {
                  const depTitle = allTasks.find(t => t.id === depId)?.title || depId;
                  return (
                    <span key={depId} className="inline-flex items-center gap-1 rounded-md bg-[#e05638]/5 border border-[#e05638]/10 px-2 py-0.5 text-[10px] font-bold text-slate-700 select-none">
                      {depTitle}
                      <button
                        type="button"
                        onClick={() => setBlockedBy(prev => prev.filter(id => id !== depId))}
                        className="text-slate-400 hover:text-red-500 cursor-pointer p-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            <Select onValueChange={(val) => {
              if (val !== "none" && !blockedBy.includes(val)) {
                setBlockedBy(prev => [...prev, val]);
              }
            }}>
              <SelectTrigger className="rounded-lg border-slate-200 text-xs h-9.5 focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all font-medium text-slate-700">
                <SelectValue placeholder="Search tasks to add as dependency..." />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="none" className="text-xs">Select task...</SelectItem>
                {allTasks.filter(t => t.id !== task?.id && !blockedBy.includes(t.id)).map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Notes</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
              rows={3}
              className="w-full rounded-lg border border-slate-200 p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] resize-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={update.isPending}
            className="rounded-lg cursor-pointer text-xs h-9 px-4 font-semibold text-slate-600 border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-800 transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={update.isPending || !title.trim()}
            className="rounded-lg bg-[#e05638] text-white hover:bg-[#e05638]/90 cursor-pointer shadow-md hover:shadow-lg transition-all text-xs h-9 px-5.5 font-bold"
          >
            {update.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin shrink-0" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
