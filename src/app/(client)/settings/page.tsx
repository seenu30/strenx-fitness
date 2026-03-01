"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Bell,
  Lock,
  Moon,
  Sun,
  Smartphone,
  Mail,
  Shield,
  Eye,
  EyeOff,
  Save,
  Trash2,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "security" | "preferences">("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

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

  // Push notifications
  const {
    isSupported: pushSupported,
    permission: pushPermission,
    isSubscribed: pushSubscribed,
    isLoading: pushLoading,
    error: pushError,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
  } = usePushNotifications();

  const [profile, setProfile] = useState<Profile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
  });

  const [notifications, setNotifications] = useState({
    emailCheckinReminder: true,
    emailPlanUpdates: true,
    emailMessages: true,
    pushCheckinReminder: true,
    pushMessages: true,
    pushPlanUpdates: false,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile
      const { data: userData } = await (supabase as any)
        .from("users")
        .select("email, full_name")
        .eq("id", user.id)
        .single();

      // Get client info for additional details
      const { data: clientData } = await (supabase as any)
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      // Get personal assessment data (phone, city)
      let personalData = null;
      if (clientData) {
        const { data } = await (supabase as any)
          .from("assess_personal")
          .select("phone, city")
          .eq("client_id", clientData.id)
          .single();
        personalData = data;
      }

      // Parse name
      const nameParts = (userData?.full_name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      setProfile({
        firstName,
        lastName,
        email: userData?.email || user.email || "",
        phone: personalData?.phone || "",
        city: personalData?.city || "",
      });

    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fullName = `${profile.firstName} ${profile.lastName}`.trim();

      // Update user profile
      await (supabase as any)
        .from("users")
        .update({ full_name: fullName })
        .eq("id", user.id);

      // Get client ID
      const { data: clientData } = await (supabase as any)
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      // Update personal assessment if client exists
      if (clientData) {
        await (supabase as any)
          .from("assess_personal")
          .upsert({
            client_id: clientData.id,
            phone: profile.phone,
            city: profile.city,
          }, { onConflict: "client_id" });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error("Error saving profile:", error);
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
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
    { id: "preferences", label: "Preferences", icon: Moon },
  ];

  const getInitials = () => {
    const first = profile.firstName?.[0] || "";
    const last = profile.lastName?.[0] || "";
    return (first + last).toUpperCase() || "??";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
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
          Manage your account settings and preferences
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
                      ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-l-2 border-amber-600"
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
                  Profile Information
                </h2>

                <div className="flex items-center gap-4 pb-6 border-b border-stone-200 dark:border-stone-700">
                  <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                      {getInitials()}
                    </span>
                  </div>
                  <div>
                    <button className="px-4 py-2 text-sm text-amber-600 border border-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20">
                      Change Photo
                    </button>
                    <p className="text-xs text-stone-500 mt-2">
                      JPG or PNG. Max 2MB.
                    </p>
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
                    <p className="text-xs text-stone-500 mt-1">
                      Contact your coach to change email
                    </p>
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
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      value={profile.city}
                      onChange={(e) =>
                        setProfile({ ...profile, city: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50"
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
                  Notification Preferences
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-stone-200 dark:border-stone-700">
                    <Mail className="w-5 h-5 text-stone-500" />
                    <h3 className="font-medium text-stone-800 dark:text-stone-100">
                      Email Notifications
                    </h3>
                  </div>

                  {[
                    { key: "emailCheckinReminder", label: "Daily check-in reminders" },
                    { key: "emailPlanUpdates", label: "Plan updates from coach" },
                    { key: "emailMessages", label: "New messages from coach" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="text-stone-700 dark:text-stone-300">
                        {item.label}
                      </span>
                      <button
                        onClick={() =>
                          setNotifications({
                            ...notifications,
                            [item.key]:
                              !notifications[item.key as keyof typeof notifications],
                          })
                        }
                        className={`w-12 h-6 rounded-full transition-colors ${
                          notifications[item.key as keyof typeof notifications]
                            ? "bg-amber-600"
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

                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-stone-200 dark:border-stone-700">
                    <Smartphone className="w-5 h-5 text-stone-500" />
                    <h3 className="font-medium text-stone-800 dark:text-stone-100">
                      Push Notifications
                    </h3>
                  </div>

                  {/* Push notification subscription status */}
                  <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {pushSubscribed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Bell className="w-5 h-5 text-stone-500" />
                        )}
                        <div>
                          <p className="font-medium text-stone-800 dark:text-stone-100">
                            {pushSubscribed ? "Notifications Enabled" : "Enable Push Notifications"}
                          </p>
                          <p className="text-sm text-stone-500">
                            {!pushSupported
                              ? "Not supported in this browser"
                              : pushPermission === "denied"
                              ? "Permission denied in browser settings"
                              : pushSubscribed
                              ? "You will receive notifications on this device"
                              : "Get notified about messages and updates"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (pushSubscribed) {
                            await unsubscribeFromPush();
                          } else {
                            await subscribeToPush();
                          }
                        }}
                        disabled={!pushSupported || pushPermission === "denied" || pushLoading}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          pushSubscribed
                            ? "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600"
                            : "bg-amber-600 text-white hover:bg-amber-700"
                        }`}
                      >
                        {pushLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : pushSubscribed ? (
                          "Disable"
                        ) : (
                          "Enable"
                        )}
                      </button>
                    </div>

                    {pushError && (
                      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        {pushError}
                      </div>
                    )}
                  </div>

                  {/* Individual notification preferences (only when subscribed) */}
                  {pushSubscribed && (
                    <div className="space-y-2 pt-2">
                      <p className="text-sm text-stone-500 mb-3">
                        Choose which notifications you want to receive:
                      </p>
                      {[
                        { key: "pushCheckinReminder", label: "Daily check-in reminders" },
                        { key: "pushMessages", label: "New messages from coach" },
                        { key: "pushPlanUpdates", label: "Plan updates" },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between py-2"
                        >
                          <span className="text-stone-700 dark:text-stone-300">
                            {item.label}
                          </span>
                          <button
                            onClick={() =>
                              setNotifications({
                                ...notifications,
                                [item.key]:
                                  !notifications[item.key as keyof typeof notifications],
                              })
                            }
                            className={`w-12 h-6 rounded-full transition-colors ${
                              notifications[item.key as keyof typeof notifications]
                                ? "bg-amber-600"
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
                  )}
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
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50"
                  >
                    {passwordUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    {passwordUpdating ? "Updating..." : "Update Password"}
                  </button>
                </div>

                <div className="pt-6 border-t border-stone-200 dark:border-stone-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-stone-500" />
                      <div>
                        <p className="font-medium text-stone-800 dark:text-stone-100">
                          Two-Factor Authentication
                        </p>
                        <p className="text-sm text-stone-500">
                          Add an extra layer of security
                        </p>
                      </div>
                    </div>
                    <button className="px-4 py-2 text-sm text-amber-600 border border-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20">
                      Enable
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                  App Preferences
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      {darkMode ? (
                        <Moon className="w-5 h-5 text-stone-500" />
                      ) : (
                        <Sun className="w-5 h-5 text-stone-500" />
                      )}
                      <div>
                        <p className="font-medium text-stone-800 dark:text-stone-100">
                          Dark Mode
                        </p>
                        <p className="text-sm text-stone-500">
                          Use dark theme for the app
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        darkMode ? "bg-amber-600" : "bg-stone-300 dark:bg-stone-600"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                          darkMode ? "translate-x-6" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-200 dark:border-stone-700 space-y-4">
                  <h3 className="font-medium text-red-600">Danger Zone</h3>
                  <div className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-200">
                          Delete Account
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <button className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
