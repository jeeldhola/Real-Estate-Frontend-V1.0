import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  Calendar,
  RefreshCw,
  GripVertical,
  FileText,
  UserCheck,
  UserX,
  CalendarDays,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  useOfficesSummary,
  usePipelineSummary,
  useTasks,
  useMeetings,
  useMessages,
  useMailboxSummary,
  useUsers,
  useOffices,
} from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { PIPELINE_STAGES } from "@/lib/api-types";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — The Appliance Guys" },
      { name: "description", content: "Team overview and pipeline activity." },
    ],
  }),
});

const ranges = ["Today", "Yesterday", "This Week", "This Month", "Date Range"] as const;

function Dashboard() {
  const { user } = useAuth();
  const officesSummary = useOfficesSummary();
  const pipelineSummary = usePipelineSummary();
  const overdueTasks = useTasks({ scope: "overdue" });
  const todayTasks = useTasks({ scope: "today" });
  const allTasks = useTasks();
  const meetings = useMeetings();
  const messages = useMessages({ limit: 5 });
  const mailboxSummary = useMailboxSummary();
  const users = useUsers();
  const officesList = useOffices({ limit: 100 });

  const defaultLeaderboard = [
    {
      id: "mitchell-id",
      name: "Mitchell Wilcox",
      initials: "MW",
      meetingsCount: 1,
      tasksDoneCount: 1,
      dealsCount: 3,
    },
    {
      id: "amrut-id",
      name: "Amrut Ahire",
      initials: "AA",
      meetingsCount: 1,
      tasksDoneCount: 0,
      dealsCount: 2,
    },
  ];

  const hasLeaderboardData = (users.data?.items ?? []).filter((u) => u.role === "manager").length > 0;
  const leaderboardData = hasLeaderboardData
    ? (users.data?.items ?? [])
        .filter((u) => u.role === "manager")
        .map((manager) => {
          const meetingsCount =
            meetings.data?.items.filter((meet) =>
              meet.attendees?.some((att) => {
                const attId = typeof att === "string" ? att : att.id;
                return attId === manager.id;
              })
            ).length ?? 0;

          const tasksDoneCount =
            allTasks.data?.items.filter(
              (t) => t.assignee === manager.id && t.status === "Done"
            ).length ?? 0;

          const dealsCount =
            officesList.data?.items.filter((off) => {
              const amId = typeof off.accountManager === "string" 
                ? off.accountManager 
                : off.accountManager?.id;
              return amId === manager.id;
            }).length ?? 0;

          return {
            id: manager.id,
            name: manager.name,
            initials: manager.initials || manager.name.split(" ").map((n) => n[0]).join("").toUpperCase(),
            meetingsCount,
            tasksDoneCount,
            dealsCount,
          };
        })
        .sort((a, b) => (b.meetingsCount + b.tasksDoneCount + b.dealsCount) - (a.meetingsCount + a.tasksDoneCount + a.dealsCount))
    : defaultLeaderboard;

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60_000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 30) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "recent";
    }
  };

  const officesTotal = officesSummary.data?.total ?? 0;
  const officesActive = officesSummary.data?.Active ?? 0;
  const officesLapsing = officesSummary.data?.Lapsing ?? 0;
  const officesInactive = officesSummary.data?.Inactive ?? 0;
  const pipelineTotal = Object.values(pipelineSummary.data?.counts ?? {}).reduce(
    (a, b) => a + b,
    0,
  );

  const meetingsToday = meetings.data?.items.filter((m) => {
    const start = new Date(m.startAt);
    const today = new Date();
    return start.toDateString() === today.toDateString();
  }).length ?? 0;

  const meetingsScheduled = meetings.data?.items.filter((m) => m.status === "scheduled").length ?? 0;

  const stats = [
    {
      label: "Agency Offices",
      value: String(officesTotal),
      sub: `${officesActive} active · ${officesLapsing} lapsing · ${officesInactive} inactive`,
      icon: Building2,
      bg: "bg-[oklch(0.96_0.03_55)]",
      tone: "bg-[oklch(0.92_0.06_55)] text-primary",
      url: "/agency-offices",
    },
    {
      label: "Pipeline",
      value: String(pipelineTotal),
      sub: "offices in pipeline funnel",
      icon: TrendingUp,
      bg: "bg-[oklch(0.96_0.03_250)]",
      tone: "bg-[oklch(0.92_0.06_250)] text-[oklch(0.55_0.18_250)]",
      url: "/pipeline",
    },
    {
      label: "Overdue Tasks",
      value: String(overdueTasks.data?.total ?? 0),
      sub: `${overdueTasks.data?.total ?? 0} open`,
      icon: AlertTriangle,
      bg: "bg-[oklch(0.96_0.03_25)]",
      tone: "bg-[oklch(0.92_0.06_25)] text-[oklch(0.6_0.22_25)]",
      url: "/tasks",
    },
    {
      label: "Meetings",
      value: String(meetingsToday),
      sub: `${meetingsScheduled} scheduled`,
      icon: Calendar,
      bg: "bg-[oklch(0.96_0.04_60)]",
      tone: "bg-[oklch(0.92_0.07_60)] text-primary",
      url: "/meetings",
    },
  ];

  const pipelineData = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: pipelineSummary.data?.counts[stage] ?? 0,
  }));

  const greeting = user?.name ?? user?.email ?? "there";
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-4 rounded-2xl bg-[oklch(0.97_0.025_55)] px-6 py-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Good day, {greeting}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Team overview · {today}</p>
        </div>
        <button
          onClick={() => {
            officesSummary.refetch();
            pipelineSummary.refetch();
            overdueTasks.refetch();
            todayTasks.refetch();
          }}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          aria-label="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.url} className="block group">
            <HoverCard openDelay={100} closeDelay={100}>
              <HoverCardTrigger asChild>
                <div className={`relative rounded-2xl ${s.bg} p-5 transition-all hover:shadow-md cursor-pointer border border-transparent hover:border-muted-foreground/10`}>
                  <div className="absolute top-3 left-3 text-muted-foreground/30">
                    <GripVertical className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex items-center gap-4 pl-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${s.tone} group-hover:scale-105 transition-transform`}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold leading-none text-foreground">{s.value}</div>
                      <div className="mt-1 text-sm font-semibold text-foreground">{s.label}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground pl-3">{s.sub}</p>
                </div>
              </HoverCardTrigger>
              <HoverCardContent align="start" className="w-60 p-4 rounded-xl border bg-popover shadow-lg" onClick={(e) => e.stopPropagation()}>
                {s.label === "Agency Offices" && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">By Status</h4>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Active</span>
                        <span className="font-semibold text-foreground">{officesActive}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lapsing</span>
                        <span className="font-semibold text-foreground">{officesLapsing}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Inactive</span>
                        <span className="font-semibold text-foreground">{officesInactive}</span>
                      </div>
                    </div>
                  </div>
                )}
                {s.label === "Pipeline" && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">By Key Stages</h4>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Active Account</span>
                        <span className="font-semibold text-foreground">
                          {pipelineSummary.data?.counts["Active Account"] ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Strategic Partner</span>
                        <span className="font-semibold text-foreground">
                          {(pipelineSummary.data?.counts as any)?.["Strategic Partner"] ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pilot Order</span>
                        <span className="font-semibold text-foreground">
                          {(pipelineSummary.data?.counts as any)?.["Pilot Order"] ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-1.5 mt-1.5">
                        <span className="text-muted-foreground font-medium">In Funnel Leads</span>
                        <span className="font-semibold text-foreground">
                          {pipelineTotal -
                            ((pipelineSummary.data?.counts["Active Account"] ?? 0) +
                              ((pipelineSummary.data?.counts as any)?.["Strategic Partner"] ?? 0) +
                              ((pipelineSummary.data?.counts as any)?.["Pilot Order"] ?? 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {s.label === "Overdue Tasks" && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">By Priority</h4>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Urgent</span>
                        <span className="font-semibold text-foreground">
                          {overdueTasks.data?.items.filter((t) => t.priority === "Urgent").length ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">High</span>
                        <span className="font-semibold text-foreground">
                          {overdueTasks.data?.items.filter((t) => t.priority === "High").length ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Medium</span>
                        <span className="font-semibold text-foreground">
                          {overdueTasks.data?.items.filter((t) => t.priority === "Medium").length ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Low</span>
                        <span className="font-semibold text-foreground">
                          {overdueTasks.data?.items.filter((t) => t.priority === "Low").length ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {s.label === "Meetings" && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">By Status</h4>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Scheduled</span>
                        <span className="font-semibold text-foreground">{meetingsScheduled}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Completed</span>
                        <span className="font-semibold text-foreground">
                          {meetings.data?.items.filter((m) => m.status === "completed").length ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cancelled</span>
                        <span className="font-semibold text-foreground">
                          {meetings.data?.items.filter((m) => m.status === "cancelled").length ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </HoverCardContent>
            </HoverCard>
          </Link>
        ))}
      </div>

      {/* Office Visit Activity */}
      <section className="mt-6 rounded-2xl border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Office Visit Activity
          </h2>
          <div className="flex flex-wrap gap-2">
            {ranges.map((r) => {
              const active = r === "This Month";
              return (
                <button
                  key={r}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Info sub-cards inside Office Visit Activity */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl border bg-background p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.96_0.03_55)] text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">16</div>
              <div className="text-xs text-muted-foreground font-semibold">Total Notes</div>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border bg-background p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.96_0.03_250)] text-blue-500">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">4</div>
              <div className="text-xs text-muted-foreground font-semibold font-medium">Engaged</div>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border bg-background p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.96_0.03_60)] text-amber-500">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">0</div>
              <div className="text-xs text-muted-foreground font-semibold font-medium">Unavailable</div>
            </div>
          </div>
        </div>
      </section>

      {/* Middle Row: Pipeline by Stage & Mailbox Activity */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Pipeline Chart */}
        <section className="rounded-2xl border bg-card p-6 xl:col-span-2">
          <div className="flex items-start gap-2">
            <GripVertical className="mt-1 h-4 w-4 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-bold text-foreground">Pipeline by Stage</h2>
              <p className="text-sm text-muted-foreground">
                {pipelineTotal} active deal{pipelineTotal === 1 ? "" : "s"} across all stages
              </p>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} margin={{ top: 10, right: 10, bottom: 50, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.01 60)" />
                <XAxis
                  dataKey="stage"
                  angle={-35}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 11, fill: "oklch(0.5 0.025 50)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "oklch(0.5 0.025 50)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "oklch(0.96 0.025 55)" }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid oklch(0.92 0.01 60)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="oklch(0.66 0.18 42)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Mailbox Activity */}
        <section className="rounded-2xl border bg-card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Mailbox Activity</h2>
            <div className="mt-1 flex items-center gap-3 text-sm">
              <span className="font-semibold text-green-600">
                {mailboxSummary.data?.total ?? 14} <span className="font-normal text-muted-foreground">Active</span>
              </span>
              <span className="font-semibold text-amber-500">
                {mailboxSummary.data?.unread ?? 0} <span className="font-normal text-muted-foreground">Pending</span>
              </span>
            </div>
            <ul className="mt-4 space-y-2.5">
              {(messages.data?.items ?? []).slice(0, 5).map((msg) => (
                <li
                  key={msg.id}
                  className="rounded-xl border bg-background p-3 shadow-xs flex flex-col gap-1 transition-all hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-xs text-foreground truncate max-w-[170px]">
                      {msg.subject}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatTimeAgo(msg.receivedAt)}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {msg.from}
                  </span>
                  <div className="flex justify-end mt-0.5">
                    <span className="rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[9px] font-medium border border-amber-100">
                      Active
                    </span>
                  </div>
                </li>
              ))}
              {(messages.data?.items.length ?? 0) === 0 && (
                <li className="text-sm text-muted-foreground">No recent messages.</li>
              )}
            </ul>
          </div>
        </section>
      </div>

      {/* Third Row: Meetings and AM Leaderboard */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Meetings Section */}
        <section className="rounded-2xl border bg-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <h2 className="text-lg font-bold text-foreground">Meetings</h2>
              </div>
              <div className="flex gap-1.5">
                {["Day", "Week", "Month"].map((m) => {
                  const active = m === "Week";
                  return (
                    <button
                      key={m}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {(meetings.data?.items ?? []).length > 0 ? (
              <ul className="mt-6 space-y-3">
                {(meetings.data?.items ?? []).slice(0, 3).map((meet) => (
                  <li
                    key={meet.id}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3.5 shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground truncate">{meet.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(meet.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {meet.location || "Online"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {new Date(meet.startAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground mb-3">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No meetings for this period.</p>
              </div>
            )}
          </div>
        </section>

        {/* AM Performance Leaderboard */}
        <section className="rounded-2xl border bg-card p-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">AM Performance Leaderboard</h2>
            <p className="text-sm text-muted-foreground">This month's activity</p>
          </div>

          <div className="mt-6 space-y-3">
            {leaderboardData.map((am, index) => (
              <div
                key={am.id}
                className="flex items-start gap-3 rounded-xl border bg-background p-4 shadow-sm"
              >
                <span className="text-sm font-extrabold text-primary shrink-0 mt-1.5">
                  #{index + 1}
                </span>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 ${
                  index === 0 ? "bg-amber-600" : "bg-emerald-600"
                }`}>
                  {am.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-foreground">{am.name}</h4>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-secondary text-muted-foreground px-2 py-0.5 text-[10px] font-medium border border-muted/20">
                      {am.meetingsCount} meetings
                    </span>
                    <span className="rounded-full bg-secondary text-muted-foreground px-2 py-0.5 text-[10px] font-medium border border-muted/20">
                      0 activities
                    </span>
                    <span className="rounded-full bg-secondary text-muted-foreground px-2 py-0.5 text-[10px] font-medium border border-muted/20">
                      {am.tasksDoneCount} tasks done
                    </span>
                    <span className="rounded-full bg-secondary text-muted-foreground px-2 py-0.5 text-[10px] font-medium border border-muted/20">
                      {am.dealsCount} deals
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
