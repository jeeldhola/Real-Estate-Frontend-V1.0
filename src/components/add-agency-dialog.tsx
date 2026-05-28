import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMoveStage, useOffices } from "@/lib/queries";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/api-types";
import { ApiError } from "@/lib/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  submitLabel?: string;
}

const labelCls = "block text-sm font-semibold text-foreground mb-2";
const fieldCls =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20";

export function AddAgencyDialog({
  open,
  onOpenChange,
  title = "Add Agency Office",
  submitLabel = "Add to Pipeline",
}: Props) {
  const [form, setForm] = useState({
    agencyOffice: "",
    category: "New Client",
    stage: "New / Lapsed" as PipelineStage,
    status: "Active",
    source: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
    amName: "",
    amEmail: "",
    nextFollowUp: "",
    expectedClose: "",
    notes: "",
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const officesQuery = useOffices({ limit: 200 });
  const moveStage = useMoveStage();
  const [error, setError] = useState<string | null>(null);

  const canSubmit = form.agencyOffice.trim().length > 0 && !moveStage.isPending;

  async function onSubmit() {
    setError(null);
    try {
      await moveStage.mutateAsync({
        id: form.agencyOffice,
        pipelineStage: form.stage,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update pipeline");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(95vw,720px)] max-w-none overflow-y-auto rounded-2xl border-0 bg-card p-0">
        <DialogHeader className="sticky top-0 z-10 bg-card px-7 pt-7 pb-4">
          <DialogTitle className="text-2xl font-bold text-foreground">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-7 pb-2">
          <div>
            <label className={labelCls} htmlFor="agency-office-select">
              Agency Office <span className="text-primary">*</span>
            </label>
            <select
              id="agency-office-select"
              name="agencyOffice"
              value={form.agencyOffice}
              onChange={(e) => update("agencyOffice", e.target.value)}
              className={`${fieldCls} ring-2 ring-primary/30`}
            >
              <option value="">
                {officesQuery.isLoading ? "Loading offices…" : "Select an agency office..."}
              </option>
              {officesQuery.data?.items.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="agency-category-select">
              Client Category <span className="text-primary">*</span>
            </label>
            <select
              id="agency-category-select"
              name="category"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className={fieldCls}
            >
              <option>New Client</option>
              <option>Lapsing</option>
              <option>Inactive</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="agency-stage-select">Stage</label>
              <select
                id="agency-stage-select"
                name="stage"
                value={form.stage}
                onChange={(e) => update("stage", e.target.value as PipelineStage)}
                className={fieldCls}
              >
                {PIPELINE_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="agency-status-select">Status</label>
              <select
                id="agency-status-select"
                name="status"
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                className={fieldCls}
              >
                <option>Active</option>
                <option>Stalled</option>
                <option>Lost</option>
                <option>Won</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="agency-source-select">Source Type</label>
            <select
              id="agency-source-select"
              name="source"
              value={form.source}
              onChange={(e) => update("source", e.target.value)}
              className={fieldCls}
            >
              <option value="">Select source</option>
              <option value="referral">Referral</option>
              <option value="cold-outreach">Cold Outreach</option>
              <option value="inbound">Inbound</option>
              <option value="event">Event</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="agency-contact-name-input">Contact Name</label>
              <input
                id="agency-contact-name-input"
                name="contactName"
                value={form.contactName}
                onChange={(e) => update("contactName", e.target.value)}
                maxLength={100}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="agency-contact-email-input">Contact Email</label>
              <input
                id="agency-contact-email-input"
                name="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
                maxLength={255}
                className={fieldCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="agency-contact-phone-input">Contact Phone</label>
            <input
              id="agency-contact-phone-input"
              name="contactPhone"
              type="tel"
              value={form.contactPhone}
              onChange={(e) => update("contactPhone", e.target.value)}
              maxLength={32}
              className={fieldCls}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="agency-address-input">Address</label>
              <input
                id="agency-address-input"
                name="address"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                maxLength={200}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="agency-city-input">City</label>
              <input
                id="agency-city-input"
                name="city"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                maxLength={100}
                className={fieldCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="agency-am-name-input">Assigned AM Name</label>
              <input
                id="agency-am-name-input"
                name="amName"
                value={form.amName}
                onChange={(e) => update("amName", e.target.value)}
                maxLength={100}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="agency-am-email-input">Assigned AM Email</label>
              <input
                id="agency-am-email-input"
                name="amEmail"
                type="email"
                value={form.amEmail}
                onChange={(e) => update("amEmail", e.target.value)}
                maxLength={255}
                className={fieldCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="agency-next-followup-input">Next Follow-Up</label>
              <input
                id="agency-next-followup-input"
                name="nextFollowUp"
                type="date"
                value={form.nextFollowUp}
                onChange={(e) => update("nextFollowUp", e.target.value)}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="agency-expected-close-input">Expected Close</label>
              <input
                id="agency-expected-close-input"
                name="expectedClose"
                type="date"
                value={form.expectedClose}
                onChange={(e) => update("expectedClose", e.target.value)}
                className={fieldCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="agency-notes-input">Notes</label>
            <textarea
              id="agency-notes-input"
              name="notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              maxLength={2000}
              rows={3}
              className={`${fieldCls} resize-none`}
            />
          </div>
        </div>

        {error && (
          <div className="mx-7 mb-3 rounded-lg border border-[oklch(0.85_0.1_25)] bg-[oklch(0.97_0.04_25)] px-3 py-2 text-sm text-[oklch(0.45_0.18_25)]">
            {error}
          </div>
        )}
        <div className="sticky bottom-0 z-10 mt-2 flex items-center justify-end gap-3 border-t border-border bg-card px-7 py-5">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Cancel
          </button>
          <button
            disabled={!canSubmit}
            onClick={onSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {moveStage.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}