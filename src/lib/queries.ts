import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "./api";
import type {
  EmailTemplate,
  MailboxSummary,
  Meeting,
  MeetingListResponse,
  MeetingScope,
  MeetingStatus,
  MeetingType,
  Message,
  MessageDirection,
  MessageListResponse,
  Office,
  OfficeListQuery,
  OfficeListResponse,
  OfficeSummary,
  PipelineBoard,
  PipelineStage,
  PipelineSummary,
  PmListResponse,
  PmRole,
  PropertyManager,
  Task,
  TaskListResponse,
  TaskPriority,
  TaskScope,
  TaskStatus,
  TemplateCategory,
  TemplateListResponse,
  User,
  UserListResponse,
} from "./api-types";

export const qk = {
  offices: (q: OfficeListQuery = {}) => ["offices", q] as const,
  office: (id: string) => ["office", id] as const,
  officesSummary: () => ["offices", "summary"] as const,
  pipelineBoard: () => ["pipeline", "board"] as const,
  pipelineSummary: () => ["pipeline", "summary"] as const,
  tasks: (filters: TaskListQuery = {}) => ["tasks", filters] as const,
  users: (q: UserListQuery = {}) => ["users", q] as const,
  pms: (q: PmListQuery = {}) => ["property-managers", q] as const,
  meetings: (q: MeetingListQuery = {}) => ["meetings", q] as const,
  mailbox: (q: MailboxListQuery = {}) => ["mailbox", q] as const,
  mailboxSummary: () => ["mailbox", "summary"] as const,
  templates: (q: TemplateListQuery = {}) => ["email-templates", q] as const,
};

export type TaskListQuery = {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  office?: string;
  scope?: TaskScope;
  page?: number;
  limit?: number;
  sort?: string;
};

export type UserListQuery = {
  search?: string;
  role?: "admin" | "manager" | "user";
  active?: boolean;
  page?: number;
  limit?: number;
};

export type PmListQuery = {
  search?: string;
  office?: string;
  role?: PmRole;
  active?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
};

export type MeetingListQuery = {
  office?: string;
  attendee?: string;
  meetingType?: MeetingType;
  propertyManager?: string;
  status?: MeetingStatus;
  scope?: MeetingScope;
  page?: number;
  limit?: number;
  sort?: string;
};

export type MailboxListQuery = {
  search?: string;
  direction?: MessageDirection;
  office?: string;
  read?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
};

export type TemplateListQuery = {
  search?: string;
  category?: TemplateCategory;
  archived?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
};

/** Show a toast for any thrown ApiError. */
function showError(err: unknown, prefix = "Request failed") {
  const message = err instanceof ApiError ? err.message : (err as Error)?.message ?? "Unknown error";
  toast.error(`${prefix}: ${message}`);
}

// ---------------- Offices ----------------

export function useOffices(query: OfficeListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: qk.offices(query),
    queryFn: ({ signal }) => api.get<OfficeListResponse>("/api/offices", query, signal),
    enabled,
    placeholderData: (prev) => prev,
  });
}

export function useOffice(id: string | undefined) {
  return useQuery({
    queryKey: qk.office(id ?? ""),
    queryFn: ({ signal }) => api.get<Office>(`/api/offices/${id}`, undefined, signal),
    enabled: !!id,
  });
}

export function useOfficesSummary() {
  return useQuery({
    queryKey: qk.officesSummary(),
    queryFn: ({ signal }) => api.get<OfficeSummary>("/api/offices/summary", undefined, signal),
  });
}

export function useCreateOffice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Office> & { name: string }) =>
      api.post<Office>("/api/offices", input),
    onSuccess: (office) => {
      toast.success(`Office "${office.name}" created`);
      qc.invalidateQueries({ queryKey: ["offices"] });
      qc.invalidateQueries({ queryKey: ["pipeline"] });
    },
    onError: (err) => showError(err, "Failed to create office"),
  });
}

export function useUpdateOffice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Office> }) =>
      api.patch<Office>(`/api/offices/${id}`, patch),
    onSuccess: (office) => {
      toast.success(`Office "${office.name}" updated`);
      qc.invalidateQueries({ queryKey: ["offices"] });
      qc.invalidateQueries({ queryKey: ["pipeline"] });
      qc.setQueryData(qk.office(office.id), office);
    },
    onError: (err) => showError(err, "Failed to update office"),
  });
}

