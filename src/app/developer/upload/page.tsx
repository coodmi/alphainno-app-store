"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser, signOut } from "@/lib/auth";
import UserSidebar from "@/components/user-sidebar";

export default function DeveloperUploadPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const init = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace("/login");
        return;
      }
      setUser(currentUser);

      // Check developer approval status
      try {
        const res = await fetch(`/api/developer/status?user_id=${currentUser.id}`);
        const json = await res.json();
        if (json.status !== "approved") {
          router.replace("/user-dashboard/developer");
          return;
        }
      } catch {
        router.replace("/user-dashboard/developer");
        return;
      }

      setIsLoading(false);
    };

    void init();
  }, [router]);

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("Draft submitted successfully. Next step: connect backend API for real uploads.");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <UserSidebar onLogout={handleLogout} userEmail={user?.email} />

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Developer Upload Portal</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Publish apps across Windows, macOS, Android, Linux, and iOS from one place.
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-8 py-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5"
          >
            <div className="grid md:grid-cols-2 gap-5">
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">App Name</span>
                <input
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Example: OmniMail"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Category</span>
                <select
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Select category</option>
                  <option>Productivity</option>
                  <option>Developer Tools</option>
                  <option>Games</option>
                  <option>Business</option>
                </select>
              </label>
            </div>

            <label className="space-y-2 block">
              <span className="text-sm font-medium text-gray-700">Supported Platforms</span>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                {["Windows", "macOS", "Android", "Linux", "iOS"].map((platform) => (
                  <label
                    key={platform}
                    className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50"
                  >
                    <input type="checkbox" />
                    {platform}
                  </label>
                ))}
              </div>
            </label>

            <label className="space-y-2 block">
              <span className="text-sm font-medium text-gray-700">Description</span>
              <textarea
                required
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                placeholder="Describe your app, key features, and target users"
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-sm font-medium text-gray-700">App Package (placeholder)</span>
              <input
                type="file"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
              />
            </label>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Submit Draft
              </button>
              <button
                type="button"
                className="border border-gray-300 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Save for later
              </button>
            </div>

            {message && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
