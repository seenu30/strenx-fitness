"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

interface PlanTemplateRow {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
}
import {
  User,
  Bell,
  Lock,
  CreditCard,
  Mail,
  Shield,
  Eye,
  EyeOff,
  Save,
  ChevronRight,
  Building,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Business {
  businessName: string;
  tagline: string;
  website: string;
  supportEmail: string;
}

interface PlanTemplate {
  id: string;
  name: string;
  price: number;
  active: boolean;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "profile" | "business" | "notifications" | "security" | "plans"
  >("profile");
  const [showPassword, setShowPassword] = useState(false);

  // Password update state
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const supabase = createClient();

  const [profile, setProfile] = useState<Profile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [business, setBusiness] = useState<Business>({
    businessName: "",
    tagline: "",
    website: "",
    supportEmail: "",
  });

  const [plans, setPlans] = useState<PlanTemplate[]>([]);

  const [notifications, setNotifications] = useState({
    newCheckins: true,
    clientMessages: true,
    riskFlags: true,
    subscriptionRenewals: true,
    dailySummary: false,
  });

  const loadSettings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile
      const { data: userData } = await (supabase as SupabaseClient)
        .from("users")
        .select("email, full_name, tenant_id")
        .eq("id", user.id)
        .single();

      // Parse name
      const nameParts = ((userData as { full_name?: string } | null)?.full_name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      setProfile({
        firstName,
        lastName,
        email: (userData as { email?: string } | null)?.email || user.email || "",
        phone: "",
      });

      // Get tenant/business info
      if ((userData as { tenant_id?: string } | null)?.tenant_id) {
        const { data: tenantData } = await (supabase as SupabaseClient)
          .from("tenants")
          .select("name, settings")
          .eq("id", (userData as { tenant_id: string }).tenant_id)
          .single();

        if (tenantData) {
          const settings = (tenantData as { settings?: Record<string, string> }).settings || {};
          setBusiness({
            businessName: (tenantData as { name?: string }).name || "Strenx Fitness",
            tagline: settings.tagline || "",
            website: settings.website || "",
            supportEmail: settings.support_email || "",
          });
        }

        // Get plan templates
        const { data: planTemplates } = await (supabase as SupabaseClient)
          .from("plan_templates")
          .select("id, name, price, is_active")
          .eq("tenant_id", (userData as { tenant_id: string }).tenant_id)
          .order("price", { ascending: true });

        if (planTemplates) {
          setPlans((planTemplates as PlanTemplateRow[]).map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price || 0,
            active: p.is_active !== false,
          })));
        }
      }

    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleSaveProfile() {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fullName = `${profile.firstName} ${profile.lastName}`.trim();

      // Update user profile
      await (supabase as SupabaseClient)
        .from("users")
        .update({ full_name: fullName })
        .eq("id", user.id);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBusiness() {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get tenant ID
      const { data: userData } = await (supabase as SupabaseClient)
        .from("users")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if ((userData as { tenant_id?: string } | null)?.tenant_id) {
        // Update tenant info
        await (supabase as SupabaseClient)
          .from("tenants")
          .update({
            name: business.businessName,
            settings: {
              tagline: business.tagline,
              website: business.website,
              support_email: business.supportEmail,
            },
          })
          .eq("id", (userData as { tenant_id: string }).tenant_id);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error("Error saving business:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePassword() {
    setPasswordError("");
    setPasswordSuccess(false);

    // Validation
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setPasswordError("All fields are required");
      return;
    }

    if (passwords.new.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setPasswordError("New passwords do not match");
      return;
    }

    setPasswordUpdating(true);

    try {
      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) {
        setPasswordError(error.message);
        return;
      }

      setPasswordSuccess(true);
      setPasswords({ current: "", new: "", confirm: "" });
      setTimeout(() => setPasswordSuccess(false), 3000);

    } catch (error) {
      console.error("Error updating password:", error);
      setPasswordError("Failed to update password");
    } finally {
      setPasswordUpdating(false);
    }
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "business", label: "Business", icon: Building },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
    { id: "plans", label: "Pricing Plans", icon: CreditCard },
  ];

  const getInitials = () => {
    const first = profile.firstName?.[0] || "";
    const last = profile.lastName?.[0] || "";
    return (first + last).toUpperCase() || "CA";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brown-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
          Settings
        </h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">
          Manage your account and business settings
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-brown-50 dark:bg-brown-900/20 text-brown-500 border-l-2 border-brown-500"
                      : "text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                  Coach Profile
                </h2>

                <div className="flex items-center gap-4 pb-6 border-b border-stone-200 dark:border-stone-700">
                  <div className="w-20 h-20 rounded-full bg-brown-500 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{getInitials()}</span>
                  </div>
                  <div>
                    <button className="px-4 py-2 text-sm text-brown-500 border border-brown-500 rounded-lg hover:bg-brown-50 dark:hover:bg-brown-900/20">
                      Change Photo
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) =>
                        setProfile({ ...profile, firstName: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) =>
                        setProfile({ ...profile, lastName: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-brown-500 text-white rounded-lg font-medium hover:bg-brown-600 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  {saveSuccess && (
                    <span className="text-green-600 flex items-center gap-1 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Saved successfully
                    </span>
                  )}
                </div>
              </div>
            )}

            {activeTab === "business" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                  Business Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={business.businessName}
                      onChange={(e) =>
                        setBusiness({ ...business, businessName: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                      Tagline
                    </label>
                    <input
                      type="text"
                      value={business.tagline}
                      onChange={(e) =>
                        setBusiness({ ...business, tagline: e.target.value })
                      }
                      placeholder="Transform Your Body, Transform Your Life"
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                      Website
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      <input
                        type="url"
                        value={business.website}
                        onChange={(e) =>
                          setBusiness({ ...business, website: e.target.value })
                        }
                        placeholder="https://yourwebsite.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                      Support Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      <input
                        type="email"
                        value={business.supportEmail}
                        onChange={(e) =>
                          setBusiness({ ...business, supportEmail: e.target.value })
                        }
                        placeholder="support@yourbusiness.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSaveBusiness}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-brown-500 text-white rounded-lg font-medium hover:bg-brown-600 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  {saveSuccess && (
                    <span className="text-green-600 flex items-center gap-1 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Saved successfully
                    </span>
                  )}
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                  Notification Settings
                </h2>

                <div className="space-y-4">
                  {[
                    { key: "newCheckins", label: "New client check-ins" },
                    { key: "clientMessages", label: "Client messages" },
                    { key: "riskFlags", label: "Risk flag alerts" },
                    { key: "subscriptionRenewals", label: "Subscription renewals" },
                    { key: "dailySummary", label: "Daily summary email" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-3 border-b border-stone-100 dark:border-stone-800 last:border-0"
                    >
                      <span className="text-stone-700 dark:text-stone-300">
                        {item.label}
                      </span>
                      <button
                        onClick={() =>
                          setNotifications({
                            ...notifications,
                            [item.key]: !notifications[item.key as keyof typeof notifications],
                          })
                        }
                        className={`w-12 h-6 rounded-full transition-colors ${
                          notifications[item.key as keyof typeof notifications]
                            ? "bg-brown-500"
                            : "bg-stone-300 dark:bg-stone-600"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                            notifications[item.key as keyof typeof notifications]
                              ? "translate-x-6"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                  Security Settings
                </h2>

                <div className="space-y-4">
                  <h3 className="font-medium text-stone-800 dark:text-stone-100">
                    Change Password
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        className="w-full px-4 py-2.5 pr-10 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                    />
                  </div>

                  {passwordError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Password updated successfully
                    </div>
                  )}

                  <button
                    onClick={handleUpdatePassword}
                    disabled={passwordUpdating}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-brown-500 text-white rounded-lg font-medium hover:bg-brown-600 disabled:opacity-50"
                  >
                    {passwordUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    {passwordUpdating ? "Updating..." : "Update Password"}
                  </button>
                </div>

                <div className="pt-6 border-t border-stone-200 dark:border-stone-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-stone-500" />
                      <div>
                        <p className="font-medium text-stone-800 dark:text-stone-100">
                          Two-Factor Authentication
                        </p>
                        <p className="text-sm text-stone-500">
                          Secure your account with 2FA
                        </p>
                      </div>
                    </div>
                    <button className="px-4 py-2 text-sm text-brown-500 border border-brown-500 rounded-lg hover:bg-brown-50 dark:hover:bg-brown-900/20">
                      Enable
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "plans" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                  Subscription Plans
                </h2>
                <p className="text-stone-500 text-sm">
                  Configure the plans available for your clients
                </p>

                <div className="space-y-4">
                  {plans.length > 0 ? (
                    plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-stone-200 dark:border-stone-700"
                      >
                        <div>
                          <p className="font-medium text-stone-800 dark:text-stone-100">
                            {plan.name}
                          </p>
                          <p className="text-lg font-bold text-brown-500">
                            ₹{plan.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            className={`w-12 h-6 rounded-full transition-colors ${
                              plan.active
                                ? "bg-green-500"
                                : "bg-stone-300 dark:bg-stone-600"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                                plan.active ? "translate-x-6" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                          <button className="px-3 py-1.5 text-sm text-brown-500 border border-brown-500 rounded-lg hover:bg-brown-50 dark:hover:bg-brown-900/20">
                            Edit
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-stone-500">
                      No plan templates configured yet.
                    </div>
                  )}
                </div>

                <button className="w-full py-3 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-lg text-stone-500 hover:border-brown-500 hover:text-brown-500 transition-colors">
                  + Add New Plan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