export function useDeleteOffice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/offices/${id}`),
    onSuccess: () => {
      toast.success("Office deleted");
      qc.invalidateQueries({ queryKey: ["offices"] });
      qc.invalidateQueries({ queryKey: ["pipeline"] });
    },
    onError: (err) => showError(err, "Failed to delete office"),
  });
}

export function useMoveStage() {
  const qc = useQueryClient();
  return useMutation<
    Office,
    Error,
    { id: string; pipelineStage: PipelineStage; pipelinePosition?: number },
    { previousBoard?: PipelineBoard; previousSummary?: PipelineSummary }
  >({
    mutationFn: (args) =>
      api.post<Office>(`/api/offices/${args.id}/stage`, {
        pipelineStage: args.pipelineStage,
        pipelinePosition: args.pipelinePosition,
      }),
    // Optimistic update — move the card immediately in cached board.
    onMutate: async ({ id, pipelineStage }) => {
      await qc.cancelQueries({ queryKey: ["pipeline"] });
      const previousBoard = qc.getQueryData<PipelineBoard>(qk.pipelineBoard());
      const previousSummary = qc.getQueryData<PipelineSummary>(qk.pipelineSummary());

      if (previousBoard) {
        let movedCard: Office | undefined;
        const columnsWithoutCard = previousBoard.columns.map((col) => {
          const idx = col.cards.findIndex((c) => c.id === id);
          if (idx === -1) return col;
          movedCard = { ...col.cards[idx]!, pipelineStage };
          return { ...col, cards: [...col.cards.slice(0, idx), ...col.cards.slice(idx + 1)] };
        });

        const optimistic: PipelineBoard = {
          columns: columnsWithoutCard.map((col) =>
            col.stage === pipelineStage && movedCard
              ? { ...col, cards: [...col.cards, movedCard] }
              : col,
          ),
        };
        qc.setQueryData(qk.pipelineBoard(), optimistic);
      }

      if (previousSummary && previousBoard) {
        const fromStage = previousBoard.columns.find((c) =>
          c.cards.some((card) => card.id === id),
        )?.stage;
        if (fromStage && fromStage !== pipelineStage) {
          const counts = { ...previousSummary.counts };
          counts[fromStage] = Math.max(0, (counts[fromStage] ?? 0) - 1);
          counts[pipelineStage] = (counts[pipelineStage] ?? 0) + 1;
          qc.setQueryData(qk.pipelineSummary(), { counts });
        }
      }

      return { previousBoard, previousSummary };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previousBoard) qc.setQueryData(qk.pipelineBoard(), ctx.previousBoard);
      if (ctx?.previousSummary) qc.setQueryData(qk.pipelineSummary(), ctx.previousSummary);
      showError(err, "Failed to move card");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["pipeline"] });
      qc.invalidateQueries({ queryKey: ["offices"] });
    },
  });
}

// ---------------- Pipeline ----------------

export function usePipelineBoard() {
  return useQuery({
    queryKey: qk.pipelineBoard(),
    queryFn: ({ signal }) => api.get<PipelineBoard>("/api/pipeline/board", undefined, signal),
  });
}

export function usePipelineSummary() {
  return useQuery({
    queryKey: qk.pipelineSummary(),
    queryFn: ({ signal }) => api.get<PipelineSummary>("/api/pipeline/summary", undefined, signal),
  });
}

// ---------------- Tasks ----------------

export function useTasks(filters: TaskListQuery = {}) {
  return useQuery({
    queryKey: qk.tasks(filters),
    queryFn: ({ signal }) => api.get<TaskListResponse>("/api/tasks", filters, signal),
    placeholderData: (prev) => prev,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Task> & { title: string }) => api.post<Task>("/api/tasks", input),
    onSuccess: () => {
      toast.success("Task created");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err) => showError(err, "Failed to create task"),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Task> }) =>
      api.patch<Task>(`/api/tasks/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (err) => showError(err, "Failed to update task"),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/tasks/${id}`),
    onSuccess: () => {
      toast.success("Task deleted");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err) => showError(err, "Failed to delete task"),
  });
}

// ---------------- Users ----------------

export function useUsers(query: UserListQuery = {}) {
  return useQuery({
    queryKey: qk.users(query),
    queryFn: ({ signal }) => api.get<UserListResponse>("/api/users", query, signal),
    placeholderData: (prev) => prev,
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: ({ signal }) => api.get<User>(`/api/users/${id}`, undefined, signal),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<User> & { name: string; email: string }) =>
      api.post<User>("/api/users", input),
    onSuccess: (user) => {
      toast.success(`Team member "${user.name}" added successfully`);
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => showError(err, "Failed to add team member"),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<User> }) =>
      api.patch<User>(`/api/users/${id}`, patch),
    onSuccess: (user) => {
      toast.success(`Team member "${user.name}" updated successfully`);
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["user", user.id] });
    },
    onError: (err) => showError(err, "Failed to update team member"),
  });
}

// ---------------- Property Managers ----------------

export function usePropertyManagers(query: PmListQuery = {}) {
  return useQuery({
    queryKey: qk.pms(query),
    queryFn: ({ signal }) => api.get<PmListResponse>("/api/property-managers", query, signal),
    placeholderData: (prev) => prev,
  });
}

export function useCreatePropertyManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<PropertyManager> & { firstName: string; office: string }) =>
      api.post<PropertyManager>("/api/property-managers", input),
    onSuccess: () => {
      toast.success("Property manager added");
      qc.invalidateQueries({ queryKey: ["property-managers"] });
    },
    onError: (err) => showError(err, "Failed to add property manager"),
  });
}

export function useUpdatePropertyManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<PropertyManager> }) =>
      api.patch<PropertyManager>(`/api/property-managers/${id}`, patch),
    onSuccess: () => {
      toast.success("Property manager updated");
      qc.invalidateQueries({ queryKey: ["property-managers"] });
    },
    onError: (err) => showError(err, "Failed to update property manager"),
  });
}

export function useDeletePropertyManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/property-managers/${id}`),
    onSuccess: () => {
      toast.success("Property manager removed");
      qc.invalidateQueries({ queryKey: ["property-managers"] });
    },
    onError: (err) => showError(err, "Failed to remove property manager"),
  });
}

