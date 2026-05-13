"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser, signOut } from "@/lib/auth";
import UserSidebar from "@/components/user-sidebar";
import {
  Code,
  Upload,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle,
  ArrowRight,
  Rocket,
  Shield,
  Zap,
  Clock,
  XCircle,
  RefreshCw,
} from "lucide-react";

type DevStatus = "pending" | "approved" | "rejected" | null;

interface DevData {
  status: DevStatus;
  developer_name?: string;
  created_at?: string;
}

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria",
  "Bangladesh", "Belgium", "Brazil", "Canada", "Chile", "China", "Colombia",
  "Czech Republic", "Denmark", "Egypt", "Ethiopia", "Finland", "France",
  "Germany", "Ghana", "Greece", "Hungary", "India", "Indonesia", "Iran",
  "Iraq", "Ireland", "Israel", "Italy", "Japan", "Jordan", "Kenya",
  "Malaysia", "Mexico", "Morocco", "Netherlands", "New Zealand", "Nigeria",
  "Norway", "Pakistan", "Peru", "Philippines", "Poland", "Portugal",
  "Romania", "Russia", "Saudi Arabia", "Singapore", "South Africa",
  "South Korea", "Spain", "Sri Lanka", "Sweden", "Switzerland", "Taiwan",
  "Tanzania", "Thailand", "Turkey", "Uganda", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Vietnam", "Other",
];

