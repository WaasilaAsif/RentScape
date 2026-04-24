"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Topbar } from "@/components/dashboard/Topbar";

// ── Types ─────────────────────────────────────────────────────────────────────
interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  unit_number: string;
  property_title: string;
  tenant_name: string;
  created_at: string;
}

type StatusFilter = "all" | "open" | "in_progress" | "resolved" | "closed";

// ── Config ────────────────────────────────────────────────────────────────────
const priorityConfig = {
  low:    { label: "Low",    classes: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  medium: { label: "Medium", classes: "bg-amber-100 text-amber-700 border-amber-200"       },
  high:   { label: "High",   classes: "bg-orange-100 text-orange-700 border-orange-200"    },
  urgent: { label: "Urgent", classes: "bg-rose-100 text-rose-700 border-rose-200"          },
};

const statusConfig = {
  open:        { label: "Open",        classes: "bg-blue-100 text-blue-700 border-blue-200"      },
  in_progress: { label: "In Progress", classes: "bg-purple-100 text-purple-700 border-purple-200" },
  resolved:    { label: "Resolved",    classes: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  closed:      { label: "Closed",      classes: "bg-slate-100 text-slate-600 border-slate-200"   },
};

const filterTabs: { value: StatusFilter; label: string }[] = [
  { value: "all",         label: "All"         },
  { value: "open",        label: "Open"        },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved",    label: "Resolved"    },
  { value: "closed",      label: "Closed"      },
];

const nextStatuses: Record<string, { value: string; label: string }[]> = {
  open:        [{ value: "in_progress", label: "Mark In Progress" }, { value: "closed", label: "Close" }],
  in_progress: [{ value: "resolved",    label: "Mark Resolved"    }, { value: "closed", label: "Close" }],
  resolved:    [{ value: "closed",      label: "Close"            }],
  closed:      [],
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-blue-100 bg-white/80 p-6 space-y-3">
          <div className="flex gap-3">
            <div className="h-5 w-48 animate-pulse rounded bg-blue-100" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-blue-50" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-blue-50" />
          </div>
          <div className="h-4 w-72 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-50" />
        </div>
      ))}
    </div>
  );
}

// ── Request Card ──────────────────────────────────────────────────────────────
function RequestCard({
  request,
  onStatusUpdate,
}: {
  request: MaintenanceRequest;
  onStatusUpdate: (id: string, status: string) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (status: string) => {
    setUpdating(true);
    setError(null);
    try {
      await onStatusUpdate(request.id, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setUpdating(false);
    }
  };

  const actions = nextStatuses[request.status] ?? [];
  const priority = priorityConfig[request.priority];
  const status = statusConfig[request.status];

  // Parse location from description if prepended as [Location]
  const locationMatch = request.description?.match(/^\[(.+?)\]/);
  const location = locationMatch?.[1];
  const cleanDescription = request.description?.replace(/^\[.+?\]\s*/, "");

  return (
    <div className="rounded-2xl border border-blue-100 bg-white/80 backdrop-blur-sm p-6 shadow-sm space-y-4 transition hover:shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800">{request.title}</h3>
          <p className="text-xs text-slate-500">
            {request.property_title} · Unit {request.unit_number} · {request.tenant_name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${priority.classes}`}>
            {priority.label}
          </span>
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.classes}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Location + Description */}
      {location && (
        <p className="text-xs font-medium text-blue-600">📍 {location}</p>
      )}
      <p className="text-sm text-slate-600 leading-relaxed">{cleanDescription}</p>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-xs text-slate-400">
          Submitted {new Date(request.created_at).toLocaleDateString("en-PK", {
            day: "numeric", month: "short", year: "numeric"
          })}
        </p>

        {actions.length > 0 && (
          <div className="flex gap-2">
            {actions.map((action) => (
              <button
                key={action.value}
                onClick={() => handleUpdate(action.value)}
                disabled={updating}
                className={`rounded-xl px-4 py-1.5 text-xs font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed ${
                  action.value === "closed"
                    ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {updating ? "Updating..." : action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LandlordMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch("/api/maintenance");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load requests");
        setRequests(data.maintenance_requests ?? []);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    const res = await fetch(`/api/maintenance/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to update status");

    // Update local state
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: status as MaintenanceRequest["status"] } : r))
    );
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  // Count per status for tab badges
  const counts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardShell role="landlord">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="Maintenance" subtitle="Review and resolve tenant maintenance requests" />

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => {
              const count = tab.value === "all" ? requests.length : (counts[tab.value] ?? 0);
              return (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    filter === tab.value
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white/70 text-slate-600 hover:bg-white border border-blue-100"
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                      filter === tab.value ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {loading ? (
            <Skeleton />
          ) : fetchError ? (
            <div className="rounded-2xl border border-rose-100 bg-white/80 p-8 text-center">
              <p className="text-sm text-rose-500">{fetchError}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-blue-100 bg-white/80 p-12 text-center space-y-2">
              <p className="text-lg font-bold text-slate-700">No requests found</p>
              <p className="text-sm text-slate-400">
                {filter === "all" ? "No maintenance requests have been submitted yet." : `No ${filter.replace("_", " ")} requests.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}