// ---------------- Meetings ----------------

export function useMeetings(query: MeetingListQuery = {}) {
  return useQuery({
    queryKey: qk.meetings(query),
    queryFn: ({ signal }) => api.get<MeetingListResponse>("/api/meetings", query, signal),
    placeholderData: (prev) => prev,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Partial<Meeting> & { title: string; startAt: string; endAt: string },
    ) => api.post<Meeting>("/api/meetings", input),
    onSuccess: () => {
      toast.success("Meeting created");
      qc.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (err) => showError(err, "Failed to create meeting"),
  });
}

export function useUpdateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Meeting> }) =>
      api.patch<Meeting>(`/api/meetings/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
    onError: (err) => showError(err, "Failed to update meeting"),
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/meetings/${id}`),
    onSuccess: () => {
      toast.success("Meeting deleted");
      qc.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (err) => showError(err, "Failed to delete meeting"),
  });
}

// ---------------- Mailbox ----------------

export function useMessages(query: MailboxListQuery = {}) {
  return useQuery({
    queryKey: qk.mailbox(query),
    queryFn: ({ signal }) => api.get<MessageListResponse>("/api/mailbox", query, signal),
    placeholderData: (prev) => prev,
  });
}

export function useMailboxSummary() {
  return useQuery({
    queryKey: qk.mailboxSummary(),
    queryFn: ({ signal }) => api.get<MailboxSummary>("/api/mailbox/summary", undefined, signal),
  });
}

export function useUpdateMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Message> }) =>
      api.patch<Message>(`/api/mailbox/${id}`, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mailbox"] });
    },
    onError: (err) => showError(err, "Failed to update message"),
  });
}

export function useCreateMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Message> & { subject: string; from: string; direction: MessageDirection }) =>
      api.post<Message>("/api/mailbox", input),
    onSuccess: () => {
      toast.success("Message saved");
      qc.invalidateQueries({ queryKey: ["mailbox"] });
    },
    onError: (err) => showError(err, "Failed to save message"),
  });
}

export function useSyncMailbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ success: boolean; newCount: number }>("/api/mailbox/sync"),
    onSuccess: (res) => {
      if (res.newCount > 0) {
        toast.success(`Mailbox synchronized: ${res.newCount} new message(s) loaded.`);
      } else {
        toast.success("Mailbox is already up to date.");
      }
      qc.invalidateQueries({ queryKey: ["mailbox"] });
      qc.invalidateQueries({ queryKey: ["mailbox", "summary"] });
    },
    onError: (err) => showError(err, "Mailbox synchronization failed"),
  });
}

export function useSendMailbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { to: string[]; cc?: string[]; subject: string; body: string; office?: string }) =>
      api.post<Message>("/api/mailbox/send", input),
    onSuccess: () => {
      toast.success("Email sent successfully");
      qc.invalidateQueries({ queryKey: ["mailbox"] });
      qc.invalidateQueries({ queryKey: ["mailbox", "summary"] });
    },
    onError: (err) => showError(err, "Failed to send email"),
  });
}

// ---------------- Email Templates ----------------

export function useTemplates(query: TemplateListQuery = {}) {
  return useQuery({
    queryKey: qk.templates(query),
    queryFn: ({ signal }) => api.get<TemplateListResponse>("/api/email-templates", query, signal),
    placeholderData: (prev) => prev,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<EmailTemplate> & { name: string; subject: string; body: string }) =>
      api.post<EmailTemplate>("/api/email-templates", input),
    onSuccess: () => {
      toast.success("Template saved");
      qc.invalidateQueries({ queryKey: ["email-templates"] });
    },
    onError: (err) => showError(err, "Failed to save template"),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<EmailTemplate> }) =>
      api.patch<EmailTemplate>(`/api/email-templates/${id}`, patch),
    onSuccess: () => {
      toast.success("Template updated");
      qc.invalidateQueries({ queryKey: ["email-templates"] });
    },
    onError: (err) => showError(err, "Failed to update template"),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/email-templates/${id}`),
    onSuccess: () => {
      toast.success("Template deleted");
      qc.invalidateQueries({ queryKey: ["email-templates"] });
    },
    onError: (err) => showError(err, "Failed to delete template"),
  });
}