export default function DeveloperPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [devStatus, setDevStatus] = useState<DevStatus>(null);
  const [devData, setDevData] = useState<DevData | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);

  // Form state
  const [developerName, setDeveloperName] = useState("");
  const [website, setWebsite] = useState("");
  const [about, setAbout] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const init = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace("/login");
        return;
      }
      setUser(currentUser);

      // Check developer status from API
      try {
        const res = await fetch(`/api/developer/status?user_id=${currentUser.id}`);
        const json = await res.json();
        setDevStatus(json.status ?? null);
        setDevData(json.data ?? null);
      } catch {
        setDevStatus(null);
      }

      setIsLoading(false);
    };

    void init();
  }, [router]);

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      setSubmitError("Please accept the terms and conditions.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/developer/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user!.id,
          email: user!.email,
          developer_name: developerName,
          website,
          about,
          country,
          phone,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error ?? "Failed to submit application.");
      } else {
        setDevStatus("pending");
        setDevData({ status: "pending", developer_name: developerName, created_at: new Date().toISOString() });
        setShowRegistration(false);
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReapply = () => {
    setDevStatus(null);
    setDevData(null);
    setShowRegistration(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── PENDING STATE ──────────────────────────────────────────────────────────
  if (devStatus === "pending") {
    const submittedDate = devData?.created_at
      ? new Date(devData.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;

    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <UserSidebar onLogout={handleLogout} userEmail={user?.email} />
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white border-b border-gray-200 px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Developer Portal</h1>
            <p className="text-sm text-gray-600 mt-1">Application status</p>
          </div>
          <div className="p-8 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Under Review</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Your developer account application has been submitted and is currently being reviewed by our team. We&apos;ll notify you by email once a decision has been made.
              </p>
              {submittedDate && (
                <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-2 rounded-full mb-6">
                  <Clock className="w-4 h-4" />
                  Submitted on {submittedDate}
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-6 text-left space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">What happens next?</h3>
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Our team reviews your application (usually within 1–3 business days)</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>You&apos;ll receive an email notification with the decision</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Once approved, you can start uploading apps immediately</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── REJECTED STATE ─────────────────────────────────────────────────────────
  if (devStatus === "rejected") {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <UserSidebar onLogout={handleLogout} userEmail={user?.email} />
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white border-b border-gray-200 px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Developer Portal</h1>
            <p className="text-sm text-gray-600 mt-1">Application status</p>
          </div>
          <div className="p-8 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Not Approved</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Unfortunately, your developer application was not approved at this time. You&apos;re welcome to update your information and reapply.
              </p>
              <button
                onClick={handleReapply}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Reapply Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── APPROVED STATE ─────────────────────────────────────────────────────────
  if (devStatus === "approved") {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <UserSidebar onLogout={handleLogout} userEmail={user?.email} />
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white border-b border-gray-200">
            <div className="px-8 py-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Developer Dashboard</h1>
                <p className="text-sm text-gray-600 mt-1">Manage your apps and analytics</p>
              </div>
              <Link
                href="/developer/upload"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload App
              </Link>
            </div>
          </div>

          <div className="p-8">
            {/* Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { icon: Code, bg: "bg-blue-100", color: "text-blue-600", value: "0", label: "Published Apps" },
                { icon: Users, bg: "bg-green-100", color: "text-green-600", value: "0", label: "Total Users" },
                { icon: DollarSign, bg: "bg-purple-100", color: "text-purple-600", value: "$0", label: "Revenue" },
                { icon: Zap, bg: "bg-yellow-100", color: "text-yellow-600", value: "0", label: "Downloads" },
              ].map(({ icon: Icon, bg, color, value, label }) => (
                <div key={label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
                  <p className="text-sm text-gray-600">{label}</p>
                </div>
              ))}
            </div>

            {/* Empty State */}
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Upload className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No apps yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start by uploading your first app to reach millions of users worldwide.
              </p>
              <Link
                href="/developer/upload"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Upload className="w-5 h-5" />
                Upload Your First App
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── REGISTRATION FORM ──────────────────────────────────────────────────────
  if (showRegistration) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <UserSidebar onLogout={handleLogout} userEmail={user?.email} />
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white border-b border-gray-200 px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Developer Registration</h1>
            <p className="text-sm text-gray-600 mt-1">Complete your developer profile</p>
          </div>

          <div className="p-8 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Developer Name / Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={developerName}
                    onChange={(e) => setDeveloperName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Your name or company"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Website
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    About / Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    placeholder="Tell us about yourself and what you build"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                    I agree to the{" "}
                    <a href="#" className="text-blue-600 hover:underline">Developer Terms</a>{" "}
                    and{" "}
                    <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                  </label>
                </div>

                {submitError && (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
                    {submitError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowRegistration(false)}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── NO REQUEST YET — MARKETING PAGE ───────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <UserSidebar onLogout={handleLogout} userEmail={user?.email} />

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Developer Portal</h1>
          <p className="text-sm text-gray-600 mt-1">Join our developer community</p>
        </div>

        <div className="p-8 max-w-5xl mx-auto">
          {/* Hero */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 text-white mb-8">
            <div className="max-w-2xl">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                <Code className="w-8 h-8" />
              </div>
              <h2 className="text-4xl font-bold mb-4">Become a Developer</h2>
              <p className="text-lg text-blue-100 mb-8">
                Share your apps with millions of users worldwide. Build, publish, and monetize your applications on our platform.
              </p>
              <button
                onClick={() => setShowRegistration(true)}
                className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                Apply to Become a Developer
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              {
                icon: Rocket,
                bg: "bg-blue-100",
                color: "text-blue-600",
                title: "Global Reach",
                desc: "Reach millions of users across 150+ countries with our distribution platform.",
              },
              {
                icon: DollarSign,
                bg: "bg-green-100",
                color: "text-green-600",
                title: "Monetization",
                desc: "Flexible pricing models with 70% revenue share and instant payouts.",
              },
              {
                icon: Shield,
                bg: "bg-purple-100",
                color: "text-purple-600",
                title: "Secure Platform",
                desc: "Enterprise-grade security with automated malware scanning and code review.",
              },
            ].map(({ icon: Icon, bg, color, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">What You Get</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Free developer account",
                "Analytics dashboard",
                "App store optimization tools",
                "Marketing support",
                "Technical documentation",
                "Developer community access",
                "Priority support",
                "Beta testing platform",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
