import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Mail,
  Search,
  Inbox,
  Send,
  CheckCheck,
  Loader2,
  Building2,
} from "lucide-react";
import {
  useMailboxSummary,
  useMessages,
  useUpdateMessage,
} from "@/lib/queries";
import type { Message, MessageDirection } from "@/lib/api-types";

export const Route = createFileRoute("/mailbox")({
  component: MailboxPage,
  head: () => ({
    meta: [
      { title: "Mailbox — The Appliance Guys" },
      { name: "description", content: "All inbound and outbound mail tied to your offices." },
    ],
  }),
});

const folders: {
  label: string;
  direction?: MessageDirection;
  read?: boolean;
  icon: typeof Inbox;
}[] = [
  { label: "All", icon: Mail },
  { label: "Inbox", direction: "inbound", icon: Inbox },
  { label: "Unread", read: false, icon: CheckCheck },
  { label: "Sent", direction: "outbound", icon: Send },
];

function MailboxPage() {
  const [folderIdx, setFolderIdx] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const folder = folders[folderIdx]!;
  const messages = useMessages({
    direction: folder.direction,
    read: folder.read,
    search: search.trim() || undefined,
    limit: 200,
  });
  const summary = useMailboxSummary();
  const updateMessage = useUpdateMessage();

  const items = messages.data?.items ?? [];
  const selected = items.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Mailbox</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {summary.data?.total ?? 0} message{summary.data?.total === 1 ? "" : "s"} ·{" "}
              {summary.data?.unread ?? 0} unread
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {folders.map((f, i) => {
              const active = i === folderIdx;
              return (
                <button
                  key={f.label}
                  onClick={() => {
                    setFolderIdx(i);
                    setSelectedId(null);
                  }}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
                  }`}
                >
                  <f.icon className="h-4 w-4" />
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[minmax(260px,360px)_1fr]">
        <aside className="border-r bg-card">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="overflow-y-auto">
            {messages.isLoading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!messages.isLoading && items.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nothing here.
              </div>
            )}
            {items.map((m) => (
              <MessageListItem
                key={m.id}
                message={m}
                active={selectedId === m.id}
                onClick={() => {
                  setSelectedId(m.id);
                  if (!m.read) updateMessage.mutate({ id: m.id, patch: { read: true } });
                }}
              />
            ))}
          </div>
        </aside>

        <main className="bg-background p-6">
          {!selected ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <Mail className="h-12 w-12 opacity-50" />
              <p>Select a message to read.</p>
            </div>
          ) : (
            <MessageDetail message={selected} />
          )}
        </main>
      </div>
    </div>
  );
}

function MessageListItem({
  message: m,
  active,
  onClick,
}: {
  message: Message;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full flex-col items-start gap-1 border-b px-4 py-3 text-left transition-colors hover:bg-accent/40 ${
        active ? "bg-accent/60" : ""
      } ${!m.read ? "bg-[oklch(0.99_0.01_240)]" : ""}`}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span className={`truncate text-sm ${!m.read ? "font-bold text-foreground" : "font-semibold text-muted-foreground"}`}>
          {m.from}
        </span>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {new Date(m.receivedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>
      <span className={`w-full truncate text-sm ${!m.read ? "font-semibold text-foreground" : "text-foreground"}`}>
        {m.subject}
      </span>
      <span className="line-clamp-1 text-xs text-muted-foreground">{m.snippet ?? ""}</span>
    </button>
  );
}

function MessageDetail({ message: m }: { message: Message }) {
  const officeName = typeof m.office === "string" ? undefined : m.office?.name;
  return (
    <div className="space-y-4">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-foreground">{m.subject}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{m.from}</span>
            {" → "}
            {(m.to ?? []).join(", ") || "—"}
          </span>
          <span>
            {new Date(m.receivedAt).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
          {officeName && (
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {officeName}
            </span>
          )}
          <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
            {m.direction}
          </span>
        </div>
      </div>
      <div className="whitespace-pre-wrap text-sm text-foreground">
        {m.body || <span className="text-muted-foreground">No body.</span>}
      </div>
    </div>
  );
}
