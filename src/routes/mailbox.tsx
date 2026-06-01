import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Mail,
  Search,
  Inbox,
  FileText,
  TrendingUp,
  SlidersHorizontal,
  ArrowUpDown,
  LayoutGrid,
  Star,
  ChevronsUpDown,
  Copy,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Bell,
  HelpCircle,
  Compass,
  Target
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/mailbox")({
  component: MailboxPage,
  head: () => ({
    meta: [
      { title: "Mailbox — HubKonnect" },
      { name: "description", content: "All inbound and workload overview of your inboxes." },
    ],
  }),
});

interface InboxItem {
  id: string;
  name: string;
  address: string;
  unassigned?: number;
  mine?: number;
  assigned?: number;
  draft?: number;
  starred: boolean;
}

const INITIAL_INBOXES: InboxItem[] = [
  { id: "1", name: "COMMERCIAL", address: "email@example.com", starred: true },
  { id: "2", name: "HR TEAM", address: "email@example.com", unassigned: 12, assigned: 5, starred: false },
  { id: "3", name: "KARDI SUPPORT", address: "email@example.com", unassigned: 6, assigned: 0, starred: false },
  { id: "4", name: "PROCUREMENT TEAM", address: "email@example.com", unassigned: 5, assigned: 7, starred: false },
  { id: "5", name: "TAG - ACCOUNT MANAGERS", address: "email@example.com", starred: false },
];

