"use client";

import { useState } from "react";
import {
  User,
  Bell,
  Shield,
  Palette,
  Save,
  Loader2,
} from "lucide-react";

type TabType = "profile" | "notifications" | "security" | "appearance";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "appearance" as const, label: "Appearance", icon: Palette },
  ];

  async function handleSave() {
    setIsSaving(true);
    setSaveSuccess(false);

    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage platform settings and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <nav className="lg:w-64 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-violet-600 text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 bg-card rounded-xl border border-border p-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Admin Profile</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Super"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Admin"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  defaultValue="superadmin@strenx.test"
                  disabled
                  className="w-full px-4 py-2 border border-border rounded-lg bg-muted text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Contact support to change your email
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Notification Preferences</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">New Coach Signups</p>
                    <p className="text-sm text-muted-foreground">Get notified when a new coach joins</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 dark:peer-focus:ring-violet-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Revenue Alerts</p>
                    <p className="text-sm text-muted-foreground">Daily revenue summary emails</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 dark:peer-focus:ring-violet-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">System Alerts</p>
                    <p className="text-sm text-muted-foreground">Critical system notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 dark:peer-focus:ring-violet-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-violet-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Security Settings</h2>

              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Change Password</h3>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
                  Update Password
                </button>
              </div>

              <hr className="border-border" />

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <button className="px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors">
                  Enable
                </button>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Appearance Settings</h2>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Theme
                </label>
                <div className="flex gap-3">
                  {["light", "dark", "system"].map((theme) => (
                    <button
                      key={theme}
                      className="flex-1 p-4 border border-border rounded-lg hover:border-violet-500 transition-colors text-center capitalize"
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Accent Color
                </label>
                <div className="flex gap-3">
                  {[
                    { name: "violet", class: "bg-violet-500" },
                    { name: "blue", class: "bg-blue-500" },
                    { name: "green", class: "bg-green-500" },
                    { name: "orange", class: "bg-orange-500" },
                  ].map((color) => (
                    <button
                      key={color.name}
                      className={`w-10 h-10 rounded-full ${color.class} ring-2 ring-offset-2 ring-offset-background hover:ring-violet-500 transition-all`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
            {saveSuccess && (
              <span className="text-sm text-green-600">Settings saved successfully!</span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="ml-auto px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
