export type OfficeStatus = "Active" | "Lapsing" | "Inactive" | "Archived";

export const PIPELINE_STAGES = [
  "Identified",
  "Contact Made",
  "Discovery / Needs Assessment",
  "Proposal Sent",
  "Pilot / First Order",
  "Active Account",
  "Onboarding Started",
  "Documents Sent",
  "Training Scheduled",
  "First Order Placed",
  "Onboarding Completed",
  "Lapsing Identified",
  "Re-Engagement Outreach",
  "Meeting Scheduled",
  "Offer / Incentive Sent",
  "Re-Activated",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export type Role = "admin" | "manager" | "user";

export type User = {
  id: string;
  email: string;
  name: string;
  initials?: string;
  role: Role;
  active: boolean;
  phone?: string;
  title?: string;
  teamRole?: string;
  businessType?: string;
  region?: string;
  zones?: string;
  startDate?: string;
  reportsTo?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  initials?: string;
  role?: Role;
};

export type Office = {
  id: string;
  name: string;
  tradingName?: string;
  legalEntityName?: string;
  abn?: string;
  initials?: string;
  avatarColor?: string;
  status: OfficeStatus;
  pipelineStage?: PipelineStage;
  pipelinePosition?: number;
  pipelineStatus?: "Active" | "Stalled" | "Lost" | "Won";
  source?: "Cold Outreach" | "Inbound" | "Referral" | "Event" | "Lapsed Client" | "Other";
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  zone?: string;
  /** Can be either an ObjectId string (writes) or a populated UserSummary (reads). */
  accountManager?: string | UserSummary;
  pum?: number;
  estimatedMonthlySpend?: number;
  platform?: string;
  inactivityAlert?: "none" | "14" | "30" | "60" | "ai";
  openedAt?: string;
  lastContactedAt?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
};

export function accountManagerName(am: Office["accountManager"]): string | undefined {
  if (!am) return undefined;
  if (typeof am === "string") return undefined;
  return am.name;
}
export function accountManagerId(am: Office["accountManager"]): string | undefined {
  if (!am) return undefined;
  if (typeof am === "string") return am;
  return am.id;
}

export type OfficeListResponse = {
  items: Office[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type OfficeListQuery = {
  search?: string;
  status?: OfficeStatus;
  pipelineStage?: PipelineStage;
  accountManager?: string;
  zone?: string;
  page?: number;
  limit?: number;
  sort?: string;
};

export type OfficeSummary = {
  Active: number;
  Lapsing: number;
  Inactive: number;
  total: number;
};

export type PipelineBoard = {
  columns: { stage: PipelineStage; cards: Office[] }[];
};

export type PipelineSummary = {
  counts: Record<PipelineStage, number>;
};

export type TaskStatus =
  | "To Do"
  | "In Progress"
  | "Waiting on Client"
  | "Waiting on Internal Team"
  | "Scheduled"
  | "Deferred"
  | "Approved"
  | "Done";
export type TaskPriority = "Urgent" | "High" | "Medium" | "Low";

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  office?: string;
  assignee?: string;
  createdBy: string;
  dueAt?: string;
  completedAt?: string;
  startDate?: string;
  parentTask?: string;
  recurring?: boolean;
  saveAsTemplate?: boolean;
  blockedBy?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskListResponse = {
  items: Task[];
  page: number;
  limit: number;
  total: number;
};

export type TaskScope = "all" | "mine" | "overdue" | "today" | "week" | "unassigned" | "done";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

// --- Users ---
export type UserListResponse = {
  items: User[];
  page: number;
  limit: number;
  total: number;
};

// --- Property Managers ---
export const PM_ROLES = [
  "Principal",
  "Head of PM",
  "Property Manager",
  "Senior PM",
  "Assistant",
  "Accounts",
  "Other",
] as const;
export type PmRole = (typeof PM_ROLES)[number];

export const PM_PIPELINE_STAGES = [
  "New PM Identified",
  "Introduction Made",
  "Relationship Building",
  "First Order Placed",
  "Active PM",
  // Lapsing PM stages
  "Lapsing PM Identified",
  "Re-Engagement Outreach",
  "Meeting Scheduled",
  "Offer Sent",
  "Re-Activated PM",
  // Inactive PM stages
  "Inactive PM Identified",
  "Win-Back Outreach",
  "Discovery Call",
] as const;
export type PmPipelineStage = (typeof PM_PIPELINE_STAGES)[number];

export type OfficeSummary_Ref = {
  id: string;
  name: string;
  suburb?: string;
  status?: OfficeStatus;
  accountManager?: string | UserSummary;
  source?: string;
};

export type PropertyManager = {
  id: string;
  firstName: string;
  lastName?: string;
  fullName?: string;
  role: PmRole;
  pipelineStage?: PmPipelineStage;
  office: string | OfficeSummary_Ref;
  email?: string;
  phone?: string;
  propertiesManaged?: number;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type PmListResponse = {
  items: PropertyManager[];
  page: number;
  limit: number;
  total: number;
};

// --- Meetings ---
export const MEETING_STATUSES = ["scheduled", "completed", "cancelled", "no_show"] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export const MEETING_TYPES = ["Property Manager Meeting", "Cold Visit", "Follow-up", "Training", "Other"] as const;
export type MeetingType = (typeof MEETING_TYPES)[number];

export type Meeting = {
  id: string;
  title: string;
  meetingType: MeetingType;
  propertyManager?: string | PropertyManager;
  office?: string | OfficeSummary_Ref;
  attendees?: (string | UserSummary)[];
  startAt: string;
  endAt: string;
  location?: string;
  url?: string;
  notes?: string;
  status: MeetingStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type MeetingListResponse = {
  items: Meeting[];
  page: number;
  limit: number;
  total: number;
};

export type MeetingScope = "all" | "upcoming" | "past" | "today" | "week";

// --- Mailbox ---
export const MESSAGE_DIRECTIONS = ["inbound", "outbound"] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export type Message = {
  id: string;
  subject: string;
  from: string;
  to?: string[];
  cc?: string[];
  body?: string;
  snippet?: string;
  direction: MessageDirection;
  office?: string | { id: string; name: string };
  threadId?: string;
  receivedAt: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MessageListResponse = {
  items: Message[];
  page: number;
  limit: number;
  total: number;
};

export type MailboxSummary = { total: number; unread: number };

// --- Email Templates ---
export const TEMPLATE_CATEGORIES = [
  "Outreach",
  "Follow-up",
  "Onboarding",
  "Retention",
  "Pricing",
  "Other",
] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export type EmailTemplate = {
  id: string;
  name: string;
  category: TemplateCategory;
  subject: string;
  body: string;
  variables: string[];
  archived: boolean;
  createdBy: string | UserSummary;
  createdAt: string;
  updatedAt: string;
};

export type TemplateListResponse = {
  items: EmailTemplate[];
  page: number;
  limit: number;
  total: number;
};