function MailboxPage() {
  const [inboxes, setInboxes] = useState<InboxItem[]>(INITIAL_INBOXES);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter and Sort Logic
  const filteredInboxes = useMemo(() => {
    let result = [...inboxes];
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.address.toLowerCase().includes(query)
      );
    }
    if (sortOrder) {
      result.sort((a, b) => {
        const comp = a.name.localeCompare(b.name);
        return sortOrder === "asc" ? comp : -comp;
      });
    }
    return result;
  }, [inboxes, search, sortOrder]);

  const toggleStar = (id: string) => {
    setInboxes((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, starred: !item.starred } : item
      )
    );
    toast.success("Starred state updated");
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard!");
  };

  const handleSort = () => {
    if (sortOrder === null) setSortOrder("asc");
    else if (sortOrder === "asc") setSortOrder("desc");
    else setSortOrder(null);
    toast.success("Sorting updated");
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast.success("Mailbox up to date!");
    }, 800);
  };

  const stats = [
    {
      label: "Total Inboxes",
      value: 11,
      icon: Mail,
      tint: "bg-[#fdf3f0]/70 border border-[#f5eae2]",
      fg: "text-[#dd5437]",
      trend: "up" as const,
      chevronUp: true,
    },
    {
      label: "Unassigned",
      value: 207,
      icon: Compass,
      tint: "bg-[#fffbf5]/70 border border-[#f5ebd8]",
      fg: "text-amber-600",
      trend: "down" as const,
    },
    {
      label: "Mine",
      value: 6,
      icon: Target,
      tint: "bg-[#f4f8fd]/80 border border-[#e3ecf5]",
      fg: "text-blue-650",
    },
    {
      label: "Assigned",
      value: 183,
      icon: UserCheck,
      tint: "bg-[#f4faf8]/80 border border-[#e2f5ee]",
      fg: "text-emerald-600",
    },
    {
      label: "Draft",
      value: 11,
      icon: FileText,
      tint: "bg-[#faf5ff]/80 border border-[#f3e8ff]",
      fg: "text-purple-600",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Sub Header & Navigation Tab Bar */}
      <div className="flex h-16 w-full items-center justify-between border-b bg-white px-8 shrink-0 select-none">
        <div className="flex items-center gap-1">
          {/* Sub tabs */}
          <div className="flex items-center gap-1 rounded-2xl bg-slate-50 border border-slate-100 p-1">
            <button className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold text-[#dd5437] bg-[#fdf2f0] border border-[#dd5437]/15 cursor-pointer transition-all">
              <Inbox className="h-3.5 w-3.5 text-[#dd5437] stroke-[2.5px]" />
              Inboxes
              <ChevronDown className="h-3 w-3 text-[#dd5437] stroke-[2.5px]" />
            </button>
            <button
              onClick={() => toast.success("Docs clicked")}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 cursor-pointer transition-all border-0 bg-transparent"
            >
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Docs
            </button>
            <button
              onClick={() => toast.success("Templates clicked")}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 cursor-pointer transition-all border-0 bg-transparent"
            >
              <LayoutGrid className="h-3.5 w-3.5 text-slate-400" />
              Templates
            </button>
            <button
              onClick={() => toast.success("Report clicked")}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 cursor-pointer transition-all border-0 bg-transparent"
            >
              <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
              Report
            </button>
            <button
              onClick={() => toast.success("Manage clicked")}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 cursor-pointer transition-all border-0 bg-transparent"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              Manage
            </button>
          </div>
        </div>

        {/* Right side utilities */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => toast.info("Notifications clicked")}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer relative"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-[#dd5437]" />
          </button>
          <button 
            onClick={() => toast.info("Help clicked")}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <HelpCircle className="h-4.5 w-4.5" />
          </button>
          <button 
            onClick={() => toast.info("Global search clicked")}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Search className="h-4.5 w-4.5" />
          </button>
          <div className="h-9 w-9 rounded-full overflow-hidden border border-slate-200 ml-1">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80"
              alt="User profile"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Main Mailbox Content */}
      <div className="flex-1 p-8 bg-slate-50/40">
        {/* Title */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Mailbox
            </h1>
            <p className="mt-1 text-sm text-slate-400 font-medium">
              Overview of your inboxes and workload.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs active:scale-[0.98] transition-all cursor-pointer select-none disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-600 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              className="flex h-9.5 w-9.5 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-all shadow-2xs shrink-0 select-none"
              aria-label="Filter"
              onClick={() => toast.info("Filter clicked")}
            >
              <SlidersHorizontal className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-5">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={`relative flex flex-col justify-between rounded-3xl p-5 shadow-2xs select-none transition-all hover:shadow-xs bg-white ${s.tint}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${s.fg} stroke-[2.2px]`} />
                    <span className="text-xs font-bold text-slate-800">{s.label}</span>
                  </div>

                  <button className="text-slate-400 hover:text-slate-650 bg-transparent border-0 flex items-center justify-center p-1 rounded-lg hover:bg-slate-100/35 transition-colors cursor-pointer focus:outline-none">
                    {s.chevronUp ? (
                      <ChevronDown className="h-4 w-4 text-slate-500 shrink-0 rotate-180" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                </div>

                <div className="mt-5 flex items-end justify-between">
                  <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                    {s.value}
                  </span>

                  <div className="flex flex-col items-end leading-none">
                    {s.trend ? (
                      <div className={`flex items-center gap-0.5 text-xs font-black ${
                        s.trend === "up" ? "text-emerald-500" : "text-rose-500"
                      }`}>
                        {s.trend === "up" ? (
                          <ArrowUpRight className="h-4 w-4 stroke-[3px] shrink-0" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 stroke-[3px] shrink-0" />
                        )}
                        <span>12%</span>
                      </div>
                    ) : (
                      <span className="text-xs font-black text-slate-400">
                        —
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-400 mt-1 select-none whitespace-nowrap leading-none">
                      vs Last Month
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search, Sort and Column actions */}
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search offices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-14 text-xs font-semibold text-slate-700 outline-none focus:border-slate-350 transition-all placeholder:text-slate-400 shadow-sm"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-450 shadow-3xs select-none">
                K <span className="text-[10px]">⌘</span>
              </div>
            </div>

            <button
              onClick={handleSort}
              className="flex h-9.5 items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 text-xs font-bold text-slate-700 shadow-sm focus:outline-none transition-all cursor-pointer hover:bg-slate-50"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
              Sort
            </button>
          </div>

          <button
            onClick={() => toast.info("Column Manager opened")}
            className="flex h-9.5 items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 text-xs font-bold text-slate-700 shadow-sm focus:outline-none transition-all cursor-pointer hover:bg-slate-50"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-slate-500" />
            Manage Column
          </button>
        </div>

        {/* Table of Inboxes */}
        <div className="overflow-x-auto border border-slate-200/80 bg-white rounded-3xl shadow-sm mt-6">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-slate-200/50">
                <th className="w-16 px-6 py-4 text-center select-none">
                  <Star className="h-4 w-4 stroke-slate-400 mx-auto" />
                </th>
                {["Inbox Name", "Address", "Unassigned", "Mine", "Assigned", "Draft"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-6 py-4 text-[11px] font-bold text-slate-500 select-none ${
                      i <= 1 ? "text-left" : "text-center"
                    }`}
                  >
                    <div className={`flex items-center gap-1.5 cursor-pointer hover:text-slate-800 transition-colors ${i <= 1 ? "justify-start" : "justify-center"}`}>
                      <span>{h}</span>
                      <ChevronsUpDown className="h-3 w-3 text-slate-400 shrink-0" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInboxes.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-55/40 transition-colors"
                >
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleStar(item.id)}
                      className="text-slate-350 hover:text-amber-500 bg-transparent border-0 flex items-center justify-center p-1 rounded-lg transition-colors cursor-pointer focus:outline-none mx-auto"
                    >
                      {item.starred ? (
                        <Star className="h-4.5 w-4.5 fill-[#dd5437] text-[#dd5437] stroke-[1.5px]" />
                      ) : (
                        <Star className="h-4.5 w-4.5 stroke-slate-300 stroke-[1.5px]" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <span className="text-xs font-black tracking-wider text-[#dd5437] select-all cursor-pointer">
                      {item.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">
                        {item.address}
                      </span>
                      <button
                        onClick={() => handleCopyAddress(item.address)}
                        className="text-slate-400 hover:text-slate-605 bg-transparent border-0 flex items-center justify-center p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Copy Address"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-xs font-bold text-slate-700">
                    {item.unassigned !== undefined ? item.unassigned : ""}
                  </td>
                  <td className="px-6 py-4 text-center text-xs font-bold text-slate-700">
                    {item.mine !== undefined ? item.mine : ""}
                  </td>
                  <td className="px-6 py-4 text-center text-xs font-bold text-slate-700">
                    {item.assigned !== undefined ? item.assigned : ""}
                  </td>
                  <td className="px-6 py-4 text-center text-xs font-bold text-slate-700">
                    {item.draft !== undefined ? item.draft : ""}
                  </td>
                </tr>
              ))}
              {filteredInboxes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm text-slate-400 font-medium bg-white rounded-b-3xl">
                    No inboxes match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
