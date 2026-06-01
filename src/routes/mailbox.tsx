import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";
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
  ChevronLeft,
  CornerUpLeft,
  StickyNote,
  Building2,
  Phone,
  Tag,
  Bell,
  HelpCircle,
  Compass,
  Target,
  RefreshCw,
  MessageSquare,
  Clock,
  CheckSquare,
  AlertTriangle,
  MoreHorizontal,
  Calendar,
  Globe,
  Pencil,
  Trash2,
  Plus,
  Sparkles,
  X,
  Maximize2,
  Send,
  Lock,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { useSidebar } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

interface ConversationItem {
  id: string;
  name: string;
  emailId: string;
  conversation: string;
  date: string;
  waiting: string;
  status: string;
  statusColorClass: string;
  isSelected?: boolean;
}

const INITIAL_CONVERSATIONS: ConversationItem[] = [
  {
    id: "1",
    name: "Harper Quinn",
    emailId: "#48291",
    conversation: "Welcome to your inbox, Harper! Here's a detailed overview of your late...",
    date: "30/12/2026",
    waiting: "59 Minutes",
    status: "10 Minutes",
    statusColorClass: "text-sky-500",
  },
  {
    id: "2",
    name: "Julie Martinez",
    emailId: "#69485",
    conversation: "Your receipt from Railway Corporation #2296-0417",
    date: "28/12/2026",
    waiting: "57 Minutes",
    status: "1 Hr",
    statusColorClass: "text-[#dd5437]",
    isSelected: true,
  },
  {
    id: "3",
    name: "Miles Bennett",
    emailId: "#10438",
    conversation: "Hey Harper, your inbox has new content waiting for you. Don't miss out...",
    date: "25/12/2026",
    waiting: "1 Hours 21 Minutes",
    status: "2 Hr",
    statusColorClass: "text-[#dd5437]",
  },
  {
    id: "4",
    name: "Logan Pierce",
    emailId: "#83576",
    conversation: "Hello Harper! Your inbox has important messages waiting for you. Thes...",
    date: "25/12/2026",
    waiting: "1 Hours 21 Minutes",
    status: "1 Day",
    statusColorClass: "text-rose-600",
  },
];

interface TemplateItem {
  id: string;
  category: string;
  name: string;
  body: string;
  tags: string[];
}

const EMAIL_TEMPLATES_DATA: TemplateItem[] = [
  {
    id: "1",
    category: "Meeting",
    name: "Meeting Request",
    body: "Hi {{firstName}},\nI hope you're doing well! I'd love to schedule a time to connect and discuss how we can support your property management needs...",
    tags: ["Meeting", "Request", "Intro"],
  },
  {
    id: "2",
    category: "Introduction",
    name: "Introduction Email",
    body: "Hi,\nMy name is and I'm reaching out from FieldOps. We specialise in helping property management offices streamline their appliance replacement and maintenance...",
    tags: ["Intro", "cold-outreach", "first-contact"],
  },
  {
    id: "3",
    category: "Introduction",
    name: "Introduction Email",
    body: "Hi,\nMy name is and I'm reaching out from FieldOps. We specialise in helping property management offices streamline their appliance replacement and maintenance...",
    tags: ["Intro", "cold-outreach", "first-contact"],
  },
  {
    id: "4",
    category: "Follow-up",
    name: "Follow-up After Meeting",
    body: "Hi,\nThank you for taking the time to meet with me today — it was great to learn more about your office and the work you do...",
    tags: ["follow-up", "post-meeting"],
  },
  {
    id: "5",
    category: "Meeting",
    name: "Onboarding Welcome",
    body: "Hi,\nWelcome aboard! We're thrilled to have as part of the FieldOps family. Here's what to expect next:...",
    tags: ["Onboarding", "Welcome", "new-client"],
  },
  {
    id: "6",
    category: "Introduction",
    name: "Introduction Email",
    body: "Hi,\nMy name is and I'm reaching out from FieldOps. We specialise in helping property management offices streamline their appliance replacement and maintenance...",
    tags: ["Intro", "cold-outreach", "first-contact"],
  },
  {
    id: "7",
    category: "Introduction",
    name: "Introduction Email",
    body: "Hi,\nMy name is and I'm reaching out from FieldOps. We specialise in helping property management offices streamline their appliance replacement and maintenance...",
    tags: ["Intro", "cold-outreach", "first-contact"],
  },
  {
    id: "8",
    category: "Follow-up",
    name: "Follow-up After Meeting",
    body: "Hi,\nThank you for taking the time to meet with me today — it was great to learn more about your office and the work you do...",
    tags: ["follow-up", "post-meeting"],
  },
  {
    id: "9",
    category: "Meeting",
    name: "Meeting Request",
    body: "Hi {{firstName}},\nI hope you're doing well! I'd love to schedule a time to connect and discuss how we can support your property management needs...",
    tags: ["Meeting", "Request", "Intro"],
  },
  {
    id: "10",
    category: "Introduction",
    name: "Introduction Email",
    body: "Hi,\nMy name is and I'm reaching out from FieldOps. We specialise in helping property management offices streamline their appliance replacement and maintenance...",
    tags: ["Intro", "cold-outreach", "first-contact"],
  },
  {
    id: "11",
    category: "Introduction",
    name: "Introduction Email",
    body: "Hi,\nMy name is and I'm reaching out from FieldOps. We specialise in helping property management offices streamline their appliance replacement and maintenance...",
    tags: ["Intro", "cold-outreach", "first-contact"],
  },
  {
    id: "12",
    category: "Follow-up",
    name: "Follow-up After Meeting",
    body: "Hi,\nThank you for taking the time to meet with me today — it was great to learn more about your office and the work you do...",
    tags: ["follow-up", "post-meeting"],
  },
];

