import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, type ReactNode } from "react";
import {
  ChevronLeft,
  Pencil,
  ExternalLink,
  Trash2,
  Loader2,
  Copy,
  Archive,
  ArchiveRestore,
  TrendingUp,
  TrendingDown,
  ChevronUp,
  ChevronDown,
  Hash,
  Tag,
  Building2,
  Receipt,
  MapPin,
  Mail,
  Globe,
  Compass,
  User,
  Bell,
  FileText,
  Users,
  UserCheck,
  Home,
  DollarSign,
  Monitor,
  Phone,
  X,
  Minus,
  MoreVertical,
  ChevronsUpDown,
  Calendar,
  CalendarPlus,
  Sparkles,
  Plus,
  Clock,
  Paperclip,
  History,
} from "lucide-react";
import { useDeleteOffice, useOffice, useUpdateOffice, usePropertyManagers, useMeetings, useCreateMeeting } from "@/lib/queries";
import { accountManagerName, type Office } from "@/lib/api-types";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/agency-offices_/$officeId")({
  component: AgencyOfficeDetailPage,
  head: ({ params }) => ({
    meta: [
      { title: `Agency Office — ${params.officeId}` },
      { name: "description", content: "Agency office profile details, contacts and metrics." },
    ],
  }),
});

const TABS = ["Overview", "People", "Meetings", "Notes"] as const;
type Tab = (typeof TABS)[number];

function StatusPill({ status }: { status: string }) {
  if (status === "Scheduled") {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold border border-slate-200 text-slate-700 bg-white select-none">
        Scheduled
      </span>
    );
  }
  if (status === "Completed") {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold border border-emerald-200 text-emerald-700 bg-emerald-50/50 select-none">
        Completed
      </span>
    );
  }
  if (status === "Cancelled" || status === "No Show") {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold border border-rose-200 text-rose-700 bg-rose-50/50 select-none">
        {status}
      </span>
    );
  }

  const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    Active: {
      bg: "bg-[#2093A314]",
      text: "text-[#2093A3]",
      dot: "bg-[#2093A3]",
    },
    Inactive: {
      bg: "bg-[#EF444414]",
      text: "text-[#EF4444]",
      dot: "bg-[#EF4444]",
    },
    Lapsing: {
      bg: "bg-amber-500/8",
      text: "text-amber-600",
      dot: "bg-amber-500",
    },
    Archived: {
      bg: "bg-[#1F1F1F14]",
      text: "text-[#1F1F1F]",
      dot: "bg-[#1F1F1F]",
    },
  };

  const config = statusConfig[status] || statusConfig.Active;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-[6px] rounded-[8px] text-xs font-medium leading-none ${config.bg} ${config.text} select-none`}>
      <span className={`w-1 h-1 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}

