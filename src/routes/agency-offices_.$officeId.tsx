import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ChevronLeft, Pencil, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { useDeleteOffice, useOffice } from "@/lib/queries";
import { accountManagerName, type Office } from "@/lib/api-types";

export const Route = createFileRoute("/agency-offices_/$officeId")({
  component: AgencyOfficeDetailPage,
  head: ({ params }) => ({
    meta: [
      { title: `Agency Office — ${params.officeId}` },
      { name: "description", content: "Agency office profile details, contacts and metrics." },
    ],
  }),
});

const TABS = ["Overview", "Property Managers", "Meetings", "Notes"] as const;
type Tab = (typeof TABS)[number];

function AgencyOfficeDetailPage() {
  const { officeId } = Route.useParams();
  const [tab, setTab] = useState<Tab>("Overview");
  const navigate = useNavigate();
  const { data: office, isLoading, isError, error } = useOffice(officeId);
  const deleteOffice = useDeleteOffice();

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !office) {
    return (
      <div className="p-8">
        <Link
          to="/agency-offices"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Locations
        </Link>
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-[oklch(0.55_0.2_25)]">
          {(error as Error)?.message ?? "Office not found"}
        </div>
      </div>
    );
  }

  async function onDelete() {
    if (!confirm(`Delete ${office?.name}? This cannot be undone.`)) return;
    try {
      await deleteOffice.mutateAsync(officeId);
      navigate({ to: "/agency-offices" });
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <div className="min-h-full bg-background p-8">
      <Link
        to="/agency-offices"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Locations
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">{office.name}</h1>
        <span className="rounded-md bg-muted px-2.5 py-1 text-sm font-mono text-muted-foreground">
          {office.id.slice(-6)}
        </span>
        <span
          className="h-3 w-3 rounded-full"
          style={{
            backgroundColor:
              office.status === "Active"
                ? "oklch(0.65 0.18 150)"
                : office.status === "Lapsing"
                  ? "oklch(0.7 0.18 60)"
                  : "oklch(0.65 0.22 25)",
          }}
        />
      </div>

      <div className="mb-6 inline-flex items-center gap-1 rounded-xl bg-[oklch(0.97_0.02_55)] p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab office={office} />}
      {tab !== "Overview" && (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
          {tab} content coming soon.
        </div>
      )}

      <button
        onClick={onDelete}
        disabled={deleteOffice.isPending}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[oklch(0.55_0.2_25)] hover:underline disabled:opacity-60"
      >
        {deleteOffice.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Delete Location
      </button>
    </div>
  );
}

function OverviewTab({ office: o }: { office: Office }) {
  return (
    <div className="space-y-6">
      <Section title="Business Details">
        <Field label="ID" value={o.id.slice(-6)} />
        <Field label="Trading Name" value={o.tradingName ?? null} />
        <Field label="Legal Entity Name" value={o.legalEntityName ?? null} />
        <Field label="ABN" value={o.abn ?? null} />
        <Field label="Office Address" value={o.address ?? null} />
        <Field label="Office Phone" value={o.phone ?? null} />
        <Field label="General Office Email" value={o.email ?? null} />
        <Field
          label="Website"
          value={
            o.website ? (
              <a href={o.website} className="text-[oklch(0.55_0.18_42)] hover:underline">
                {o.website}
              </a>
            ) : null
          }
        />
        <Field label="Zone" value={o.zone ?? null} />
        <Field label="Account Manager" value={accountManagerName(o.accountManager) ?? null} />
        <Field
          label="Inactivity Alert"
          value={
            o.inactivityAlert && o.inactivityAlert !== "none" ? (
              <span className="inline-flex rounded-md bg-[oklch(0.95_0.02_250)] px-2.5 py-1 text-sm font-medium text-foreground">
                {o.inactivityAlert === "ai" ? "AI Alert" : `${o.inactivityAlert} days`}
              </span>
            ) : null
          }
        />
        <Field
          label="Last Contacted"
          value={o.lastContactedAt ? new Date(o.lastContactedAt).toLocaleDateString() : null}
        />
      </Section>

      <Section title="Key Contacts & Metrics">
        <Field label="Number of Property Managers" value={null} />
        <Field label="Total Properties Under Management" value={o.pum ?? null} />
        <Field
          label="Estimated Monthly Spend"
          value={o.estimatedMonthlySpend != null ? `$${o.estimatedMonthlySpend}` : null}
        />
        <Field label="Platform & System" value={o.platform ?? null} />
        <Field
          label="Pipeline Stage"
          value={
            o.pipelineStage ? (
              <a className="inline-flex items-center gap-1 text-[oklch(0.55_0.18_42)] hover:underline">
                {o.pipelineStage} <ExternalLink className="h-3 w-3" />
              </a>
            ) : null
          }
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-start justify-between">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
          <Pencil className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode | null }) {
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-base text-foreground">
        {value === null || value === undefined ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
