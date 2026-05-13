"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser, signOut } from "@/lib/auth";
import { isAdminUser } from "@/lib/user-role";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  LayoutDashboard,
  LogOut,
  RefreshCw,
} from "lucide-react";

interface DeveloperRequest {
  id: string;
  user_id: string;
  email: string;
  developer_name: string;
  website?: string;
  about: string;
  country: string;
  phone?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

type Tab = "requests" | "overview";

function StatusBadge({ status }: { status: DeveloperRequest["status"] }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle className="w-3.5 h-3.5" />
        Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <XCircle className="w-3.5 h-3.5" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
      <Clock className="w-3.5 h-3.5" />
      Pending
    </span>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("requests");
  const [requests, setRequests] = useState<DeveloperRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const res = await fetch("/api/admin/developer-requests");
      const json = await res.json();
      if (res.ok) {
        setRequests(json.requests ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAccess = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace("/login");
        return;
      }
      if (!isAdminUser(currentUser)) {
        router.replace("/user-dashboard");
        return;
      }
      setUser(currentUser);
      setIsLoading(false);
      void fetchRequests();
    };

    void checkAccess();
  }, [router, fetchRequests]);

  const handleReview = async (requestId: string, action: "approve" | "reject") => {
    setActionLoading(requestId + action);
    try {
      const res = await fetch("/api/admin/developer-requests/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          action,
          admin_email: user?.email,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        showToast(
          action === "approve"
            ? "Developer approved and email sent."
            : "Developer request rejected.",
          "success"
        );
        void fetchRequests();
      } else {
        showToast(json.error ?? "Action failed.", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 transition-all ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {(
              [
                { id: "requests", label: "Developer Requests", icon: Users },
                { id: "overview", label: "Overview", icon: LayoutDashboard },
              ] as { id: Tab; label: string; icon: React.ElementType }[]
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {id === "requests" && pendingCount > 0 && (
                  <span className="ml-1 bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{pendingCount}</p>
              <p className="text-sm text-gray-600">Pending Requests</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{approvedCount}</p>
              <p className="text-sm text-gray-600">Approved Developers</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{rejectedCount}</p>
              <p className="text-sm text-gray-600">Rejected Requests</p>
            </div>
          </div>
        )}

        {/* ── DEVELOPER REQUESTS TAB ── */}
        {activeTab === "requests" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Developer Requests</h2>
              <button
                onClick={fetchRequests}
                disabled={requestsLoading}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50 border border-gray-200"
              >
                <RefreshCw className={`w-4 h-4 ${requestsLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {requestsLoading ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests yet</h3>
                <p className="text-gray-500 text-sm">Developer applications will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {req.developer_name}
                          </h3>
                          <StatusBadge status={req.status} />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600 mb-3">
                          <span>
                            <span className="font-medium text-gray-700">Email:</span> {req.email}
                          </span>
                          <span>
                            <span className="font-medium text-gray-700">Country:</span> {req.country}
                          </span>
                          {req.website && (
                            <span>
                              <span className="font-medium text-gray-700">Website:</span>{" "}
                              <a
                                href={req.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {req.website}
                              </a>
                            </span>
                          )}
                          {req.phone && (
                            <span>
                              <span className="font-medium text-gray-700">Phone:</span> {req.phone}
                            </span>
                          )}
                          <span>
                            <span className="font-medium text-gray-700">Submitted:</span>{" "}
                            {new Date(req.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 line-clamp-2">
                          {req.about}
                        </p>
                      </div>

                      {req.status === "pending" && (
                        <div className="flex gap-2 sm:flex-col sm:items-end flex-shrink-0">
                          <button
                            onClick={() => handleReview(req.id, "approve")}
                            disabled={actionLoading !== null}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {actionLoading === req.id + "approve" ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReview(req.id, "reject")}
                            disabled={actionLoading !== null}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {actionLoading === req.id + "reject" ? (
                              <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