function AgencyOfficeDetailPage() {
  const { officeId } = Route.useParams();
  const [tab, setTab] = useState<Tab>("Overview");
  const [cardPeriodFilter, setCardPeriodFilter] = useState("vs Last Month");
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState("");
  const navigate = useNavigate();

  const { data: office, isLoading, isError, error } = useOffice(officeId);
  const deleteOffice = useDeleteOffice();
  const updateOffice = useUpdateOffice();

  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [editTradingName, setEditTradingName] = useState("");
  const [editLegalEntityName, setEditLegalEntityName] = useState("");
  const [editAbn, setEditAbn] = useState("");
  const [editZone, setEditZone] = useState("");
  const [editAccountManager, setEditAccountManager] = useState("");
  const [editInactivityAlert, setEditInactivityAlert] = useState<"none" | "14" | "30" | "60" | "ai">("ai");
  const [editAddress, setEditAddress] = useState("");
  const [editSuburb, setEditSuburb] = useState("");
  const [editState, setEditState] = useState("");
  const [editPostcode, setEditPostcode] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editPum, setEditPum] = useState<number>(600);
  const [editEstimatedMonthlySpend, setEditEstimatedMonthlySpend] = useState<number>(600);
  const [editPlatform, setEditPlatform] = useState("");
  const [editPrincipal, setEditPrincipal] = useState("Andrew Webset");
  const [editHeadPm, setEditHeadPm] = useState("Peter Frank");
  const [editApContact, setEditApContact] = useState("Simon Lee");

  // Sync state with office data
  useEffect(() => {
    if (office) {
      setEditTradingName(office.tradingName ?? office.name);
      setEditLegalEntityName(office.legalEntityName ?? "Jackson Family Trust Settlement");
      setEditAbn(office.abn ?? "38 697 586 501");
      setEditZone(office.zone ?? "5");
      setEditAccountManager(accountManagerName(office.accountManager) ?? "");
      setEditInactivityAlert(office.inactivityAlert ?? "ai");
      setEditAddress(office.address ?? "5 Church Street");
      setEditSuburb(office.suburb ?? "Ryde");
      setEditState(office.state ?? "NSW");
      setEditPostcode(office.postcode ?? "2112");
      setEditPhone(office.phone ?? "02 8878 1900");
      setEditEmail(office.email ?? "info@jacksonrowe.com.au");
      setEditWebsite(office.website ?? "https://jacksonrowe.com.au");
      setEditPum(office.pum ?? 600);
      setEditEstimatedMonthlySpend(office.estimatedMonthlySpend ?? 600);
      setEditPlatform(office.platform ?? "PropertyMe");
    }
  }, [office]);

  const handleSaveOverview = async () => {
    try {
      await updateOffice.mutateAsync({
        id: officeId,
        patch: {
          tradingName: editTradingName,
          legalEntityName: editLegalEntityName,
          abn: editAbn,
          zone: editZone,
          inactivityAlert: editInactivityAlert,
          address: editAddress,
          suburb: editSuburb,
          state: editState,
          postcode: editPostcode,
          phone: editPhone,
          email: editEmail,
          website: editWebsite,
          pum: Number(editPum) || 0,
          estimatedMonthlySpend: Number(editEstimatedMonthlySpend) || 0,
          platform: editPlatform,
        },
      });
      toast.success("Overview details updated successfully!");
      setIsEditingOverview(false);
    } catch (err) {
      toast.error("Failed to save changes");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center p-8 bg-slate-50/20">
        <Loader2 className="h-6 w-6 animate-spin text-[#dd5437]" />
      </div>
    );
  }

  if (isError || !office) {
    return (
      <div className="p-8">
        <Link
          to="/agency-offices"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-slate-400" />
          Back to Locations
        </Link>
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-rose-500 font-bold">
          {(error as Error)?.message ?? "Office not found"}
        </div>
      </div>
    );
  }

  const isArchived = office.status === "Archived";

  const handleCopyName = () => {
    navigator.clipboard.writeText(office.name);
    toast.success(`Copied "${office.name}" to clipboard`);
  };

  const handleArchiveToggle = async () => {
    try {
      const nextStatus = isArchived ? "Active" : "Archived";
      await updateOffice.mutateAsync({
        id: officeId,
        patch: { status: nextStatus },
      });
      toast.success(`Office successfully ${isArchived ? "unarchived" : "archived"}!`);
    } catch (err) {
      toast.error("Failed to update office archiving state");
    }
  };

  const handleConfirmArchive = async () => {
    try {
      await updateOffice.mutateAsync({
        id: officeId,
        patch: { status: "Archived" },
      });
      toast.success("Office successfully archived!");
      setIsArchiveDialogOpen(false);
    } catch (err) {
      toast.error("Failed to archive office");
    }
  };

  const handleConfirmActivate = async () => {
    try {
      await updateOffice.mutateAsync({
        id: officeId,
        patch: { status: "Active" },
      });
      toast.success("Office successfully reactivated!");
      setIsActivateDialogOpen(false);
    } catch (err) {
      toast.error("Failed to reactivate office");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteOffice.mutateAsync(officeId);
      toast.success("Office deleted successfully");
      setIsDeleteDialogOpen(false);
      navigate({ to: "/agency-offices" });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const invoiceStats = [
    {
      label: "Unpaid Invoices",
      value: "18",
      trend: "12%",
      trendDir: "up" as const,
      trendColor: "text-emerald-500",
      trendIcon: TrendingUp,
      icon: Receipt,
      bg: "rgba(216, 90, 43, 0.04)",
      borderColor: "rgba(31, 31, 31, 0.08)",
      fg: "text-[#dd5437]",
    },
    {
      label: "Overdue Invoices",
      value: "18",
      trend: "12%",
      trendDir: "down" as const,
      trendColor: "text-rose-500",
      trendIcon: TrendingDown,
      icon: Receipt,
      bg: "linear-gradient(0deg, rgba(37, 99, 235, 0.04) 0%, rgba(37, 99, 235, 0.04) 100%), #FFF",
      borderColor: "rgba(31, 31, 31, 0.08)",
      fg: "text-blue-600",
    },
    {
      label: "Average Monthly Spend",
      value: "0",
      trend: "—",
      trendDir: "none" as const,
      trendColor: "text-slate-400",
      trendIcon: null,
      icon: DollarSign,
      bg: "rgba(217, 119, 6, 0.04)",
      borderColor: "rgba(31, 31, 31, 0.08)",
      fg: "text-amber-600",
    },
    {
      label: "Open Quotes",
      value: "0",
      trend: "—",
      trendDir: "none" as const,
      trendColor: "text-slate-400",
      trendIcon: null,
      icon: FileText,
      bg: "rgba(239, 68, 68, 0.04)",
      borderColor: "rgba(31, 31, 31, 0.08)",
      fg: "text-rose-600",
    },
    {
      label: "Quote Approval Rate",
      value: "95%",
      trend: "8.3%",
      trendDir: "down" as const,
      trendColor: "text-rose-500",
      trendIcon: TrendingDown,
      icon: UserCheck,
      bg: "rgba(124, 58, 237, 0.04)",
      borderColor: "rgba(31, 31, 31, 0.08)",
      fg: "text-purple-600",
    },
  ];

  return (
    <div className="min-h-full bg-white p-4">
      {/* Header with Inline Back Arrow & Actions */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center border rounded-[8px] p-4" style={{ borderColor: "rgba(31, 31, 31, 0.08)" }}>
        <div className="flex items-center gap-2.5 select-none">
          <Link
            to="/agency-offices"
            className="flex items-center justify-center p-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer mr-1"
          >
            <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
          </Link>
          <h1 className="text-xl font-semibold text-[#1F1F1F] tracking-tight">{office.name}</h1>
          <button
            onClick={handleCopyName}
            className="p-1 text-slate-400 hover:text-[#dd5437] transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
            title="Copy Agency Name"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>

          <span className="ml-2 rounded-[16px] border border-[rgba(31,31,31,0.08)] bg-white px-2.5 py-[3px] text-[11px] font-semibold text-[#1F1F1F] shadow-xs flex items-center h-[26px]">
            #{office.id.slice(-4).toUpperCase()}
          </span>
          <StatusPill status={office.status} />
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={isArchived ? () => setIsActivateDialogOpen(true) : () => setIsArchiveDialogOpen(true)}
            disabled={updateOffice.isPending}
            className="flex items-center gap-2 rounded-[8px] border border-[rgba(31,31,31,0.08)] bg-white px-3.5 py-2 text-sm font-medium text-[#1F1F1F] hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer shadow-3xs h-[36px]"
          >
            {isArchived ? (
              <>
                <ArchiveRestore className="h-4 w-4 text-[#1F1F1F]/70" />
                Unarchive Agency Office
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 text-[#1F1F1F]/70" />
                Archive Agency Office
              </>
            )}
          </button>

          <button
            onClick={() => {
              setConfirmDeleteId("");
              setIsDeleteDialogOpen(true);
            }}
            disabled={deleteOffice.isPending}
            className="flex items-center gap-2 rounded-[8px] border border-rose-200/50 bg-white hover:bg-rose-50 px-3.5 py-2 text-sm font-medium text-[#EF4444] transition-all disabled:opacity-50 cursor-pointer shadow-3xs h-[36px]"
          >
            {deleteOffice.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#EF4444]" />
            ) : (
              <Trash2 className="h-4 w-4 text-[#EF4444]" />
            )}
            Delete Agency Office
          </button>
        </div>
      </div>

      {/* 5-Column Invoices & Quotes Metric Cards Row */}
      <div
        className="mb-6 p-4 border rounded-[16px] bg-white"
        style={{
          borderColor: "rgba(31, 31, 31, 0.08)",
        }}
      >
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {invoiceStats.map((s) => {
            const isUnpaid = s.label === "Unpaid Invoices";
            const CardCaretIcon = isUnpaid ? ChevronUp : ChevronDown;
            return (
              <div
                key={s.label}
                className="flex justify-between items-start self-stretch p-4 border rounded-[16px] select-none transition-all hover:shadow-xs w-full bg-white"
                style={{
                  background: s.bg,
                  borderColor: s.borderColor,
                }}
              >
                {/* Left Column: Icon + Label on top, Value on bottom */}
                <div className="flex flex-col justify-between items-start h-full min-h-[76px]">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${s.fg} bg-white/60 shadow-3xs`}>
                      <s.icon className="h-4 w-4" />
                    </div>
                    <span className="text-base font-semibold" style={{ color: "rgba(31, 31, 31, 0.80)" }}>{s.label}</span>
                  </div>
                  <span className="text-[32px] font-extrabold text-slate-850 tracking-tight leading-none mt-6">
                    {s.value}
                  </span>
                </div>

                {/* Right Column: Caret popover on top, Trend value on bottom */}
                <div className="flex flex-col justify-between items-end h-full min-h-[76px]">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-slate-400 hover:text-slate-655 bg-transparent border-0 flex items-center justify-center p-1 rounded-lg hover:bg-slate-100/35 transition-colors cursor-pointer focus:outline-none">
                        <CardCaretIcon className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1.5 bg-white border border-slate-200 shadow-lg rounded-2xl z-[100]" align="end">
                      <div className="flex flex-col gap-0.5">
                        {["vs Last Month", "vs Last Week", "vs Last Quarter", "vs Last Year"].map((opt) => {
                          const isSelected = cardPeriodFilter === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => setCardPeriodFilter(opt)}
                              className="flex w-full items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl text-left text-slate-655 hover:bg-slate-50 transition-colors cursor-pointer border-0 bg-transparent"
                            >
                              <div className="shrink-0 flex items-center justify-center">
                                {isSelected ? (
                                  <Check className="h-4 w-4 text-[#dd5437]" />
                                ) : (
                                  <div className="h-4 w-4 rounded border border-slate-200" />
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
                    {s.trendDir !== "none" ? (
                      <div className={`flex items-center gap-0.5 text-xs font-extrabold ${s.trendColor}`}>
                        {s.trendIcon && (
                          <s.trendIcon className="h-3.5 w-3.5 shrink-0 stroke-[2.5px]" />
                        )}
                        <span className="text-xs font-semibold">{s.trend}</span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">
                        —
                      </span>
                    )}
                    <span className="text-xs font-medium mt-0.5 select-none whitespace-nowrap leading-none" style={{ color: "rgba(31, 31, 31, 0.64)" }}>
                      {cardPeriodFilter}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>


      <div className="mb-6 p-4 border rounded-[16px] bg-white"
        style={{
          borderColor: "rgba(31, 31, 31, 0.08)",
        }}>
        <>

          {/* Tabs Menu Header & Actions Row */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            {/* Left Side: Tabs Menu Header */}
            <div className="flex bg-slate-100/60 rounded-lg p-1 gap-7 border border-[#1F1F1F]/4  select-none">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-md px-5 py-2 text-sm font-medium transition-all cursor-pointer border-0 ${tab === t
                    ? "bg-white text-[#1F1F1F] shadow-sm"
                    : ""
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Right Side: Customize Pencil Action or Save/Cancel Actions */}
            {isEditingOverview ? (
              <div className="flex items-center gap-2.5 mr-1 animate-in fade-in duration-200 shrink-0">
                {/* Trash button */}
                <button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="rounded-xl border border-rose-200 bg-white p-2 text-rose-500 hover:bg-rose-50 transition-all shadow-3xs cursor-pointer border-0 flex items-center justify-center h-9 w-9"
                  title="Delete Permanently"
                >
                  <Trash2 className="h-3.5 w-3.5 animate-pulse" />
                </button>

                {/* Check/Save button */}
                <button
                  onClick={handleSaveOverview}
                  disabled={updateOffice.isPending}
                  className="rounded-xl bg-[#dd5437] hover:bg-[#c9492f] p-2 text-white transition-all shadow-3xs cursor-pointer border-0 flex items-center justify-center h-9 w-9 disabled:opacity-50"
                  title="Save Changes"
                >
                  {updateOffice.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5 stroke-[3px]" />
                  )}
                </button>

                {/* X/Cancel button */}
                <button
                  onClick={() => setIsEditingOverview(false)}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 transition-all shadow-3xs cursor-pointer border-0 flex items-center justify-center h-9 w-9"
                  title="Cancel Editing"
                >
                  <X className="h-3.5 w-3.5 stroke-[2.5px]" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setTab("Overview");
                  setIsEditingOverview(true);
                }}
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all shadow-3xs cursor-pointer mr-1 flex items-center justify-center h-9 w-9 shrink-0"
                title="Edit Details"
              >
                <Pencil className="h-4 w-4 text-slate-500" />
              </button>
            )}
          </div>

          {/* Tab Render Switcher */}
          {tab === "Overview" && (
            <OverviewTab
              office={office}
              isEditing={isEditingOverview}
              editTradingName={editTradingName}
              setEditTradingName={setEditTradingName}
              editLegalEntityName={editLegalEntityName}
              setEditLegalEntityName={setEditLegalEntityName}
              editAbn={editAbn}
              setEditAbn={setEditAbn}
              editZone={editZone}
              setEditZone={setEditZone}
              editAccountManager={editAccountManager}
              setEditAccountManager={setEditAccountManager}
              editInactivityAlert={editInactivityAlert}
              setEditInactivityAlert={setEditInactivityAlert}
              editAddress={editAddress}
              setEditAddress={setEditAddress}
              editSuburb={editSuburb}
              setEditSuburb={setEditSuburb}
              editState={editState}
              setEditState={setEditState}
              editPostcode={editPostcode}
              setEditPostcode={setEditPostcode}
              editPhone={editPhone}
              setEditPhone={setEditPhone}
              editEmail={editEmail}
              setEditEmail={setEditEmail}
              editWebsite={editWebsite}
              setEditWebsite={setEditWebsite}
              editPum={editPum}
              setEditPum={setEditPum}
              editEstimatedMonthlySpend={editEstimatedMonthlySpend}
              setEditEstimatedMonthlySpend={setEditEstimatedMonthlySpend}
              editPlatform={editPlatform}
              setEditPlatform={setEditPlatform}
              editPrincipal={editPrincipal}
              setEditPrincipal={setEditPrincipal}
              editHeadPm={editHeadPm}
              setEditHeadPm={setEditHeadPm}
              editApContact={editApContact}
              setEditApContact={setEditApContact}
            />
          )}
          {tab === "People" && <PeopleTab officeId={officeId} />}
          {tab === "Meetings" && <MeetingsTab officeId={officeId} officeName={office.name} accountManagerName={accountManagerName(office.accountManager) ?? "Mitchell Wilcox"} />}
          {tab === "Notes" && <NotesTab officeId={officeId} />}
          {tab !== "Overview" && tab !== "People" && tab !== "Meetings" && tab !== "Notes" && (
            <div className="rounded-3xl border border-slate-100 bg-white p-16 text-center text-slate-400 font-bold shadow-2xs">
              {tab} content coming soon.
            </div>
          )}

        </>
      </div>



      {/* Archive Confirmation Popup Modal */}
      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[28px] px-8 pt-6 pb-6 border-0 shadow-2xl bg-white [&>button]:hidden text-center select-none gap-0">
          {/* Custom Close Button */}
          <div className="absolute right-5 top-5">
            <DialogClose asChild>
              <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-3xs cursor-pointer focus:outline-none">
                <X className="h-3.5 w-3.5 text-slate-500" />
              </button>
            </DialogClose>
          </div>

          {/* Circular Badge with Orange Sparkles */}
          <div className="flex justify-center mt-2 relative">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#fff8f6] ring-8 ring-[#fff8f6]/60 border border-orange-100/30 shadow-2xs">
              <Archive className="h-8 w-8 text-[#dd5437]" />

              {/* Floating Sparkles & Dots around the circle */}
              {/* Top Left Star */}
              <span className="absolute -top-1 -left-3 text-[#dd5437] text-[10px] opacity-70 animate-pulse select-none">✦</span>
              {/* Mid Left Dot */}
              <span className="absolute top-5 -left-6 text-[#dd5437]/60 text-[12px] leading-none select-none">•</span>
              {/* Bottom Left Star */}
              <span className="absolute bottom-2 -left-2 text-[#dd5437] text-[8px] opacity-60 select-none">✦</span>

              {/* Top Right Dot */}
              <span className="absolute -top-2 right-2 text-[#dd5437]/50 text-[12px] leading-none select-none">•</span>
              {/* Mid Right Star */}
              <span className="absolute top-6 -right-5 text-[#dd5437] text-[11px] opacity-75 animate-pulse select-none">✦</span>
              {/* Bottom Right Dot */}
              <span className="absolute bottom-3 -right-2 text-[#dd5437]/60 text-[10px] leading-none select-none">•</span>
            </div>
          </div>

          <div className="text-center mt-5">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-snug">Archive {office.name}?</h2>
            <div className="w-12 h-[3px] bg-[#dd5437] rounded-full mx-auto mt-2.5 mb-3.5" />
            <p className="text-[13px] font-medium text-slate-500 leading-normal max-w-sm mx-auto px-1 text-center">
              Are you sure you want to archive this agency office? Archiving will hide this office from the active list, but all data will remain safe and can be restored anytime from the Archived Offices filter.
            </p>
          </div>

          <div className="flex items-center gap-3.5 mt-8">
            <DialogClose asChild>
              <button className="w-full h-11 border border-slate-200 hover:bg-slate-50 bg-white text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center outline-none shadow-3xs border-0">
                Cancel
              </button>
            </DialogClose>

            <button
              onClick={handleConfirmArchive}
              disabled={updateOffice.isPending}
              className="w-full h-11 bg-[#dd5437] hover:bg-[#c24328] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm outline-none border-0"
            >
              {updateOffice.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Archive className="h-4 w-4 text-white" />
              )}
              Archive Office
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activate Confirmation Popup Modal */}
      <Dialog open={isActivateDialogOpen} onOpenChange={setIsActivateDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[28px] px-8 pt-6 pb-6 border-0 shadow-2xl bg-white [&>button]:hidden text-center select-none gap-0">
          {/* Custom Close Button */}
          <div className="absolute right-5 top-5">
            <DialogClose asChild>
              <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-3xs cursor-pointer focus:outline-none">
                <X className="h-3.5 w-3.5 text-slate-500" />
              </button>
            </DialogClose>
          </div>

          {/* Circular Badge with Teal Sparkles */}
          <div className="flex justify-center mt-2 relative">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#f4faf8] ring-8 ring-[#f4faf8]/60 border border-teal-100/30 shadow-2xs">
              <ArchiveRestore className="h-8 w-8 text-[#0f766e]" />

              {/* Floating Sparkles & Dots around the circle */}
              {/* Top Left Star */}
              <span className="absolute -top-1 -left-3 text-[#0f766e] text-[10px] opacity-70 animate-pulse select-none">✦</span>
              {/* Mid Left Dot */}
              <span className="absolute top-5 -left-6 text-[#0f766e]/60 text-[12px] leading-none select-none">•</span>
              {/* Bottom Left Star */}
              <span className="absolute bottom-2 -left-2 text-[#0f766e] text-[8px] opacity-60 select-none">✦</span>

              {/* Top Right Dot */}
              <span className="absolute -top-2 right-2 text-[#0f766e]/50 text-[12px] leading-none select-none">•</span>
              {/* Mid Right Star */}
              <span className="absolute top-6 -right-5 text-[#0f766e] text-[11px] opacity-75 animate-pulse select-none">✦</span>
              {/* Bottom Right Dot */}
              <span className="absolute bottom-3 -right-2 text-[#0f766e]/60 text-[10px] leading-none select-none">•</span>
            </div>
          </div>

          <div className="text-center mt-5">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-snug">Activate {office.name}?</h2>
            <div className="w-12 h-[3px] bg-[#0f766e] rounded-full mx-auto mt-2.5 mb-3.5" />
            <p className="text-[13px] font-medium text-slate-500 leading-normal max-w-sm mx-auto px-1 text-center">
              Are you sure you want to reactivate this agency office? Activating it will restore its status to Active and move it back to your main workplace list and dashboard tracking.
            </p>
          </div>

          <div className="flex items-center gap-3.5 mt-8">
            <DialogClose asChild>
              <button className="w-full h-11 border border-slate-200 hover:bg-slate-50 bg-white text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center outline-none shadow-3xs border-0">
                Cancel
              </button>
            </DialogClose>

            <button
              onClick={handleConfirmActivate}
              disabled={updateOffice.isPending}
              className="w-full h-11 bg-[#0f766e] hover:bg-[#0d6860] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm outline-none border-0"
            >
              {updateOffice.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <ArchiveRestore className="h-4 w-4 text-white" />
              )}
              Activate Office
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Popup Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[28px] px-8 pt-6 pb-6 border-0 shadow-2xl bg-white [&>button]:hidden text-center select-none gap-0">
          {/* Custom Close Button */}
          <div className="absolute right-5 top-5">
            <DialogClose asChild>
              <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-3xs cursor-pointer focus:outline-none">
                <X className="h-3.5 w-3.5 text-slate-500" />
              </button>
            </DialogClose>
          </div>

          {/* Circular Badge with Red Sparkles */}
          <div className="flex justify-center mt-2 relative">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#fff1ef] ring-8 ring-[#fff1ef]/60 border border-rose-100/30 shadow-2xs">
              <Trash2 className="h-8 w-8 text-[#ef4444]" />

              {/* Floating Sparkles & Dots around the circle */}
              {/* Top Left Star */}
              <span className="absolute -top-1 -left-3 text-[#ef4444] text-[10px] opacity-70 animate-pulse select-none">✦</span>
              {/* Mid Left Dot */}
              <span className="absolute top-5 -left-6 text-[#ef4444]/60 text-[12px] leading-none select-none">•</span>
              {/* Bottom Left Star */}
              <span className="absolute bottom-2 -left-2 text-[#ef4444] text-[8px] opacity-60 select-none">✦</span>

              {/* Top Right Dot */}
              <span className="absolute -top-2 right-2 text-[#ef4444]/50 text-[12px] leading-none select-none">•</span>
              {/* Mid Right Star */}
              <span className="absolute top-6 -right-5 text-[#ef4444] text-[11px] opacity-75 animate-pulse select-none">✦</span>
              {/* Bottom Right Dot */}
              <span className="absolute bottom-3 -right-2 text-[#ef4444]/60 text-[10px] leading-none select-none">•</span>
            </div>
          </div>

          <div className="text-center mt-5">
            <h2 className="text-xl font-bold text-[#ef4444] tracking-tight leading-snug">Delete {office.name} Permanently?</h2>
            <div className="w-12 h-[3px] bg-[#ef4444] rounded-full mx-auto mt-2.5 mb-3.5" />
            <p className="text-[13px] font-medium text-slate-500 leading-normal max-w-sm mx-auto px-1 text-center">
              This action cannot be undone. Deleting this agency office will permanently erase all associated data, logs, and accounts from the system. Any connected Property Managers or active jobs may lose their reference.
            </p>
          </div>

          <div className="mt-4 space-y-1.5">
            <p className="text-xs font-semibold text-slate-440 tracking-wider text-center select-none uppercase">
              To confirm, please type the ID Number (#{office.id.slice(-4).toUpperCase()}) below:
            </p>
            <input
              type="text"
              value={confirmDeleteId}
              onChange={(e) => setConfirmDeleteId(e.target.value)}
              className="w-full h-11 px-4 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#ef4444]/50 focus:outline-none transition-all text-center placeholder-slate-400"
              placeholder={`Type #${office.id.slice(-4).toUpperCase()} here`}
            />
          </div>

          <div className="flex items-center gap-3.5 mt-8">
            <DialogClose asChild>
              <button className="w-full h-11 border border-slate-200 hover:bg-slate-50 bg-white text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center outline-none shadow-3xs border-0">
                Cancel
              </button>
            </DialogClose>

            <button
              onClick={handleConfirmDelete}
              disabled={deleteOffice.isPending || (confirmDeleteId.trim() !== "#" + office.id.slice(-4).toUpperCase() && confirmDeleteId.trim().toUpperCase() !== office.id.slice(-4).toUpperCase())}
              className="w-full h-11 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm outline-none border-0 disabled:bg-[#fcdad5] disabled:text-[#f8a899] bg-[#ef4444] hover:bg-[#dc2626] disabled:cursor-not-allowed select-none"
            >
              {deleteOffice.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Trash2 className="h-4 w-4 text-white" />
              )}
              Delete Permanently
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface OverviewTabProps {
  office: Office;
  isEditing: boolean;

  editTradingName: string;
  setEditTradingName: (val: string) => void;
  editLegalEntityName: string;
  setEditLegalEntityName: (val: string) => void;
  editAbn: string;
  setEditAbn: (val: string) => void;
  editZone: string;
  setEditZone: (val: string) => void;
  editAccountManager: string;
  setEditAccountManager: (val: string) => void;
  editInactivityAlert: "none" | "14" | "30" | "60" | "ai";
  setEditInactivityAlert: (val: "none" | "14" | "30" | "60" | "ai") => void;
  editAddress: string;
  setEditAddress: (val: string) => void;
  editSuburb: string;
  setEditSuburb: (val: string) => void;
  editState: string;
  setEditState: (val: string) => void;
  editPostcode: string;
  setEditPostcode: (val: string) => void;
  editPhone: string;
  setEditPhone: (val: string) => void;
  editEmail: string;
  setEditEmail: (val: string) => void;
  editWebsite: string;
  setEditWebsite: (val: string) => void;

  editPum: number;
  setEditPum: (val: number) => void;
  editEstimatedMonthlySpend: number;
  setEditEstimatedMonthlySpend: (val: number) => void;
  editPlatform: string;
  setEditPlatform: (val: string) => void;

  editPrincipal: string;
  setEditPrincipal: (val: string) => void;
  editHeadPm: string;
  setEditHeadPm: (val: string) => void;
  editApContact: string;
  setEditApContact: (val: string) => void;
}

function OverviewTab({
  office: o,
  isEditing,
  editTradingName,
  setEditTradingName,
  editLegalEntityName,
  setEditLegalEntityName,
  editAbn,
  setEditAbn,
  editZone,
  setEditZone,
  editAccountManager,
  setEditAccountManager,
  editInactivityAlert,
  setEditInactivityAlert,
  editAddress,
  setEditAddress,
  editSuburb,
  setEditSuburb,
  editState,
  setEditState,
  editPostcode,
  setEditPostcode,
  editPhone,
  setEditPhone,
  editEmail,
  setEditEmail,
  editWebsite,
  setEditWebsite,
  editPum,
  setEditPum,
  editEstimatedMonthlySpend,
  setEditEstimatedMonthlySpend,
  editPlatform,
  setEditPlatform,
  editPrincipal,
  setEditPrincipal,
  editHeadPm,
  setEditHeadPm,
  editApContact,
  setEditApContact,
}: OverviewTabProps) {
  if (isEditing) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start text-left animate-in fade-in-50 duration-300">

        {/* Business Details Column (Takes 7/12 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xs">
          <div className="mb-5 flex items-center justify-between border-b border-slate-50 pb-3">
            <div className="flex items-center gap-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff8f6] text-[#dd5437]">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-md font-black text-slate-800 tracking-wide">Business Details</h2>
            </div>
            <div className="text-[11px] font-bold text-slate-400 select-none">
              # ID Number #{o.id.slice(-4).toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            {/* Trading Name */}
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Trading Name</label>
              <input
                type="text"
                value={editTradingName}
                onChange={(e) => setEditTradingName(e.target.value)}
                className="w-full h-10 px-4 text-xs font-bold text-slate-700 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all shadow-3xs"
              />
            </div>

            {/* Legal Entity Name */}
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Legal Entity Name</label>
              <input
                type="text"
                value={editLegalEntityName}
                onChange={(e) => setEditLegalEntityName(e.target.value)}
                className="w-full h-10 px-4 text-xs font-bold text-slate-700 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all shadow-3xs"
              />
            </div>

            {/* ABN */}
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">ABN</label>
              <input
                type="text"
                value={editAbn}
                onChange={(e) => setEditAbn(e.target.value)}
                className="w-full h-10 px-4 text-xs font-bold text-slate-700 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all shadow-3xs"
              />
            </div>

            {/* Zone */}
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Zone</label>
              <input
                type="text"
                value={editZone}
                onChange={(e) => setEditZone(e.target.value)}
                className="w-full h-10 px-4 text-xs font-bold text-slate-700 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all shadow-3xs"
              />
            </div>

            {/* Account Manager */}
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Account Manager</label>
              <div className="relative">
                <select
                  value={editAccountManager}
                  onChange={(e) => setEditAccountManager(e.target.value)}
                  className="w-full h-10 pl-4 pr-10 text-xs font-bold text-slate-700 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all shadow-3xs appearance-none cursor-pointer"
                >
                  <option value="">Select Account Manager</option>
                  <option value="Mitchell Wilcox">Mitchell Wilcox</option>
                  <option value="Peter Frank">Peter Frank</option>
                  <option value="Simon Lee">Simon Lee</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none stroke-[2.5px]" />
              </div>
            </div>

            {/* Inactivity Alert */}
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Inactivity Alert</label>
              <div className="relative">
                <select
                  value={editInactivityAlert}
                  onChange={(e) => setEditInactivityAlert(e.target.value as any)}
                  className="w-full h-10 pl-4 pr-10 text-xs font-bold text-slate-700 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all shadow-3xs appearance-none cursor-pointer"
                >
                  <option value="ai">AI Alert</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="none">None</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none stroke-[2.5px]" />
              </div>
            </div>

            {/* Office Address */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Office Address</label>
              <input
                type="text"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                className="w-full h-10 px-4 text-xs font-bold text-slate-700 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all shadow-3xs"
              />
            </div>

            {/* Suburb, State, Postcode */}
            <div className="col-span-2 grid grid-cols-4 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Suburb</label>
                <input
                  type="text"
                  value={editSuburb}
                  onChange={(e) => setEditSuburb(e.target.value)}
                  className="w-full h-10 px-4 text-xs font-bold text-slate-700 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all shadow-3xs"
                />
              </div>
              <div className="space-y-1.5 col-span-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">State</label>
                <input
                  type="text"
                  value={editState}
                  onChange={(e) => setEditState(e.target.value)}
                  className="w-full h-10 px-4 text-xs font-bold text-slate-700 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all shadow-3xs"
                />
              </div>
              <div className="space-y-1.5 col-span-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Post Code</label>
                <input
                  type="text"
                  value={editPostcode}
                  onChange={(e) => setEditPostcode(e.target.value)}
                  className="w-full h-10 px-4 text-xs font-bold text-slate-700 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all shadow-3xs"
                />
              </div>
            </div>

            {/* Checkbox circle */}
            <div className="col-span-2 flex items-center gap-2 mt-1 select-none cursor-pointer">
              <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border border-orange-500 bg-white shadow-3xs">
                {/* Checked or Unchecked circle */}
              </div>
              <span className="text-[10.5px] font-extrabold text-slate-400/80">Postal address same as office address</span>
            </div>

            {/* Phone */}
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Office Phone</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full h-10 px-4 text-xs font-bold text-slate-700 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all shadow-3xs"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">General Office Email</label>
              <input
                type="text"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full h-10 px-4 text-xs font-bold text-slate-700 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all shadow-3xs"
              />
            </div>

            {/* Website */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Website</label>
              <input
                type="text"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
                className="w-full h-10 px-4 text-xs font-bold text-slate-700 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all shadow-3xs"
              />
            </div>
          </div>
        </div>

        {/* Key Contacts & Metrics Column (Takes 5/12 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xs">
          <div className="mb-5 flex items-center gap-3.5 border-b border-slate-50 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff8f6] text-[#dd5437]">
              <Users className="h-4.5 w-4.5" />
            </div>
            <h2 className="text-md font-black text-slate-800 tracking-wide">Key Contacts & Metrics</h2>
          </div>

          <div className="space-y-4">
            {/* Principal / License */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Principal / License</label>
              <div className="relative">
                <select
                  value={editPrincipal}
                  onChange={(e) => setEditPrincipal(e.target.value)}
                  className="w-full h-10 pl-4 pr-10 text-xs font-bold text-slate-700 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all shadow-3xs appearance-none cursor-pointer"
                >
                  <option value="Andrew Webset">Andrew Webset</option>
                  <option value="Peter Frank">Peter Frank</option>
                  <option value="Simon Lee">Simon Lee</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none stroke-[2.5px]" />
              </div>
            </div>

            {/* Head of PM */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Head of Property Management</label>
              <div className="relative">
                <select
                  value={editHeadPm}
                  onChange={(e) => setEditHeadPm(e.target.value)}
                  className="w-full h-10 pl-4 pr-10 text-xs font-bold text-slate-700 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all shadow-3xs appearance-none cursor-pointer"
                >
                  <option value="Peter Frank">Peter Frank</option>
                  <option value="Andrew Webset">Andrew Webset</option>
                  <option value="Simon Lee">Simon Lee</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none stroke-[2.5px]" />
              </div>
            </div>

            {/* AP Contact */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Accounts Payable Contact</label>
              <div className="relative">
                <select
                  value={editApContact}
                  onChange={(e) => setEditApContact(e.target.value)}
                  className="w-full h-10 pl-4 pr-10 text-xs font-bold text-slate-700 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all shadow-3xs appearance-none cursor-pointer"
                >
                  <option value="Simon Lee">Simon Lee</option>
                  <option value="Andrew Webset">Andrew Webset</option>
                  <option value="Peter Frank">Peter Frank</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none stroke-[2.5px]" />
              </div>
            </div>

            {/* Platform & System */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Platform & System</label>
              <input
                type="text"
                value={editPlatform}
                onChange={(e) => setEditPlatform(e.target.value)}
                className="w-full h-10 px-4 text-xs font-bold text-slate-700 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all shadow-3xs"
              />
            </div>

            {/* PUM (Properties Under Management) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Properties Under Management</label>
              <input
                type="number"
                value={editPum}
                onChange={(e) => setEditPum(Number(e.target.value) || 0)}
                className="w-full h-10 px-4 text-xs font-bold text-slate-700 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all shadow-3xs"
              />
            </div>

            {/* Estimated Spend */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estimated Monthly Spend</label>
              <input
                type="number"
                value={editEstimatedMonthlySpend}
                onChange={(e) => setEditEstimatedMonthlySpend(Number(e.target.value) || 0)}
                className="w-full h-10 px-4 text-xs font-bold text-slate-700 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all shadow-3xs"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">

      {/* Business Details Column (Takes 7/12 cols ~58%) */}
      <div className="lg:col-span-7 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xs">
        <div className="mb-5 flex items-center gap-3.5 pb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF5F2] text-[#dd5437]">
            <Building2 className="h-4.5 w-4.5" />
          </div>
          <h2 className="text-md font-bold text-slate-800 tracking-tight text-left">Business Details</h2>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <Field label="ID Number" value={`#${o.id.slice(-4).toUpperCase()}`} icon={Hash} />
          <Field label="Trading Name" value={o.tradingName ?? o.name} icon={Tag} />
          <Field label="Legal Entity Name" value={o.legalEntityName ?? "Jackson Family Trust Settlement"} icon={Building2} />
          <Field label="ABN" value={o.abn ?? "38 697 586 501"} icon={Receipt} />
          <Field label="Office Address" value={o.address ?? "5 Church Street, Ryde, NSW, 2112"} icon={MapPin} />
          <Field label="Postal Address" value={o.address ?? "—"} icon={Mail} />
          <Field label="Office Phone" value={o.phone ?? "—"} icon={Phone} />
          <Field label="General Office Email" value={o.email ?? "—"} icon={Mail} />
          <Field
            label="Website"
            icon={Globe}
            value={
              o.website ? (
                <a href={o.website} target="_blank" rel="noopener noreferrer" className="text-[#dd5437] font-bold hover:underline transition-colors">
                  {o.website}
                </a>
              ) : (
                <a href="https://jacksonrowe.com.au/" target="_blank" rel="noopener noreferrer" className="text-[#dd5437] font-bold hover:underline transition-colors">
                  https://jacksonrowe.com.au/
                </a>
              )
            }
          />
          <Field label="Zone" value={o.zone ?? "5"} icon={Compass} />
          <Field label="Account Manager" value={accountManagerName(o.accountManager) ?? "Mitchell Wilcox"} icon={User} />
          <Field
            label="Inactivity Alert"
            icon={Bell}
            value={
              o.inactivityAlert && o.inactivityAlert !== "none" ? (
                <span className="inline-flex rounded-xl bg-orange-50/70 border border-orange-100/50 px-3 py-0.5 text-[10px] font-extrabold uppercase text-[#dd5437]">
                  {o.inactivityAlert === "ai" ? "AI Alert" : `${o.inactivityAlert} days`}
                </span>
              ) : (
                <span className="inline-flex rounded-xl bg-orange-50/70 border border-orange-100/50 px-3 py-0.5 text-[10px] font-extrabold uppercase text-[#dd5437]">
                  AI Alert
                </span>
              )
            }
          />
          <Field label="Last Note" value="15 May 2026" icon={FileText} />
          <Field
            label="Team Page"
            icon={Users}
            value={
              <a href="https://jacksonrowe.com.au/our-team" target="_blank" rel="noopener noreferrer" className="text-[#dd5437] font-bold hover:underline transition-colors">
                https://jacksonrowe.com.au/our-team
              </a>
            }
          />
        </div>
      </div>

      {/* Key Contacts & Metrics Column (Takes 5/12 cols ~42%) */}
      <div className="lg:col-span-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xs">
        <div className="mb-5 flex items-center gap-3.5 pb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF5F2] text-[#dd5437]">
            <Users className="h-4.5 w-4.5" />
          </div>
          <h2 className="text-md font-bold text-slate-800 tracking-tight text-left">Key Contacts & Metrics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Field
            label="Principal / License"
            icon={UserCheck}
            value={
              <div className="flex items-center gap-1">
                <span className="text-[#dd5437] font-bold hover:underline cursor-pointer">Andrew Webset</span>
                <ExternalLink className="h-3 w-3 text-[#dd5437]/75 hover:text-[#dd5437] cursor-pointer" />
              </div>
            }
          />
          <Field
            label="Head of Property Management"
            icon={UserCheck}
            value={
              <div className="flex items-center gap-1">
                <span className="text-[#dd5437] font-bold hover:underline cursor-pointer">Peter Frank</span>
                <ExternalLink className="h-3 w-3 text-[#dd5437]/75 hover:text-[#dd5437] cursor-pointer" />
              </div>
            }
          />
          <Field
            label="Accounts Payable Contact"
            icon={UserCheck}
            value={
              <div className="flex items-center gap-1">
                <span className="text-[#dd5437] font-bold hover:underline cursor-pointer">Simon Lee</span>
                <ExternalLink className="h-3 w-3 text-[#dd5437]/75 hover:text-[#dd5437] cursor-pointer" />
              </div>
            }
          />
          <Field label="Number of Property Managers" value="3" icon={Users} />
        </div>

        {/* Spaced Row of 3 card widgets */}
        <div className="grid grid-cols-3 gap-3.5 mt-5">
          <div className="rounded-2xl border border-slate-100 bg-[#fff8f6]/40 p-4 text-left flex flex-col justify-between h-[112px] hover:shadow-xs transition-shadow">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100/70 text-[#dd5437]">
              <Home className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 leading-tight">Total Properties Under Management</div>
              <div className="text-base font-extrabold text-slate-800 mt-1.5 leading-none">{o.pum ?? 600}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-[#fff8f6]/40 p-4 text-left flex flex-col justify-between h-[112px] hover:shadow-xs transition-shadow">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100/70 text-[#dd5437]">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 leading-tight">Estimated Monthly Spend</div>
              <div className="text-base font-extrabold text-slate-800 mt-1.5 leading-none">{o.estimatedMonthlySpend != null ? `$${o.estimatedMonthlySpend}` : "$600"}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-[#fff8f6]/40 p-4 text-left flex flex-col justify-between h-[112px] hover:shadow-xs transition-shadow">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100/70 text-[#dd5437]">
              <Monitor className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 leading-tight">Platform & System</div>
              <div className="text-base font-extrabold text-slate-800 mt-1.5 leading-none truncate max-w-[95px]">{o.platform ?? "—"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, icon: Icon }: { label: string; value: ReactNode | null; icon?: any }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-[#1F1F1F]/4 last:border-0 hover:bg-slate-50/20 transition-all rounded-lg px-2 text-left">
      {Icon && (
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-slate-400 mr-1.5">
          <Icon className="h-4 w-4 stroke-[1.8px]" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium text-slate-500">{label}</div>
        <div className="mt-0.5 text-xs font-semibold text-slate-800 leading-normal break-words">
          {value === null || value === undefined ? (
            <span className="text-slate-300 font-bold">—</span>
          ) : (
            value
          )}
        </div>
      </div>
    </div>
  );
}

interface PeopleTabProps {
  officeId: string;
}

function PeopleTab({ officeId }: PeopleTabProps) {
  const { data: pmData, isLoading: pmsLoading } = usePropertyManagers({ office: officeId });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);

  const people = useMemo(() => {
    const dbItems = pmData?.items ?? [];
    // Standard mockups seeded from mockup
    const mockups = [
      {
        id: "mock-1",
        name: "Peter Frank",
        title: "Senior Property Manager",
        specialization: "Residential",
        status: "Active",
        sentiment: "—",
        communications: "—",
        phone: "02 8878 1900",
        email: "email@example.com",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      },
      {
        id: "mock-2",
        name: "Simon Lee",
        title: "Senior Property Manager",
        specialization: "Residential",
        status: "Active",
        sentiment: "—",
        communications: "—",
        phone: "—",
        email: "email@example.com",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      },
      {
        id: "mock-3",
        name: "Andrew Webset",
        title: "Regional Manager",
        specialization: "Residential",
        status: "Active",
        sentiment: "—",
        communications: "—",
        phone: "—",
        email: "—",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
      },
    ];

    if (dbItems.length === 0) return mockups;

    // Convert db items
    const mapped = dbItems.map((pm, idx) => ({
      id: pm.id,
      name: pm.fullName || `${pm.firstName} ${pm.lastName ?? ""}`.trim(),
      title: pm.role === "Senior PM" ? "Senior Property Manager" : pm.role,
      specialization: "Residential",
      status: pm.active ? "Active" : "Inactive",
      sentiment: "—",
      communications: "—",
      phone: pm.phone || "—",
      email: pm.email || "—",
      avatar: idx % 3 === 0
        ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
        : idx % 3 === 1
          ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
          : "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
    }));

    // Filter out duplicates if dbItems happen to have mockups already
    const uniqueMockups = mockups.filter(m => !mapped.some(x => x.name.toLowerCase() === m.name.toLowerCase()));
    return [...mapped, ...uniqueMockups];
  }, [pmData]);



  const handleSelectAll = () => {
    if (selectedIds.length === people.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(people.map(p => p.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCopyText = (text: string, type: string) => {
    if (text === "—" || !text) return;
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${type} "${text}" to clipboard`);
  };

  const isAllSelected = people.length > 0 && selectedIds.length === people.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < people.length;

  const handleBulkEmail = () => {
    const emails = people
      .filter(p => selectedIds.includes(p.id) && p.email !== "—")
      .map(p => p.email);
    if (emails.length === 0) {
      toast.error("No selected contacts have email addresses");
      return;
    }
    window.location.href = `mailto:${emails.join(",")}`;
  };

  return (
    <div className="space-y-5 text-left animate-in fade-in-50 mt-2">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Property Managers & Key People</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Manage the property managers associated with this agency office.
          </p>
        </div>

        <button
          onClick={handleBulkEmail}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-655 hover:bg-slate-50 shadow-3xs cursor-pointer transition-all h-9 shrink-0 outline-none"
        >
          <Mail className="h-3.5 w-3.5 text-slate-400" />
          Email
        </button>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-separate border-spacing-y-2.5">
            <thead>
              <tr className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <th className="w-12 px-4 py-3 text-center">
                  <div className="flex justify-center items-center">
                    <button
                      onClick={handleSelectAll}
                      className="flex h-4.5 w-4.5 items-center justify-center rounded border transition-all cursor-pointer bg-transparent"
                      style={{
                        backgroundColor: isAllSelected || isPartiallySelected ? "#dd5437" : "#ffffff",
                        borderColor: isAllSelected || isPartiallySelected ? "#dd5437" : "#cbd5e1",
                      }}
                    >
                      {isAllSelected && <Check className="h-3 w-3 text-white stroke-[3.5px]" />}
                      {isPartiallySelected && <Minus className="h-3 w-3 text-white stroke-[3.5px]" />}
                    </button>
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-600 transition-colors">
                    Name <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-600 transition-colors">
                    Title <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-600 transition-colors">
                    Specialization <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-600 transition-colors">
                    Status <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-600 transition-colors">
                    Sentiment <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-600 transition-colors">
                    Communications <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-600 transition-colors">
                    Phone <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-600 transition-colors">
                    Email <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {pmsLoading && people.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-400 font-bold">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-[#dd5437] mb-2" />
                    Loading key people...
                  </td>
                </tr>
              ) : (
                people.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const rowBorderClass = isSelected ? "border-[#dd5437]" : "border-slate-100/70";
                  const rowBgClass = isSelected ? "bg-[#dd5437]/[0.03]" : "bg-white hover:bg-slate-50/40";

                  return (
                    <tr
                      key={p.id}
                      className={`group transition-all ${rowBgClass}`}
                    >
                      {/* Checkbox */}
                      <td className={`px-4 py-3 text-center border-y border-l rounded-l-2xl ${rowBorderClass}`}>
                        <div className="flex justify-center items-center">
                          <button
                            onClick={() => handleSelectOne(p.id)}
                            className="flex h-4.5 w-4.5 items-center justify-center rounded border transition-all cursor-pointer bg-transparent"
                            style={{
                              backgroundColor: isSelected ? "#dd5437" : "#ffffff",
                              borderColor: isSelected ? "#dd5437" : "#cbd5e1",
                            }}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white stroke-[3.5px]" />}
                          </button>
                        </div>
                      </td>

                      {/* Name with Avatar */}
                      <td className={`px-4 py-3.5 border-y ${rowBorderClass}`}>
                        <div className="flex items-center gap-3">
                          <img
                            src={p.avatar}
                            alt={p.name}
                            className="h-8 w-8 rounded-full object-cover border border-slate-100 shadow-2xs shrink-0"
                          />
                          <span className="font-extrabold text-xs text-slate-700">{p.name}</span>
                        </div>
                      </td>

                      {/* Title */}
                      <td className={`px-4 py-3.5 border-y ${rowBorderClass} text-xs font-semibold text-slate-500`}>
                        {p.title}
                      </td>

                      {/* Specialization */}
                      <td className={`px-4 py-3.5 border-y ${rowBorderClass}`}>
                        <span className="bg-slate-100 text-slate-500 font-extrabold text-[10px] px-3 py-1 rounded-lg uppercase tracking-wider">
                          {p.specialization}
                        </span>
                      </td>

                      {/* Status */}
                      <td className={`px-4 py-3.5 border-y ${rowBorderClass}`}>
                        <StatusPill status={p.status} />
                      </td>

                      {/* Sentiment */}
                      <td className={`px-4 py-3.5 border-y ${rowBorderClass} text-xs font-bold text-slate-400`}>
                        {p.sentiment}
                      </td>

                      {/* Communications */}
                      <td className={`px-4 py-3.5 border-y ${rowBorderClass} text-xs font-bold text-slate-400`}>
                        {p.communications}
                      </td>

                      {/* Phone */}
                      <td className={`px-4 py-3.5 border-y ${rowBorderClass}`}>
                        {p.phone !== "—" ? (
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 group/item">
                            <span>{p.phone}</span>
                            <button
                              onClick={() => handleCopyText(p.phone, "Phone")}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover/item:opacity-100 cursor-pointer border-0 bg-transparent"
                              title="Copy Phone"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-bold">—</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className={`px-4 py-3.5 border-y ${rowBorderClass}`}>
                        {p.email !== "—" ? (
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 group/item">
                            <span>{p.email}</span>
                            <button
                              onClick={() => handleCopyText(p.email, "Email")}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover/item:opacity-100 cursor-pointer border-0 bg-transparent"
                              title="Copy Email"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-bold">—</span>
                        )}
                      </td>

                      {/* Actions Menu */}
                      <td className={`px-4 py-3 text-center border-y border-r rounded-r-2xl ${rowBorderClass}`}>
                        <Popover
                          open={activeActionsId === p.id}
                          onOpenChange={(op) => setActiveActionsId(op ? p.id : null)}
                        >
                          <PopoverTrigger asChild>
                            <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer border-0 bg-transparent flex items-center justify-center">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-32 p-1 bg-white border border-slate-200 shadow-md rounded-xl animate-in fade-in-50" align="end">
                            <a
                              href={`mailto:${p.email}`}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors rounded-lg cursor-pointer"
                              onClick={() => setActiveActionsId(null)}
                            >
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              Email
                            </a>
                          </PopoverContent>
                        </Popover>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface MeetingsTabProps {
  officeId: string;
  officeName: string;
  accountManagerName: string;
}

function MeetingsTab({ officeId, officeName, accountManagerName }: MeetingsTabProps) {
  const { data: meetingData, isLoading: meetingsLoading } = useMeetings({ office: officeId });
  const createMeeting = useCreateMeeting();

  const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: `Visit - ${officeName}`,
    type: "Cold Visit" as const,
    startAt: "",
    endAt: "",
    notes: "",
  });

  const meetings = useMemo(() => {
    const dbItems = meetingData?.items ?? [];

    // Seed standard mockup meetings to match mockup screenshot
    const mockups = [
      {
        id: "mock-meet-1",
        title: `Visit - ${officeName}`,
        type: "Cold Visit",
        date: "May 13, 2026 at 4:00 AM",
        accountManager: accountManagerName,
        status: "Scheduled",
        rawStartAt: "2026-05-13T04:00:00",
      },
      {
        id: "mock-meet-2",
        title: `Follow-up - ${officeName}`,
        type: "Follow-up",
        date: "May 10, 2026 at 11:30 AM",
        accountManager: accountManagerName,
        status: "Completed",
        rawStartAt: "2026-05-10T11:30:00",
      },
      {
        id: "mock-meet-3",
        title: "Training Session",
        type: "Training",
        date: "May 5, 2026 at 2:00 PM",
        accountManager: accountManagerName,
        status: "Completed",
        rawStartAt: "2026-05-05T14:00:00",
      },
    ];

    if (dbItems.length === 0) return mockups;

    // Convert db items
    const mapped = dbItems.map((m) => {
      const typeStr = m.meetingType;
      const statusStr = m.status === "scheduled"
        ? "Scheduled"
        : m.status === "completed"
          ? "Completed"
          : m.status === "cancelled"
            ? "Cancelled"
            : "No Show";

      return {
        id: m.id,
        title: m.title,
        type: typeStr,
        date: formatMeetingDate(m.startAt),
        accountManager: accountManagerName,
        status: statusStr,
        rawStartAt: m.startAt,
      };
    });

    // Merge and sort by start date descending
    const merged = [...mapped, ...mockups.filter(mock => !mapped.some(x => x.title === mock.title))];
    return merged.sort((a, b) => new Date(b.rawStartAt).getTime() - new Date(a.rawStartAt).getTime());
  }, [meetingData, officeName, accountManagerName]);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.startAt || !newMeeting.endAt) {
      toast.error("Please fill in start and end times");
      return;
    }

    try {
      await createMeeting.mutateAsync({
        title: newMeeting.title,
        meetingType: newMeeting.type,
        office: officeId,
        startAt: new Date(newMeeting.startAt).toISOString(),
        endAt: new Date(newMeeting.endAt).toISOString(),
        notes: newMeeting.notes,
        status: "scheduled",
      });
      toast.success("Meeting booked successfully!");
      setIsBookDialogOpen(false);
      // Reset form
      setNewMeeting({
        title: `Visit - ${officeName}`,
        type: "Cold Visit",
        startAt: "",
        endAt: "",
        notes: "",
      });
    } catch (err) {
      // Toast handled by query
    }
  };

  return (
    <div className="space-y-5 text-left animate-in fade-in-50 mt-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Meetings ({meetings.length})</h2>
        </div>

        <button
          onClick={() => setIsBookDialogOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[#dd5437] hover:bg-[#dd5437]/90 text-white font-bold text-xs py-2.5 px-4 shadow-sm shadow-[#dd5437]/20 transition-colors cursor-pointer border-0 outline-none"
        >
          <CalendarPlus className="h-4 w-4 text-white" />
          Book Meeting
        </button>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-2xs mt-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-slate-100 text-xs font-semibold text-slate-500">
                <th className="px-6 py-3.5 text-left">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700 transition-colors select-none">
                    Title <ChevronsUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-6 py-3.5 text-left">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700 transition-colors select-none">
                    Type <ChevronsUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-6 py-3.5 text-left">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700 transition-colors select-none">
                    Date <ChevronsUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-6 py-3.5 text-left">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700 transition-colors select-none">
                    Account Manager <ChevronsUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-6 py-3.5 text-left">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700 transition-colors select-none">
                    Status <ChevronsUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {meetingsLoading && meetings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 font-bold">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-[#dd5437] mb-2" />
                    Loading meetings...
                  </td>
                </tr>
              ) : (
                meetings.map((m) => {
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-slate-100/80 last:border-b-0 bg-white hover:bg-slate-50/30 transition-colors"
                    >
                      {/* Title */}
                      <td className="px-6 py-4.5 text-xs font-semibold text-slate-800">
                        {m.title}
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4.5 text-xs font-medium text-slate-500">
                        {m.type}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4.5 text-xs font-medium text-slate-500">
                        {m.date}
                      </td>

                      {/* Account Manager */}
                      <td className="px-6 py-4.5 text-xs font-medium text-slate-500">
                        {m.accountManager}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4.5">
                        <StatusPill status={m.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Meeting Dialog */}
      <Dialog open={isBookDialogOpen} onOpenChange={setIsBookDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-6 border-0 shadow-2xl bg-white [&>button]:hidden text-left">
          <DialogClose asChild>
            <button className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-3xs cursor-pointer">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </DialogClose>

          <div className="mb-4">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Book a New Meeting</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">Schedule a new visit or follow-up with this office.</p>
          </div>

          <form onSubmit={handleCreateMeeting} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Meeting Title</label>
              <input
                type="text"
                required
                value={newMeeting.title}
                onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                className="w-full h-10 px-4 text-xs font-bold text-slate-700 bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all"
                placeholder="e.g. Visit - Ryde Office"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Meeting Type</label>
              <select
                value={newMeeting.type}
                onChange={(e) => setNewMeeting({ ...newMeeting, type: e.target.value as any })}
                className="w-full h-10 px-3.5 text-xs font-bold text-slate-700 bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all"
              >
                {["Cold Visit", "Property Manager Meeting", "Follow-up", "Training", "Other"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newMeeting.startAt}
                  onChange={(e) => setNewMeeting({ ...newMeeting, startAt: e.target.value })}
                  className="w-full h-10 px-4 text-xs font-bold text-slate-700 bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">End Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newMeeting.endAt}
                  onChange={(e) => setNewMeeting({ ...newMeeting, endAt: e.target.value })}
                  className="w-full h-10 px-4 text-xs font-bold text-slate-700 bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Notes</label>
              <textarea
                value={newMeeting.notes}
                onChange={(e) => setNewMeeting({ ...newMeeting, notes: e.target.value })}
                className="w-full p-4 text-xs font-bold text-slate-700 bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all min-h-[80px] max-h-[140px]"
                placeholder="Meeting agenda or details..."
              />
            </div>

            <div className="flex items-center gap-3.5 mt-6">
              <DialogClose asChild>
                <button type="button" className="w-full py-3.5 border border-slate-200 hover:bg-slate-50 bg-white text-slate-600 font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-3xs border-0 outline-none">
                  Cancel
                </button>
              </DialogClose>

              <button
                type="submit"
                disabled={createMeeting.isPending}
                className="w-full py-3.5 bg-[#dd5437] hover:bg-[#dd5437]/90 disabled:opacity-50 text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-[#dd5437]/20 border-0 outline-none"
              >
                {createMeeting.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Calendar className="h-4 w-4 text-white" />
                )}
                Book Meeting
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface NoteItem {
  id: string;
  author: string;
  badge?: string;
  content: string;
  date: string;
  edited?: boolean;
  fileAttachment?: string;
  editHistory?: {
    title: string;
    content: string;
    metadata: string;
  }[];
}

function NotesTab({ officeId }: { officeId: string }) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // Modal dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);

  // Form states
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteBadge, setNewNoteBadge] = useState("Engagement");
  const [newNoteFile, setNewNoteFile] = useState("");

  const [editNoteContent, setEditNoteContent] = useState("");

  // Collapse/Expand state for edit history, keyed by note ID
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});

  // Scoped localStorage key
  const storageKey = `realestate-notes-${officeId}`;

  // Initial Seed Data matching the mockup screenshot
  const initialMockNotes: NoteItem[] = [
    {
      id: "note-seed-1",
      author: "Mitchell Wilcox",
      badge: "Engagement",
      content: "Saw property manager cjgjhvbkjsnss",
      date: "May 15, 2026 at 10:42 AM (6 days ago)",
      edited: true,
      fileAttachment: "Statement20260330.pdf",
      editHistory: [
        {
          title: "Original note",
          content: "Saw property manager",
          metadata: "Mitchell Wilcox • May 15, 2026 at 10:42 AM (6 days ago)"
        }
      ]
    },
    {
      id: "note-seed-2",
      author: "Mitchell Wilcox",
      badge: "Engagement",
      content: "ServiceOps/AI ServiceOps/AI",
      date: "May 15, 2026 at 10:07 AM (4 days ago)",
    },
    {
      id: "note-seed-3",
      author: "Mitchell Wilcox",
      content: `MET WITH: Tina\n\nPOSITION: Sales / Maintenance Support\n\nNOTE ON CONTACT: Influencer, directed to Head of PM for decision making.\n\nSUMMARY OF MEETING: Spoke with Tina who assists with minor maintenance coordination. Discussed services, promotions and troubleshooting guide. Office has approx. 4 PMs managing 600 properties. Tina confirmed team awareness and prior usage. Advised to send all correspondence to Head PM John for team-wide distribution.\n\nNUMBER OF PMS: 4\n\nNUMBER OF PROPERTIES MANAGED: Approx. 600\n\nFOLLOW UP EMAIL #1224430`,
      date: "May 15, 2026 at 10:07 AM (4 days ago)",
      fileAttachment: "Quotes - No. 162989.pdf",
    },
    {
      id: "note-seed-4",
      author: "Mitchell Wilcox",
      content: `MET WITH: Tina BANNNN\n\nPOSITION: Sales / Maintenance Support\n\nNOTE ON CONTACT: Influencer, directed to Head of PM for decision making.\n\nSUMMARY OF MEETING: Spoke with Tina who assists with minor maintenance coordination. Discussed services, promotions and troubleshooting guide. Office has approx. 4 PMs managing 600 properties. Tina confirmed team awareness and prior usage. Advised to send all correspondence to Head PM John for team-wide distribution.\n\nNUMBER OF PMS: 4\n\nNUMBER OF PROPERTIES MANAGED: Approx. 600\n\nFOLLOW UP EMAIL #1224430`,
      date: "May 7, 2026 at 2:53 PM (14 days ago)",
      edited: true,
      editHistory: [
        {
          title: "Previous version",
          content: `Met with: Tina LALALLA\n\nPOSITION: Sales / Maintenance Support\n\nNOTE ON CONTACT: Influencer, directed to Head of PM for decision making.\n\nSUMMARY OF MEETING: Spoke with Tina who assists with minor maintenance coordination. Discussed services, promotions and troubleshooting guide. Office has approx. 4 PMs managing 600 properties. Tina confirmed team awareness and prior usage. Advised to send all correspondence to Head PM John for team-wide distribution.\n\nNUMBER OF PMS: 4\n\nNUMBER OF PROPERTIES MANAGED: Approx. 600\n\nFOLLOW UP EMAIL #1224430`,
          metadata: "Admin • May 7, 2026 at 2:03 PM (14 days ago)"
        },
        {
          title: "Original note",
          content: `MET WITH: Tina\n\nPOSITION: Sales / Maintenance Support\n\nNOTE ON CONTACT: Influencer, directed to Head of PM for decision making.\n\nSUMMARY OF MEETING: Spoke with Tina who assists with minor maintenance coordination. Discussed services, promotions and troubleshooting guide. Office has approx. 4 PMs managing 600 properties. Tina confirmed team awareness and prior usage. Advised to send all correspondence to Head PM John for team-wide distribution.\n\nNUMBER OF PMS: 4\n\nNUMBER OF PROPERTIES MANAGED: Approx. 600\n\nFOLLOW UP EMAIL #1224430`,
          metadata: "Mitchell Wilcox • May 7, 2026 at 2:48 PM (14 days ago)"
        }
      ]
    }
  ];

  // Load notes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setNotes(JSON.parse(stored));
      } else {
        setNotes(initialMockNotes);
        localStorage.setItem(storageKey, JSON.stringify(initialMockNotes));
      }
    } catch {
      setNotes(initialMockNotes);
    }
  }, [storageKey]);

  const saveNotes = (updated: NoteItem[]) => {
    setNotes(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleGenerateSummary = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      setIsAiLoading(false);
      setAiSummary(
        "Based on recent activity, JacksonRowe Real Estate shows a highly stable Account Health. Mitchell Wilcox recently met with Tina (Sales/Maintenance Support) to discuss services, confirming high team engagement. The office manages approx. 600 properties with 4 active Property Managers. Financially, they have 18 unpaid invoices with a 95% quote approval rate. The inactivity alert is set to AI Alert, and recent note logs reflect continuous communication and solid relationship status."
      );
      toast.success("AI Account Health Summary generated successfully!");
    }, 1500);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    const formattedDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " at " + new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }) + " (just now)";

    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      author: "Mitchell Wilcox",
      badge: newNoteBadge || undefined,
      content: newNoteContent,
      date: formattedDate,
      fileAttachment: newNoteFile.trim() || undefined,
    };

    saveNotes([newNote, ...notes]);
    toast.success("Note added successfully!");
    setIsAddOpen(false);
    // Reset fields
    setNewNoteContent("");
    setNewNoteBadge("Engagement");
    setNewNoteFile("");
  };

  const handleOpenEdit = (note: NoteItem) => {
    setSelectedNote(note);
    setEditNoteContent(note.content);
    setIsEditOpen(true);
  };

  const handleEditNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNote || !editNoteContent.trim()) return;

    const formattedDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " at " + new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }) + " (edited just now)";

    const previousHistory = selectedNote.editHistory ?? [];

    // Add current version to edit history list
    const newHistoryItem = {
      title: previousHistory.length > 0 ? "Previous version" : "Original note",
      content: selectedNote.content,
      metadata: `${selectedNote.author} • ${selectedNote.date}`
    };

    const updated = notes.map((n) => {
      if (n.id === selectedNote.id) {
        return {
          ...n,
          content: editNoteContent,
          edited: true,
          date: formattedDate,
          editHistory: [newHistoryItem, ...previousHistory]
        };
      }
      return n;
    });

    saveNotes(updated);
    toast.success("Note updated successfully!");
    setIsEditOpen(false);
    setSelectedNote(null);
  };

  const handleDeleteNote = (id: string) => {
    if (!confirm("Are you sure you want to delete this note? This cannot be undone.")) return;
    const updated = notes.filter((n) => n.id !== id);
    saveNotes(updated);
    toast.success("Note deleted successfully!");
  };

  const toggleHistory = (id: string) => {
    setExpandedHistory((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in-50 mt-2">
      {/* AI Account Health Summary Box */}
      <div className="rounded-xl border border-[#feebe7] bg-white p-5 shadow-3xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-[#dd5437] shrink-0 mt-0.5" />
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">AI Account Health Summary</h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Click "Generate Summary" to get an AI-powered account health snapshot for this office.
            </p>
            {aiSummary && (
              <p className="text-xs text-slate-600 font-semibold bg-slate-50 border border-[#feebe7] p-4 rounded-xl mt-3 leading-relaxed max-w-2xl animate-in slide-in-from-top-2 duration-300">
                {aiSummary}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleGenerateSummary}
          disabled={isAiLoading}
          className="flex items-center justify-center shrink-0 h-10 px-3 w-[154px] bg-gradient-to-r from-[#e88185] to-[#6d459d] hover:opacity-90 active:opacity-95 text-white font-semibold text-xs rounded-lg transition-all cursor-pointer border-0 outline-none disabled:opacity-50 select-none"
        >
          {isAiLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            "Generate Summary"
          )}
        </button>
      </div>

      {/* Notes Section Header */}
      <div className="flex items-center justify-between gap-4 mt-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Notes ({notes.length})</h2>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#dd5437] hover:bg-[#dd5437]/90 text-white font-semibold text-xs py-2 px-3.5 shadow-sm shadow-[#dd5437]/15 transition-all cursor-pointer border-0 outline-none"
        >
          <Plus className="h-4 w-4 text-white stroke-[2.5px]" />
          Add Note
        </button>
      </div>

      {/* Notes List Cards */}
      <div className="space-y-4 mt-6">
        {notes.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-white p-16 text-center text-slate-400 font-bold shadow-2xs">
            No notes added yet. Click 'Add Note' to create your first note log!
          </div>
        ) : (
          notes.map((n) => {
            const hasHistory = n.editHistory && n.editHistory.length > 0;
            const isHistoryOpen = !!expandedHistory[n.id];

            return (
              <div
                key={n.id}
                className="rounded-xl border border-slate-100 bg-white p-4 shadow-3xs hover:shadow-2xs transition-shadow duration-300 text-left"
              >
                {/* Note Header */}
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=120&h=120&fit=crop"
                      alt={n.author}
                      className="h-8 w-8 rounded-full object-cover border border-slate-100 shadow-3xs shrink-0 select-none"
                    />
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800">{n.author}</span>
                      {n.badge && (
                        <span className="bg-[#dd5437] text-white font-semibold text-[10px] px-2.5 py-0.5 rounded-full leading-none">
                          {n.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(n)}
                      className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-0 bg-transparent"
                      title="Edit Note"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(n.id)}
                      className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer border-0 bg-transparent"
                      title="Delete Note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Note Content */}
                <div className="text-xs font-semibold text-slate-600 leading-relaxed whitespace-pre-line text-left">
                  {n.content}
                </div>

                {/* PDF Attachment Badge */}
                {n.fileAttachment && (
                  <div className="mt-2.5 bg-slate-50 hover:bg-slate-100/50 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-200/50 w-fit flex items-center gap-1.5 transition-colors cursor-pointer shadow-3xs select-none">
                    <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{n.fileAttachment}</span>
                  </div>
                )}

                {/* Note Timestamp */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mt-3 select-none">
                  <Clock className="h-3.5 w-3.5 text-slate-300" />
                  <span>{n.date} {n.edited && "(edited)"}</span>
                </div>

                {/* Edit History Expander */}
                {hasHistory && (
                  <div className="mt-3 text-left">
                    <button
                      onClick={() => toggleHistory(n.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-[#fff8f6] px-3 py-1 text-[10px] font-semibold text-[#dd5437] hover:bg-[#fff0ed] transition-all cursor-pointer border-0 outline-none select-none shadow-3xs"
                    >
                      <History className="h-3 w-3" />
                      Edited {n.editHistory!.length} time{n.editHistory!.length > 1 ? "s" : ""} • {isHistoryOpen ? "Hide history" : "View history"}
                    </button>

                    {isHistoryOpen && (
                      <div className="mt-3 space-y-3 pl-3 border-l-2 border-orange-100 animate-in slide-in-from-top-1 duration-200">
                        {n.editHistory!.map((history, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                              {history.title}
                            </div>
                            <div className="mt-1.5 text-xs font-semibold text-slate-500 whitespace-pre-line leading-relaxed">
                              {history.content}
                            </div>
                            <div className="mt-2 text-[9px] text-slate-400 font-semibold">
                              {history.metadata}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Note Dialog Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-6 border-0 shadow-2xl bg-white [&>button]:hidden text-left">
          <DialogClose asChild>
            <button className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-3xs cursor-pointer">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </DialogClose>

          <div className="mb-4">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Add a New Note Log</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">Record a recent client update, visit details, or engagement.</p>
          </div>

          <form onSubmit={handleAddNote} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Badge Tag</label>
              <select
                value={newNoteBadge}
                onChange={(e) => setNewNoteBadge(e.target.value)}
                className="w-full h-10 px-3.5 text-xs font-bold text-slate-700 bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all"
              >
                <option value="Engagement">Engagement</option>
                <option value="General">General</option>
                <option value="Outreach">Outreach</option>
                <option value="">No Badge Tag</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">File Attachment (Optional)</label>
              <input
                type="text"
                value={newNoteFile}
                onChange={(e) => setNewNoteFile(e.target.value)}
                className="w-full h-10 px-4 text-xs font-bold text-slate-700 bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all"
                placeholder="e.g. Statement20260330.pdf"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Note Content</label>
              <textarea
                required
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full p-4 text-xs font-bold text-slate-700 bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all min-h-[120px] max-h-[220px]"
                placeholder="Write your note log here..."
              />
            </div>

            <div className="flex items-center gap-3.5 mt-6">
              <DialogClose asChild>
                <button type="button" className="w-full py-3.5 border border-slate-200 hover:bg-slate-50 bg-white text-slate-600 font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-3xs border-0 outline-none">
                  Cancel
                </button>
              </DialogClose>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#dd5437] hover:bg-[#c9492f] text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-[#dd5437]/20 border-0 outline-none"
              >
                <Plus className="h-4 w-4 text-white stroke-[2.5px]" />
                Add Note Log
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-6 border-0 shadow-2xl bg-white [&>button]:hidden text-left">
          <DialogClose asChild>
            <button className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-3xs cursor-pointer">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </DialogClose>

          <div className="mb-4">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Edit Note Log</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">Make changes to your log. Old version will be preserved in history.</p>
          </div>

          <form onSubmit={handleEditNote} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Note Content</label>
              <textarea
                required
                value={editNoteContent}
                onChange={(e) => setEditNoteContent(e.target.value)}
                className="w-full p-4 text-xs font-bold text-slate-700 bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:border-[#dd5437] focus:outline-none transition-all min-h-[160px] max-h-[300px]"
                placeholder="Write your note log here..."
              />
            </div>

            <div className="flex items-center gap-3.5 mt-6">
              <DialogClose asChild>
                <button type="button" className="w-full py-3.5 border border-slate-200 hover:bg-slate-50 bg-white text-slate-600 font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-3xs border-0 outline-none">
                  Cancel
                </button>
              </DialogClose>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#dd5437] hover:bg-[#c9492f] text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-[#dd5437]/20 border-0 outline-none"
              >
                <Check className="h-4 w-4 text-white" />
                Save Changes
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatMeetingDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " at " + d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return dateStr;
  }
}
