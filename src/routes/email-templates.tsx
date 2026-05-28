import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
  FileText,
  Plus,
  Search,
  Tag,
  Loader2,
  Pencil,
  Copy as CopyIcon,
  Trash2,
} from "lucide-react";
import {
  useCreateTemplate,
  useDeleteTemplate,
  useTemplates,
  useUpdateTemplate,
} from "@/lib/queries";
import {
  TEMPLATE_CATEGORIES,
  type EmailTemplate,
  type TemplateCategory,
} from "@/lib/api-types";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/email-templates")({
  component: EmailTemplatesPage,
  head: () => ({
    meta: [
      { title: "Email Templates — The Appliance Guys" },
      { name: "description", content: "Reusable copy for outreach, follow-ups and onboarding." },
    ],
  }),
});

function EmailTemplatesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | TemplateCategory>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);

  const templates = useTemplates({
    search: search.trim() || undefined,
    category: category === "all" ? undefined : category,
    limit: 200,
  });
  const deleteTemplate = useDeleteTemplate();

  const items = templates.data?.items ?? [];

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Email Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reusable copy with <code className="rounded bg-muted px-1.5 py-0.5">{`{{variables}}`}</code> for outreach and follow-ups.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Template
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-card py-2.5 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
          <SelectTrigger className="min-w-[200px] py-2.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {TEMPLATE_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {templates.isLoading && (
        <div className="mt-10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {!templates.isLoading && items.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed bg-card p-10 text-center text-muted-foreground">
          No templates yet. Create your first one above.
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((t) => (
          <div key={t.id} className="group flex flex-col rounded-2xl border bg-card p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-base font-bold text-foreground">{t.name}</h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                <Tag className="h-3 w-3" />
                {t.category}
              </span>
            </div>
            <p className="mt-2 truncate text-sm font-medium text-foreground">{t.subject}</p>
            <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">
              {t.body}
            </p>
            {t.variables.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.variables.map((v) => (
                  <span
                    key={v}
                    className="rounded-md bg-[oklch(0.95_0.05_240)] px-1.5 py-0.5 font-mono text-[10px] text-[oklch(0.4_0.15_240)]"
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => {
                  setEditing(t);
                  setOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Subject: ${t.subject}\n\n${t.body}`).then(
                    () => toast.success("Template copied"),
                    () => toast.error("Clipboard unavailable"),
                  );
                }}
                className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
              >
                <CopyIcon className="h-3.5 w-3.5" />
                Copy
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete template "${t.name}"?`)) deleteTemplate.mutate(t.id);
                }}
                className="ml-auto inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium text-[oklch(0.55_0.2_25)] hover:bg-[oklch(0.97_0.04_25)]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <TemplateDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditing(null);
        }}
        template={editing}
      />
    </div>
  );
}

function TemplateDialog({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: EmailTemplate | null;
}) {
  const create = useCreateTemplate();
  const update = useUpdateTemplate();
  const [form, setForm] = useState({
    name: "",
    category: "Outreach" as TemplateCategory,
    subject: "",
    body: "",
  });
  const [error, setError] = useState<string | null>(null);

  // Reset on open when template changes
  const formKey = template?.id ?? "new";
  // Initialize when dialog opens
  useStateOnOpen(open, () => {
    setForm(
      template
        ? {
            name: template.name,
            category: template.category,
            subject: template.subject,
            body: template.body,
          }
        : { name: "", category: "Outreach", subject: "", body: "" },
    );
    setError(null);
  }, [formKey]);

  async function onSave() {
    setError(null);
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      setError("Name, subject and body are required");
      return;
    }
    try {
      if (template) {
        await update.mutateAsync({ id: template.id, patch: form });
      } else {
        await create.mutateAsync(form);
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    }
  }

  const busy = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {template ? "Edit Template" : "New Template"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v as TemplateCategory }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Hi {{firstName}}, …"
            />
          </div>

          <div className="space-y-2">
            <Label>Body</Label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={8}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Use {{variable}} placeholders — they're extracted automatically."
            />
          </div>

          {error && (
            <div className="rounded-lg border border-[oklch(0.85_0.1_25)] bg-[oklch(0.97_0.04_25)] px-3 py-2 text-sm text-[oklch(0.45_0.18_25)]">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {template ? "Save changes" : "Create template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Re-runs the effect each time `open` flips true OR any of `deps` change.
import { useEffect } from "react";
function useStateOnOpen(open: boolean, run: () => void, deps: unknown[]) {
  useEffect(() => {
    if (open) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ...deps]);
}
