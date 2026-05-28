import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useCreateUser, useUsers } from "@/lib/queries";
import { ApiError } from "@/lib/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const labelCls = "block text-xs font-bold text-slate-700 mb-2";
const fieldCls =
  "w-full rounded-xl border border-slate-200/80 bg-slate-50/20 px-3.5 py-2.5 text-xs font-semibold text-slate-700 placeholder:text-slate-400 outline-none transition-all focus:border-[#e05638] focus:ring-2 focus:ring-[#e05638]/20 focus-visible:ring-[#e05638]/20 focus-visible:border-[#e05638] focus:bg-white";

export function AddAccountManagerDialog({ open, onOpenChange }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    title: "",
    active: true,
    teamRole: "",
    businessType: "",
    region: "",
    zones: "",
    startDate: "",
    reportsTo: "",
  });

  const [error, setError] = useState<string | null>(null);

  const createUser = useCreateUser();
  // Fetch users list to populate the "Reports To" dropdown dynamically
  const usersQuery = useUsers({ limit: 100 });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const canSubmit = form.name.trim().length > 0 && form.email.trim().length > 0 && !createUser.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      // Calculate initials from name
      const nameParts = form.name.trim().split(/\s+/);
      const initials = nameParts.map((n) => n[0]?.toUpperCase()).join("").slice(0, 3);

      await createUser.mutateAsync({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        initials,
        role: "manager", // Default role as Manager for Account Managers
        active: form.active,
        phone: form.phone.trim(),
        title: form.title.trim(),
        teamRole: form.teamRole,
        businessType: form.businessType,
        region: form.region.trim(),
        zones: form.zones.trim(),
        startDate: form.startDate,
        reportsTo: form.reportsTo,
      });

      // Clear form and close dialog
      setForm({
        name: "",
        email: "",
        phone: "",
        title: "",
        active: true,
        teamRole: "",
        businessType: "",
        region: "",
        zones: "",
        startDate: "",
        reportsTo: "",
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add account manager");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] w-[min(95vw,520px)] max-w-none overflow-y-auto rounded-3xl border border-slate-100 bg-white p-0 shadow-2xl transition-all duration-300">
        
        {/* Header */}
        <DialogHeader className="sticky top-0 z-10 bg-white px-7 pt-7 pb-4 flex flex-row items-center justify-between border-b border-slate-50">
          <DialogTitle className="text-lg font-bold text-slate-800 tracking-tight">
            Add Account Manager
          </DialogTitle>
          <DialogClose className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer">
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>

        <form onSubmit={onSubmit} className="px-7 py-5 space-y-4">
          
          {/* Full Name */}
          <div>
            <label className={labelCls}>Full Name</label>
            <input
              required
              placeholder="e.g. John Doe"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={`${fieldCls} border-[#e05638] focus:ring-[#e05638]/20 focus:border-[#e05638]`}
            />
          </div>

          {/* Email */}
          <div>
            <label className={labelCls}>Email</label>
            <input
              required
              type="email"
              placeholder="e.g. john@example.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={fieldCls}
            />
          </div>

          {/* Phone & Title */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Phone</label>
              <input
                type="tel"
                placeholder="e.g. 0400 000 000"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Title</label>
              <input
                placeholder="e.g. Account Executive"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className={fieldCls}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={form.active ? "Active" : "Inactive"}
              onChange={(e) => update("active", e.target.value === "Active")}
              className={fieldCls}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Section: Role & Territory */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-400 tracking-wide uppercase mb-3.5 mt-2">
              Role & Territory
            </h3>
            
            <div className="space-y-4">
              {/* Team Role & Business Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Team Role</label>
                  <select
                    value={form.teamRole}
                    onChange={(e) => update("teamRole", e.target.value)}
                    className={fieldCls}
                  >
                    <option value="">Select...</option>
                    <option value="Account Manager">Account Manager</option>
                    <option value="Senior Account Manager">Senior Account Manager</option>
                    <option value="BDM">Business Development Manager</option>
                    <option value="Admin">Admin / Support</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Business Type</label>
                  <select
                    value={form.businessType}
                    onChange={(e) => update("businessType", e.target.value)}
                    className={fieldCls}
                  >
                    <option value="">Select...</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="All">All Business</option>
                  </select>
                </div>
              </div>

              {/* Region & Zones */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Region</label>
                  <input
                    placeholder="e.g. North"
                    value={form.region}
                    onChange={(e) => update("region", e.target.value)}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Zones</label>
                  <input
                    placeholder="Comma separated"
                    value={form.zones}
                    onChange={(e) => update("zones", e.target.value)}
                    className={fieldCls}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Employment */}
          <div className="pt-2 border-t border-slate-50">
            <h3 className="text-xs font-bold text-slate-400 tracking-wide uppercase mb-3.5 mt-2">
              Employment
            </h3>
            
            {/* Start Date & Reports To */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update("startDate", e.target.value)}
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>Reports To</label>
                <select
                  value={form.reportsTo}
                  onChange={(e) => update("reportsTo", e.target.value)}
                  className={fieldCls}
                >
                  <option value="">Select...</option>
                  {usersQuery.data?.items
                    .filter((u) => u.role === "admin" || u.role === "manager")
                    .map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-xs font-semibold text-rose-600 animate-shake">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-5 border-t border-slate-50 flex items-center justify-end gap-3.5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-500 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-[#e05638] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#e05638]/90 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createUser.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create
            </button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