function MailboxPage() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [activeTab, setActiveTab] = useState<"inboxes" | "docs" | "templates" | "report" | "manage">("inboxes");
  const [inboxes, setInboxes] = useState<InboxItem[]>(INITIAL_INBOXES);
  const [conversations, setConversations] = useState<ConversationItem[]>(INITIAL_CONVERSATIONS);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>("2");
  const [isInlineReplying, setIsInlineReplying] = useState(false);
  const [isExpandedReply, setIsExpandedReply] = useState(false);
  const [isNoted, setIsNoted] = useState(false);
  const [inlineReplyText, setInlineReplyText] = useState("");
  const [conversationMessages, setConversationMessages] = useState<{
    [key: string]: { sender: string; avatar: string; date: string; body: string; isSent?: boolean }[];
  }>({
    "2": [
      {
        sender: "Julie Martinez",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
        date: "Jan 28",
        body: `Hi there,\n\nI'm having trouble using the filters in the Accessories section. When I select "Price: Under $50" and "Brand: EcoChic," the results are either empty or incorrect. Could you look into this? I'd love to place an order soon!\n\nThanks, Julie`,
      },
    ],
  });
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({
    to: "",
    subject: "",
    body: "",
  });
  const [isNewTemplateOpen, setIsNewTemplateOpen] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({
    name: "",
    category: "Introduction",
    subject: "",
    body: "",
    tags: "",
    share: true,
  });
  const [templatesList, setTemplatesList] = useState<TemplateItem[]>(EMAIL_TEMPLATES_DATA);
  const [isPlaceholdersExpanded, setIsPlaceholdersExpanded] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  const insertPlaceholder = (placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setNewTemplateForm((prev) => ({
        ...prev,
        body: prev.body + placeholder,
      }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = newTemplateForm.body;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setNewTemplateForm((prev) => ({
      ...prev,
      body: before + placeholder + after,
    }));

    // Reset cursor position after state update
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
    }, 0);
  };

  const handleCreateTemplate = () => {
    if (!newTemplateForm.name.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    if (!newTemplateForm.body.trim()) {
      toast.error("Please enter the template body");
      return;
    }

    const newTemplate: TemplateItem = {
      id: String(templatesList.length + 1),
      category: newTemplateForm.category || "Subject",
      name: newTemplateForm.name,
      body: newTemplateForm.body,
      tags: newTemplateForm.tags
        ? newTemplateForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    };

    setTemplatesList((prev) => [newTemplate, ...prev]);
    toast.success(`Template "${newTemplateForm.name}" created successfully!`);
    setIsNewTemplateOpen(false);
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    setTemplatesList((prev) => prev.filter((t) => t.id !== id));
    toast.success(`Template "${name}" deleted successfully!`);
  };

  const handleDeleteConversation = (id: string, name: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setSelectedConversationId(null);
    toast.success(`Conversation with ${name} deleted successfully!`);
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
            <button
              onClick={() => {
                setActiveTab("inboxes");
                toast.success("Inboxes view selected");
              }}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold cursor-pointer transition-all border ${
                activeTab === "inboxes"
                  ? "text-[#dd5437] bg-[#fdf2f0] border-[#dd5437]/15"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 border-transparent bg-transparent"
              }`}
            >
              <Inbox className={`h-3.5 w-3.5 ${activeTab === "inboxes" ? "text-[#dd5437] stroke-[2.5px]" : "text-slate-400"}`} />
              Inboxes
              <ChevronDown className={`h-3 w-3 ${activeTab === "inboxes" ? "text-[#dd5437] stroke-[2.5px]" : "text-slate-400"}`} />
            </button>
            <button
              onClick={() => {
                setActiveTab("docs");
                toast.success("Docs view selected");
              }}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer transition-all border ${
                activeTab === "docs"
                  ? "text-[#dd5437] bg-[#fdf2f0] border-[#dd5437]/15 font-extrabold"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 border-transparent bg-transparent"
              }`}
            >
              <FileText className={`h-3.5 w-3.5 ${activeTab === "docs" ? "text-[#dd5437] stroke-[2.5px]" : "text-slate-400"}`} />
              Docs
            </button>
            <button
              onClick={() => {
                setActiveTab("templates");
                toast.success("Templates view selected");
              }}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer transition-all border ${
                activeTab === "templates"
                  ? "text-[#dd5437] bg-[#fdf2f0] border-[#dd5437]/15 font-extrabold"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 border-transparent bg-transparent"
              }`}
            >
              <LayoutGrid className={`h-3.5 w-3.5 ${activeTab === "templates" ? "text-[#dd5437] stroke-[2.5px]" : "text-slate-400"}`} />
              Templates
            </button>
            <button
              onClick={() => {
                setActiveTab("report");
                toast.success("Report view selected");
              }}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer transition-all border ${
                activeTab === "report"
                  ? "text-[#dd5437] bg-[#fdf2f0] border-[#dd5437]/15 font-extrabold"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 border-transparent bg-transparent"
              }`}
            >
              <TrendingUp className={`h-3.5 w-3.5 ${activeTab === "report" ? "text-[#dd5437] stroke-[2.5px]" : "text-slate-400"}`} />
              Report
            </button>
            <button
              onClick={() => {
                setActiveTab("manage");
                toast.success("Manage view selected");
              }}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer transition-all border ${
                activeTab === "manage"
                  ? "text-[#dd5437] bg-[#fdf2f0] border-[#dd5437]/15 font-extrabold"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 border-transparent bg-transparent"
              }`}
            >
              <SlidersHorizontal className={`h-3.5 w-3.5 ${activeTab === "manage" ? "text-[#dd5437] stroke-[2.5px]" : "text-slate-400"}`} />
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
      {isCollapsed ? (
        <div className="flex-1 p-8 bg-slate-50/40 flex gap-6">
          {activeTab === "templates" || activeTab === "docs" ? (
            <div className="flex flex-col gap-6 w-full">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Email Templates</h1>
                </div>
                <button
                  onClick={() => {
                    setNewTemplateForm({
                      name: "",
                      category: "Subject",
                      subject: "",
                      body: "",
                      tags: "",
                      share: true,
                    });
                    setIsNewTemplateOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-[#dd5437] hover:bg-[#dd5437]/90 px-4.5 py-2.5 text-xs font-bold text-white shadow-sm active:scale-[0.98] transition-all cursor-pointer select-none"
                >
                  <Plus className="h-4 w-4 text-white stroke-[2.5px]" />
                  New Template
                </button>
              </div>

              {/* Search & Category filter */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative max-w-md flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    placeholder="Search by name or tags..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-700 outline-none focus:border-slate-350 transition-all placeholder:text-slate-400 shadow-3xs"
                  />
                </div>
                <div className="relative">
                  <select
                    className="appearance-none rounded-xl border border-slate-205 bg-white py-2.5 pl-4 pr-10 text-xs font-semibold text-slate-700 outline-none focus:border-slate-350 cursor-pointer shadow-3xs"
                    defaultValue="all"
                  >
                    <option value="all">All categories</option>
                    <option value="meeting">Meeting</option>
                    <option value="intro">Introduction</option>
                    <option value="followup">Follow-up</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Templates grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {templatesList.map((t) => (
                  <div key={t.id} className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-3xs flex flex-col justify-between hover:shadow-2xs transition-shadow">
                    <div>
                      {/* Top row with Category and Actions */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1.5 bg-[#fdf2f0] border border-[#dd5437]/10 px-2.5 py-0.5 rounded-full">
                          <span className="text-[10px] font-extrabold uppercase text-[#dd5437] tracking-wider">
                            {t.category}
                          </span>
                          <Globe className="h-3 w-3 text-[#dd5437] opacity-80" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toast.info(`Editing ${t.name}`)}
                            className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 hover:text-slate-700 transition-colors text-slate-400 cursor-pointer"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(t.id, t.name)}
                            className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 hover:text-rose-600 transition-colors text-slate-400 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Template name */}
                      <h3 className="text-sm font-extrabold text-slate-800 mb-2 truncate">
                        {t.name}
                      </h3>

                      {/* Template body */}
                      <p className="text-xs font-semibold text-slate-450 line-clamp-3 leading-relaxed mb-4 whitespace-pre-wrap">
                        {t.body}
                      </p>
                    </div>

                    <div>
                      {/* Tags badges */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {t.tags.map((tag) => (
                          <span key={tag} className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Use template button */}
                      <button
                        onClick={() => {
                          setComposeData({
                            to: "",
                            subject: `${t.name} - `,
                            body: t.body,
                          });
                          setIsComposeOpen(true);
                          toast.success(`Drafting with template: ${t.name}`);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 cursor-pointer transition-all shadow-3xs"
                      >
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        Use Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Left Sub-Navigation Pane */}
              <div className="w-60 shrink-0 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col gap-4 select-none">
                <div>
                  <h2 className="text-base font-extrabold text-slate-800">Support</h2>
                  <span className="text-[11px] font-bold text-slate-400">12 Conversations</span>
                </div>

                {/* Menu items */}
                <div className="flex flex-col gap-0.5">
                  {[
                    { label: "Chat", icon: MessageSquare },
                    { label: "Unassigned", icon: Compass },
                    { label: "Mine", icon: Target },
                    { label: "Later", icon: Clock },
                    { label: "Drafts", icon: FileText },
                    { label: "Assigned", icon: UserCheck },
                    { label: "Closed", icon: CheckSquare },
                    { label: "Spam", icon: AlertTriangle },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => toast.info(`${item.label} clicked`)}
                        className="group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer border-0 bg-transparent w-full text-left"
                      >
                        <Icon className="h-4 w-4 text-slate-400 group-hover:text-slate-655 transition-colors" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Teams Section */}
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 px-3">
                    Teams
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {["Accounts", "Wholesale"].map((team) => (
                      <button
                        key={team}
                        onClick={() => toast.info(`${team} clicked`)}
                        className="flex items-center px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer border-0 bg-transparent w-full text-left"
                      >
                        <span>{team}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Views Section */}
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 px-3">
                    Views
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {[
                      { label: "All", active: true },
                      { label: "Urgent", active: false },
                      { label: "Site Issues", active: false },
                    ].map((view) => (
                      <button
                        key={view.label}
                        onClick={() => toast.info(`${view.label} view selected`)}
                        className={`flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 w-full text-left ${
                          view.active
                            ? "bg-[#dd5437] text-white shadow-md shadow-[#dd5437]/15"
                            : "text-slate-655 hover:bg-slate-50 bg-transparent"
                        }`}
                      >
                        <span>{view.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {selectedConversationId ? (
                <>
                  {/* Detailed Message Thread Workspace */}
                  <div className="flex-1 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                    <div className="flex flex-col gap-6 text-left">
                      {/* Detailed Header Toolbar */}
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedConversationId(null)}
                            className="flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer active:scale-95"
                            title="Back to Inbox"
                          >
                            <ChevronLeft className="h-4 w-4 stroke-[2.5px]" />
                          </button>
                          <span className="text-xs font-black text-slate-800 truncate max-w-xs">
                            {conversations.find(c => c.id === selectedConversationId)?.conversation || "Message details"}
                          </span>
                        </div>

                        {/* Top row actions */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-black select-none cursor-pointer">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>Active</span>
                            <ChevronDown className="h-3.5 w-3.5 stroke-[2.5px] opacity-80" />
                          </div>

                          <div className="flex items-center gap-1">
                            {[
                              { icon: UserCheck, label: "Assign" },
                              { icon: Clock, label: "Snooze" },
                              { icon: Tag, label: "Tag" },
                              { 
                                icon: Trash2, 
                                label: "Delete", 
                                onClick: () => { 
                                  const c = conversations.find(x => x.id === selectedConversationId);
                                  if (c) handleDeleteConversation(c.id, c.name);
                                } 
                              },
                              { icon: MoreHorizontal, label: "More" }
                            ].map((item, idx) => {
                              const Icon = item.icon;
                              return (
                                <button
                                  key={idx}
                                  onClick={item.onClick || (() => toast.info(`${item.label} clicked`))}
                                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-655 hover:bg-slate-50 transition-colors cursor-pointer"
                                  title={item.label}
                                >
                                  <Icon className="h-4 w-4" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Ticket Title & Tag Badges */}
                      <div className="space-y-1.5 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-400 select-all cursor-pointer">#56812</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText("#56812");
                              toast.success("Ticket ID copied!");
                            }}
                            className="text-slate-350 hover:text-slate-500 p-1 rounded hover:bg-slate-55 transition-all cursor-pointer"
                            title="Copy Ticket ID"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                        <h2 className="text-lg font-black text-slate-800 tracking-tight leading-tight">
                          {conversations.find(c => c.id === selectedConversationId)?.conversation || "Email Message"}
                        </h2>
                        
                        <div className="flex flex-wrap gap-2 pt-1.5">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-205 px-2.5 py-0.5 rounded-lg">
                            category-page-issue <span className="text-slate-400 font-normal hover:text-rose-600 cursor-pointer ml-1 select-none">×</span>
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-205 px-2.5 py-0.5 rounded-lg">
                            category-page-issue <span className="text-slate-400 font-normal hover:text-rose-600 cursor-pointer ml-1 select-none">×</span>
                          </span>
                        </div>
                      </div>

                      {/* Message Thread Body card containers */}
                      <div className="space-y-4">
                        {(conversationMessages[selectedConversationId] || [
                          {
                            sender: conversations.find(c => c.id === selectedConversationId)?.name || "Sender",
                            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
                            date: "Jan 28",
                            body: `Hi there,\n\nI'm having trouble using the filters in the Accessories section. When I select "Price: Under $50" and "Brand: EcoChic," the results are either empty or incorrect. Could you look into this? I'd love to place an order soon!\n\nThanks, Julie`
                          }
                        ]).map((msg, idx) => (
                          <div
                            key={idx}
                            className={`border rounded-3xl p-6 flex flex-col gap-4 shadow-3xs ${
                              msg.isSent
                                ? "border-[#dd5437]/20 bg-white"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                              <div className="flex items-center gap-3">
                                {msg.isSent ? (
                                  msg.isNote ? (
                                    <img
                                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80"
                                      alt="Jean Doe avatar"
                                      className="h-9 w-9 rounded-full object-cover border border-slate-100 shrink-0 animate-in fade-in"
                                    />
                                  ) : (
                                    <div className="h-9 w-9 rounded-full bg-[#dd5437] text-white flex items-center justify-center font-bold text-sm shadow-sm select-none border border-[#dd5437]/10 shrink-0">
                                      J
                                    </div>
                                  )
                                ) : (
                                  <img
                                    src={msg.avatar}
                                    alt="Sender avatar"
                                    className="h-9 w-9 rounded-full object-cover border border-slate-100 shrink-0"
                                  />
                                )}
                                <div className="flex flex-col text-left">
                                  <span className="text-xs font-black text-slate-800">
                                    {msg.sender}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
                                {msg.isNote && <Lock className="h-3 w-3 text-slate-400 shrink-0" />}
                                <span>{msg.isNote ? "• " : ""}{msg.date}</span>
                              </div>
                            </div>

                            <div className="text-xs font-semibold text-slate-655 leading-relaxed whitespace-pre-line text-left py-2">
                              {msg.body}
                            </div>
                          </div>
                        ))}
                      </div>
                                      {/* Footer Actions / Inline Reply */}
                    {isInlineReplying ? (
                      <div className={`rounded-3xl p-5 bg-white shadow-3xs flex flex-col gap-4 mt-4 w-full select-none text-left relative border transition-all ${
                        isExpandedReply ? "border-slate-200" : "border-[#dd5437]/20"
                      }`}>
                        {/* Float absolute controls pill container matching attached mockup */}
                        <div className="absolute -top-3.5 right-6 flex items-center rounded-lg border border-slate-200 bg-white px-2 py-0.5 shadow-3xs z-10 select-none">
                          <button
                            type="button"
                            onClick={() => setIsExpandedReply(!isExpandedReply)}
                            className="p-1 rounded hover:bg-slate-50 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                            title={isExpandedReply ? "Collapse Editor" : "Expand Editor"}
                          >
                            <Maximize2 className="h-3.5 w-3.5 stroke-[2.5px]" />
                          </button>
                          <div className="w-px h-3.5 bg-slate-200 mx-1.5" />
                          <button
                            type="button"
                            onClick={() => {
                              setIsInlineReplying(false);
                              setIsExpandedReply(false);
                            }}
                            className="p-1 rounded hover:bg-slate-55 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                            title="Close Reply"
                          >
                            <X className="h-3.5 w-3.5 stroke-[2.5px]" />
                          </button>
                        </div>

                        {/* Inline Reply Header */}
                        <div className={`flex items-center justify-between pb-2 ${
                          isExpandedReply ? "border-b border-slate-100 pb-2.5" : ""
                        }`}>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <CornerUpLeft className="h-3.5 w-3.5 text-slate-400" />
                            <span>jeandoe@theapplianceguys.com.au</span>
                          </div>
                        </div>

                        {/* Inline Reply Body */}
                        <div className="space-y-3">
                          <textarea
                            rows={isExpandedReply ? 10 : 2}
                            value={inlineReplyText}
                            onChange={(e) => setInlineReplyText(e.target.value)}
                            placeholder="Type / for more options"
                            className="w-full py-1 border-0 focus:ring-0 outline-none text-xs font-semibold text-slate-700 placeholder:text-slate-400 placeholder:font-semibold resize-none bg-transparent"
                          />
                          
                          {/* Saved Replies badge pills */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setInlineReplyText("Hi Julie,\n\nThank you for reaching out! We are currently looking into the filter issue in the Accessories section and will get back to you shortly.\n\nBest,\nJean");
                              }}
                              className="flex items-center gap-1.5 text-[10px] font-extrabold text-violet-650 bg-violet-50 border border-violet-100 px-3 py-1.5 rounded-full cursor-pointer hover:bg-violet-100 transition-colors"
                            >
                              <Sparkles className="h-3 w-3 text-violet-500 fill-violet-500" />
                              <span>Saved reply</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setInlineReplyText("Hi Julie,\n\nWe have resolved the Accessories filter glitch! Please refresh the page and try placing your order again. Let us know if you run into any other issues.\n\nBest,\nJean");
                              }}
                              className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-600 bg-slate-50 border border-slate-205 px-3 py-1.5 rounded-full cursor-pointer hover:bg-slate-105 transition-colors"
                            >
                              <MessageSquare className="h-3 w-3 text-slate-400" />
                              <span>Saved reply</span>
                            </button>
                          </div>
                        </div>

                        {/* Inline Reply Toolbar Footer */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toast.info("Insert file or attachment")}
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#d2e3fc] bg-[#e8f0fe] hover:bg-[#d2e3fc]/30 rounded-xl text-[11px] font-extrabold text-[#1a73e8] cursor-pointer transition-colors shadow-3xs"
                            >
                              <span className="font-extrabold text-sm leading-none">+</span>
                              <span>Insert</span>
                            </button>
                            <button
                              onClick={() => toast.info("Formatting guidelines")}
                              className="w-8 h-8 flex items-center justify-center border border-slate-200 hover:bg-slate-50 bg-white rounded-xl text-[11px] font-black text-slate-700 cursor-pointer shadow-3xs"
                            >
                              Aa
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-700 cursor-pointer select-none shadow-3xs">
                              <span>Closed</span>
                              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            </div>
                            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 hover:bg-slate-50 bg-white rounded-xl text-slate-400 hover:text-slate-655 cursor-pointer shadow-3xs">
                              <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 hover:bg-slate-50 bg-white rounded-xl text-slate-400 hover:text-slate-655 cursor-pointer shadow-3xs">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 hover:bg-slate-50 bg-white rounded-xl text-slate-400 hover:text-slate-655 cursor-pointer shadow-3xs">
                              <Send className="h-3.5 w-3.5 text-slate-400" />
                            </button>
                            <button
                              onClick={() => {
                                if (!inlineReplyText.trim()) {
                                  toast.error("Please enter a reply message");
                                  return;
                                }

                                const newMsg = {
                                  sender: "jeandoe@theapplianceguys.com.au",
                                  avatar: "",
                                  date: "Just now",
                                  body: inlineReplyText,
                                  isSent: true
                                };

                                setConversationMessages((prev) => ({
                                  ...prev,
                                  [selectedConversationId || "2"]: [...(prev[selectedConversationId || "2"] || []), newMsg]
                                }));

                                toast.success("Reply sent successfully!");
                                setInlineReplyText("");
                                setIsInlineReplying(false);
                                setIsExpandedReply(false);
                              }}
                              className={`rounded-xl px-6 py-2 text-center text-[11px] font-extrabold text-white transition-all cursor-pointer shadow-md active:scale-[0.98] ${
                                inlineReplyText.trim()
                                  ? "bg-[#dd5437] hover:bg-[#c9452b] shadow-[#dd5437]/15"
                                  : "bg-[#f5c6bb] cursor-not-allowed shadow-none"
                              }`}
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3 mt-8 pb-4">
                        <button
                          onClick={() => {
                            setInlineReplyText(`Hey there, Julie!\n\nThank you very much for your email, we can definitely assist with this request! I've gone ahead and made the appropriate changes, but you'll be happy to know we're shipping a fix tomorrow where you'll be able to make these changes via your account in the future!\n\nYou should receive an updated invoice with the updated details momentarily.\n\nWhile I've got you, our new feature webinar is on Monday at 11 AM ET. Register here to save your spot-we'll send a recording link afterward if you can't attend live! Hope to see you then :)`);
                            setIsInlineReplying(true);
                          }}
                          className="flex items-center gap-2 rounded-xl bg-[#dd5437] hover:bg-[#dd5437]/90 px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-[#dd5437]/15 active:scale-[0.98] transition-all cursor-pointer select-none"
                        >
                          <span>Reply</span>
                          <CornerUpLeft className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            const newNotedState = !isNoted;
                            setIsNoted(newNotedState);
                            
                            if (newNotedState) {
                              toast.success("Conversation marked as Noted!");
                              // Add the private internal note to the chat stack statefully
                              const noteMsg = {
                                sender: "Jean Doe",
                                avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80",
                                date: "Jan 28",
                                body: `Hey there, Julie!\n\nThank you very much for your email, we can definitely assist with this request! I've gone ahead and made the appropriate changes, but you'll be happy to know we're shipping a fix tomorrow where you'll be able to make these changes via your account in the future!\n\nYou should receive an updated invoice with the updated details momentarily.\n\nWhile I've got you, our new feature webinar is on Monday at 11 AM ET. Register here to save your spot-we'll send a recording link afterward if you can't attend live! Hope to see you then :)`,
                                isSent: true,
                                isNote: true
                              };
                              setConversationMessages((prev) => ({
                                ...prev,
                                [selectedConversationId || "2"]: [...(prev[selectedConversationId || "2"] || []), noteMsg]
                              }));
                            } else {
                              toast.success("Note removed from conversation thread");
                              // Prune the internal note from the stack
                              setConversationMessages((prev) => ({
                                ...prev,
                                [selectedConversationId || "2"]: (prev[selectedConversationId || "2"] || []).filter(x => !x.isNote)
                              }));
                            }
                          }}
                          className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-extrabold active:scale-[0.98] transition-all cursor-pointer select-none border ${
                            isNoted
                              ? "bg-[#e6f4ea] border-[#c2e7c9] text-[#137333] hover:bg-[#e6f4ea]/80"
                              : "border-slate-205 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>Noted</span>
                          {isNoted ? (
                            <Check className="h-3.5 w-3.5 text-[#137333] stroke-[3px]" />
                          ) : (
                            <StickyNote className="h-3.5 w-3.5 text-[#dd5437]" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  </div>

                  {/* Customer Sidecard Profile Info */}
                  <div className="w-80 shrink-0 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-6 items-center relative select-none">
                    <button
                      onClick={() => toast.info("Profile actions")}
                      className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Profile Options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    <div className="flex flex-col items-center mt-4">
                      <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80"
                        alt="Profile Card"
                        className="h-16 w-16 rounded-2xl object-cover border border-slate-100 shadow-3xs"
                      />
                      <h3 className="text-sm font-extrabold text-slate-800 mt-4 tracking-tight leading-none">
                        {conversations.find(c => c.id === selectedConversationId)?.name || "Customer Name"}
                      </h3>
                      <span className="text-[11px] font-bold text-[#dd5437] hover:underline cursor-pointer mt-2 select-all">
                        juliemartinez@theapplianceguys.com.au
                      </span>
                    </div>

                    <div className="w-full border-t border-slate-100 pt-5 flex flex-col gap-3 text-left">
                      <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                        <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>StellarTech Solutions</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="select-all">+61414547447</span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText("+61414547447");
                            toast.success("Phone number copied!");
                          }}
                          className="text-slate-350 hover:text-slate-500 p-1 rounded hover:bg-slate-50 transition-all cursor-pointer"
                          title="Copy Phone"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-x-auto border border-slate-200/80 bg-white rounded-3xl shadow-xs">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-slate-200/50">
                        <th className="w-12 px-5 py-4 text-center select-none">
                          <input type="checkbox" className="rounded border-slate-350 text-[#dd5437] focus:ring-[#dd5437] cursor-pointer" />
                        </th>
                        {["Name", "Email ID (#)", "Conversation", "Date", "Waiting", "Status"].map((h, i) => (
                          <th
                            key={h}
                            className={`px-5 py-4 text-[11px] font-bold text-slate-555 select-none ${
                              i === 0 ? "w-40" : i === 1 ? "w-28" : i === 2 ? "w-auto" : "w-36 text-center"
                            }`}
                          >
                            <div className={`flex items-center gap-1.5 cursor-pointer hover:text-slate-800 transition-colors ${i < 3 ? "justify-start" : "justify-center"}`}>
                              <span>{h}</span>
                              <ChevronsUpDown className="h-3 w-3 text-slate-400 shrink-0" />
                            </div>
                          </th>
                        ))}
                        <th className="w-12 px-5 py-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {conversations.map((item) => (
                        <tr
                          key={item.id}
                          onClick={(e) => {
                            if (
                              (e.target as HTMLElement).tagName === "INPUT" ||
                              (e.target as HTMLElement).closest("button")
                            ) {
                              return;
                            }
                            setSelectedConversationId(item.id);
                            toast.success(`Opening conversation with ${item.name}`);
                          }}
                          className={`border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70 transition-colors cursor-pointer ${
                            item.id === selectedConversationId || (selectedConversationId === null && item.isSelected) ? "bg-[#fdf2f0]/60 hover:bg-[#fdf2f0]/80" : ""
                          }`}
                        >
                          <td className="px-5 py-4 text-center">
                            <input type="checkbox" className="rounded border-slate-350 text-[#dd5437] focus:ring-[#dd5437] cursor-pointer" defaultChecked={item.isSelected} />
                          </td>
                          <td className="px-5 py-4 text-left font-black text-slate-800 text-xs select-all cursor-pointer">
                            {item.name}
                          </td>
                          <td className="px-5 py-4 text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-500">
                                {item.emailId}
                              </span>
                              <button
                                onClick={() => handleCopyAddress(item.emailId)}
                                className="text-slate-355 hover:text-slate-500 bg-transparent border-0 flex items-center justify-center p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Copy ID"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-left text-xs font-semibold text-slate-600 max-w-sm truncate">
                            {item.conversation}
                          </td>
                          <td className="px-5 py-4 text-center text-xs font-semibold text-slate-500">
                            <div className="flex items-center justify-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{item.date}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center text-xs font-semibold text-slate-500">
                            {item.waiting}
                          </td>
                          <td className={`px-5 py-4 text-center text-xs font-black ${item.statusColorClass}`}>
                            {item.status}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={() => toast.info(`Options for ${item.name}`)}
                              className="text-slate-400 hover:text-slate-600 bg-transparent border-0 flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
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

                    <button className="text-slate-400 hover:text-slate-655 bg-transparent border-0 flex items-center justify-center p-1 rounded-lg hover:bg-slate-100/35 transition-colors cursor-pointer focus:outline-none">
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
      )}

      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-2xl p-6 bg-white rounded-3xl shadow-xl border border-slate-100 select-none">
          <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <DialogTitle className="text-xl font-extrabold text-slate-800">
              Compose Email
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* To Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">To</label>
              <input
                type="email"
                value={composeData.to}
                onChange={(e) => setComposeData((prev) => ({ ...prev, to: e.target.value }))}
                placeholder="Enter receipt email"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs font-semibold text-slate-700 outline-none focus:border-slate-350 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Subject Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Subject</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData((prev) => ({ ...prev, subject: e.target.value }))}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs font-semibold text-slate-700 outline-none focus:border-slate-350 transition-all"
                />
                <button
                  onClick={() => toast.info("Switching templates")}
                  className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer bg-white whitespace-nowrap"
                >
                  <Sparkles className="h-4 w-4 text-slate-500" />
                  Templates
                </button>
              </div>
            </div>

            {/* Body Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Body</label>
              <textarea
                rows={10}
                value={composeData.body}
                onChange={(e) => setComposeData((prev) => ({ ...prev, body: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-xs font-semibold text-slate-700 outline-none focus:border-slate-350 transition-all leading-relaxed"
              />
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  toast.success("Draft email saved successfully!");
                  setIsComposeOpen(false);
                }}
                className="w-full rounded-xl bg-[#dd5437] hover:bg-[#dd5437]/90 py-3 text-center text-xs font-extrabold text-white transition-all cursor-pointer select-none"
              >
                Save
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewTemplateOpen} onOpenChange={setIsNewTemplateOpen}>
        <DialogContent className="max-w-[480px] p-6 bg-white rounded-3xl shadow-xl border border-slate-100 select-none overflow-y-auto max-h-[90vh] focus:outline-none">
          <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <DialogTitle className="text-xl font-extrabold text-slate-800">
              New Template
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4 text-left">
            {/* Template Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Template Name</label>
              <input
                type="text"
                value={newTemplateForm.name}
                onChange={(e) => setNewTemplateForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g Welcome email"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs font-semibold text-slate-700 outline-none focus:border-slate-350 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Category</label>
              <div className="relative">
                <select
                  value={newTemplateForm.category}
                  onChange={(e) => setNewTemplateForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-xs font-semibold text-slate-700 outline-none focus:border-slate-350 cursor-pointer"
                >
                  <option value="Subject">Subject</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Introduction">Introduction</option>
                  <option value="Follow-up">Follow-up</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Subject</label>
              <input
                type="text"
                value={newTemplateForm.subject}
                onChange={(e) => setNewTemplateForm((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject line"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs font-semibold text-slate-700 outline-none focus:border-slate-350 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Body</label>
              <textarea
                ref={textareaRef}
                rows={5}
                value={newTemplateForm.body}
                onChange={(e) => setNewTemplateForm((prev) => ({ ...prev, body: e.target.value }))}
                placeholder="Write here"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-xs font-semibold text-slate-700 outline-none focus:border-slate-350 transition-all leading-relaxed placeholder:text-slate-400 resize-none"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Tags (Comma-seperated)</label>
              <input
                type="text"
                value={newTemplateForm.tags}
                onChange={(e) => setNewTemplateForm((prev) => ({ ...prev, tags: e.target.value }))}
                placeholder="e.g, Intro, could teach"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs font-semibold text-slate-700 outline-none focus:border-slate-350 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Share toggle */}
            <div className="flex items-center gap-3 py-1 text-left select-none">
              <button
                type="button"
                onClick={() => setNewTemplateForm((prev) => ({ ...prev, share: !prev.share }))}
                className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  newTemplateForm.share ? "bg-[#dd5437]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                    newTemplateForm.share ? "translate-x-4.5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-xs font-bold text-slate-700">
                Share with all team members
              </span>
            </div>

            {/* Placeholders section */}
            <div className="border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setIsPlaceholdersExpanded(!isPlaceholdersExpanded)}
                className="w-full flex items-center justify-between py-1 text-xs font-bold text-slate-500 hover:text-slate-750 transition-colors focus:outline-none"
              >
                <span>Available placeholders</span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                    isPlaceholdersExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
              
              {isPlaceholdersExpanded && (
                <div className="mt-2.5 space-y-2.5">
                  <div className="flex flex-wrap gap-2">
                    {[
                      "{{firstName}}",
                      "{{fullName}}",
                      "{{email}}",
                      "{{companyName}}",
                      "{{senderName}}"
                    ].map((placeholder) => (
                      <button
                        key={placeholder}
                        type="button"
                        onClick={() => insertPlaceholder(placeholder)}
                        className="text-[11px] font-bold text-slate-700 bg-white border border-slate-300 hover:border-slate-450 hover:bg-slate-50 px-3 py-1 rounded-full cursor-pointer transition-all active:scale-95"
                      >
                        {placeholder}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 leading-normal">
                    These are auto-filled when using the template in an email compose or reply.
                  </p>
                </div>
              )}
            </div>

            {/* Create button */}
            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={handleCreateTemplate}
                className="w-full rounded-xl bg-[#dd5437] hover:bg-[#dd5437]/90 py-3 text-center text-xs font-extrabold text-white transition-all cursor-pointer select-none shadow-md shadow-[#dd5437]/15 active:scale-[0.98]"
              >
                Create template
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
