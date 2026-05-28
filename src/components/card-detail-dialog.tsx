import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AddAgencyDialog } from "@/components/add-agency-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Phone,
  MapPin,
  Building2,
  Users,
  Clock,
  Calendar,
  ArrowRight,
  FileText,
  MessageSquare,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: {
    name: string;
    sub: string;
    status: string;
    stage?: string;
    step?: number;
    totalSteps?: number;
    phone?: string;
    address?: string;
  } | null;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
}

type Tab = "overview" | "activity" | "discovery";

const activity = [
  {
    type: "stage",
    text: ["Contact Made", "New / Lapsed Client Identified"],
    user: "jeeldhola67",
    when: "18m ago",
  },
  {
    type: "stage",
    text: ["New / Lapsed Client Identified", "Contact Made"],
    user: "jeeldhola67",
    when: "18m ago",
  },
  {
    type: "stage",
    text: ["Contact Made", "New / Lapsed Client Identified"],
    user: "jeeldhola67",
    when: "18m ago",
  },
  {
    type: "stage",
    text: ["New / Lapsed Client Identified", "Contact Made"],
    user: "jeeldhola67",
    when: "18m ago",
  },
  {
    type: "note",
    title: "Deal created",
    user: "Dejan Josipovic",
    when: "2h ago",
  },
];

export function CardDetailDialog({ open, onOpenChange, card, canGoPrev, canGoNext, onPrev, onNext }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [noteType, setNoteType] = useState("Note");
  const [noteText, setNoteText] = useState("");

  if (!card) return null;

  const step = card.step ?? 1;
  const totalSteps = card.totalSteps ?? 10;
  const stage = card.stage ?? "New / Lapsed";
  const progress = (step / totalSteps) * 100;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto border-l border-border bg-card p-0 sm:max-w-[560px]"
        >
          <SheetHeader className="sticky top-0 z-10 space-y-0 bg-card px-7 pt-7 pb-4 text-left">
            <div className="flex items-center gap-3">
              <SheetTitle className="text-2xl font-bold text-foreground">
                {card.name}
              </SheetTitle>
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                {card.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {stage} · Step {step} of {totalSteps}
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-primary/15">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  disabled={!canGoPrev}
                  onClick={onPrev}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                <button
                  disabled={!canGoNext}
                  onClick={onNext}
                  className="inline-flex items-center gap-1 rounded-lg border border-primary bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-4 inline-flex w-fit rounded-xl bg-accent/60 p-1">
              {(["overview", "activity", "discovery"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                    tab === t
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </SheetHeader>

          <div className="px-7 pb-7 pt-2">
            {tab === "overview" && (
              <div className="space-y-4 text-sm">
                <Row icon={Phone} label="Phone" value={card.phone ?? "02 9580 8860"} />
                <Row
                  icon={MapPin}
                  label="Address"
                  value={card.address ?? "5/182 Forest Road, Hurstville"}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Row icon={Building2} label="Source" value="—" />
                  <Row icon={Users} label="AM" value="—" />
                  <Row icon={Clock} label="Last Contact" value="—" />
                  <Row icon={Calendar} label="Follow-Up" value="—" />
                  <Row icon={Calendar} label="Expected Close" value="—" />
                </div>
              </div>
            )}

            {tab === "activity" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">Activity Log</h3>
                  <button
                    onClick={() => setLogOpen((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Log Activity
                  </button>
                </div>

                {logOpen && (
                  <div className="space-y-4 rounded-xl border border-border bg-background p-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-foreground">
                        Type
                      </label>
                      <select
                        value={noteType}
                        onChange={(e) => setNoteType(e.target.value)}
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                      >
                        <option>Note</option>
                        <option>Call</option>
                        <option>Email</option>
                        <option>Meeting</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-foreground">
                        {noteType}
                      </label>
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows={3}
                        placeholder="Describe the activity..."
                        className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setLogOpen(false);
                          setNoteText("");
                        }}
                        className="text-sm font-semibold text-foreground hover:underline"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={!noteText.trim()}
                        onClick={() => {
                          setLogOpen(false);
                          setNoteText("");
                        }}
                        className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {activity.map((a, i) => (
                    <div key={i} className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/60 text-muted-foreground">
                          {a.type === "stage" ? (
                            <ArrowRight className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </div>
                        <div className="text-sm">
                          {a.type === "stage" ? (
                            <p className="text-foreground">
                              Moved from{" "}
                              <span className="font-semibold">{a.text![0]}</span> →{" "}
                              <span className="font-semibold">{a.text![1]}</span>
                            </p>
                          ) : (
                            <p className="font-medium text-muted-foreground">{a.title}</p>
                          )}
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {a.user} · {a.when}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
                        {a.type === "stage" ? "Stage Change" : "Note"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "discovery" && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Row icon={Building2} label="Est. Properties" value="—" />
                <Row icon={Users} label="Supplier" value="—" />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AddAgencyDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Agency Office"
        submitLabel="Save Changes"
      />
    </>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}