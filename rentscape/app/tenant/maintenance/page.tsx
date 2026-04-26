"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Topbar } from "@/components/dashboard/Topbar";

// ── Schema ────────────────────────────────────────────────────────────────────
const maintenanceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Please describe the issue in more detail"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  location: z.string().min(2, "Please specify the location"),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

// ── Types ─────────────────────────────────────────────────────────────────────
interface ActiveLease {
  unit_id: string;
  unit_number: string;
  property_title: string;
}

// ── Priority config ───────────────────────────────────────────────────────────
const priorities = [
  { value: "low",    label: "Low",    desc: "Minor issue, no urgency",         color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", selected: "bg-emerald-100 border-emerald-500 ring-2 ring-emerald-200" },
  { value: "medium", label: "Medium", desc: "Needs attention soon",             color: "text-amber-600",   bg: "bg-amber-50 border-amber-200",     selected: "bg-amber-100 border-amber-500 ring-2 ring-amber-200"     },
  { value: "high",   label: "High",   desc: "Affecting daily activities",       color: "text-orange-600",  bg: "bg-orange-50 border-orange-200",   selected: "bg-orange-100 border-orange-500 ring-2 ring-orange-200"  },
  { value: "urgent", label: "Urgent", desc: "Immediate danger or major damage", color: "text-rose-600",    bg: "bg-rose-50 border-rose-200",       selected: "bg-rose-100 border-rose-500 ring-2 ring-rose-200"        },
] as const;

// ── Photo Upload ──────────────────────────────────────────────────────────────
function PhotoUpload({ photos, setPhotos }: { photos: File[]; setPhotos: (f: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setPhotos([...photos, ...newFiles].slice(0, 5));
  }, [photos, setPhotos]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
          dragging ? "border-blue-500 bg-blue-50 scale-[1.01]" : "border-blue-200 bg-blue-50/40 hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-blue-100 p-3">
            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-sm font-medium text-blue-700">{dragging ? "Drop photos here" : "Drag & drop photos, or click to browse"}</p>
          <p className="text-xs text-blue-500">Up to 5 images • JPG, PNG, WEBP</p>
        </div>
      </div>
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {photos.map((file, i) => (
            <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-blue-200 shadow-sm">
              <img src={URL.createObjectURL(file)} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <button type="button" onClick={() => removePhoto(i)} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Success State ─────────────────────────────────────────────────────────────
function SuccessMessage({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-white/80 p-12 text-center shadow-sm space-y-4">
      <div className="rounded-full bg-emerald-100 p-4">
        <svg className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-slate-800">Request Submitted!</h3>
      <p className="text-sm text-slate-500 max-w-sm">Your maintenance request has been received. Your landlord will review it shortly.</p>
      <button onClick={onReset} className="mt-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
        Submit Another Request
      </button>
    </div>
  );
}

// ── No Lease State ────────────────────────────────────────────────────────────
function NoLeaseMessage() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-100 bg-white/80 p-12 text-center shadow-sm space-y-4">
      <div className="rounded-full bg-amber-100 p-4">
        <svg className="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-slate-800">No Active Lease</h3>
      <p className="text-sm text-slate-500 max-w-sm">You don&apos;t have an active lease. Maintenance requests can only be submitted for units you're currently renting.</p>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function FormSkeleton() {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white/80 p-8 shadow-sm space-y-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-blue-100" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-blue-50" />
        </div>
      ))}
      <div className="h-10 w-40 animate-pulse rounded-xl bg-blue-200" />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TenantMaintenancePage() {
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lease, setLease] = useState<ActiveLease | null>(null);
  const [leaseLoading, setLeaseLoading] = useState(true);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
  });

  const selectedPriority = watch("priority");

  // Fetch tenant's active lease to get unit_id
  useEffect(() => {
    async function fetchLease() {
      try {
        const res = await fetch("/api/leases?status=active");
        const data = await res.json();
        const activeLease = data.leases?.[0] ?? null;
        setLease(activeLease ? {
          unit_id: activeLease.unit_id,
          unit_number: activeLease.unit_number,
          property_title: activeLease.property_title,
        } : null);
      } catch {
        setLease(null);
      } finally {
        setLeaseLoading(false);
      }
    }
    fetchLease();
  }, []);

  const onSubmit = async (data: MaintenanceFormData) => {
    if (!lease) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Create the maintenance request
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_id: lease.unit_id,
          title: data.title,
          description: `[${data.location}] ${data.description}`,
          priority: data.priority,
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Failed to submit request.");

      const requestId = payload.maintenance_request.id;

      // 2. Upload images if any
      if (photos.length > 0) {
        await Promise.all(
          photos.map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("request_id", requestId);

            const uploadRes = await fetch("/api/maintenance/images", {
              method: "POST",
              body: formData,
            });

            if (!uploadRes.ok) {
              const uploadPayload = await uploadRes.json();
              console.error("Image upload failed:", uploadPayload.error);
              // Don't throw — request was created, images are optional
            }
          })
        );
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubmitError(null);
    setPhotos([]);
    reset();
  };

  return (
    <DashboardShell role="tenant">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="Maintenance" subtitle="Submit and track maintenance requests" />

          {leaseLoading ? (
            <FormSkeleton />
          ) : submitted ? (
            <SuccessMessage onReset={handleReset} />
          ) : !lease ? (
            <NoLeaseMessage />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-blue-100 bg-white/80 backdrop-blur-sm p-8 shadow-sm space-y-7">
              <div>
                <h2 className="text-lg font-bold text-blue-900">New Maintenance Request</h2>
                <p className="text-sm text-blue-600/70 mt-0.5">
                  Submitting for{" "}
                  <span className="font-semibold text-blue-700">
                    Unit {lease.unit_number} — {lease.property_title}
                  </span>
                </p>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Issue Title <span className="text-rose-500">*</span></label>
                <input
                  {...register("title")}
                  placeholder="e.g. Leaking kitchen tap"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-blue-300 ${
                    errors.title ? "border-rose-300 bg-rose-50" : "border-blue-200 bg-blue-50/40 focus:border-blue-400"
                  }`}
                />
                {errors.title && <p className="text-xs text-rose-500">{errors.title.message}</p>}
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Location <span className="text-rose-500">*</span></label>
                <input
                  {...register("location")}
                  placeholder="e.g. Kitchen, Master Bathroom, Balcony"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-blue-300 ${
                    errors.location ? "border-rose-300 bg-rose-50" : "border-blue-200 bg-blue-50/40 focus:border-blue-400"
                  }`}
                />
                {errors.location && <p className="text-xs text-rose-500">{errors.location.message}</p>}
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Priority Level <span className="text-rose-500">*</span></label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {priorities.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setValue("priority", p.value, { shouldValidate: true })}
                      className={`rounded-xl border px-3 py-3 text-left transition-all duration-150 ${selectedPriority === p.value ? p.selected : p.bg}`}
                    >
                      <p className={`text-sm font-bold ${p.color}`}>{p.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-tight">{p.desc}</p>
                    </button>
                  ))}
                </div>
                {errors.priority && <p className="text-xs text-rose-500">{errors.priority.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Description <span className="text-rose-500">*</span></label>
                <textarea
                  {...register("description")}
                  rows={4}
                  placeholder="Describe the issue in detail — when it started, how bad it is, anything relevant..."
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-blue-300 resize-none ${
                    errors.description ? "border-rose-300 bg-rose-50" : "border-blue-200 bg-blue-50/40 focus:border-blue-400"
                  }`}
                />
                {errors.description && <p className="text-xs text-rose-500">{errors.description.message}</p>}
              </div>

              {/* Photos */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  Photos <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <PhotoUpload photos={photos} setPhotos={setPhotos} />
              </div>

              {/* Error */}
              {submitError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {submitError}
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Submitting...
                    </>
                  ) : "Submit Request"}
                </button>
                <p className="text-xs text-slate-400">Your landlord will be notified immediately.</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}