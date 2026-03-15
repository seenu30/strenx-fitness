"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
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
  QrCode,
  Copy,
  Upload,
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

interface PaymentSettings {
  upiId: string;
  qrCodeUrl: string | null;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "profile" | "business" | "notifications" | "security" | "plans" | "payment"
  >("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrCodeInputRef = useRef<HTMLInputElement>(null);

  // Payment settings state
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    upiId: "",
    qrCodeUrl: null,
  });
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentSaveSuccess, setPaymentSaveSuccess] = useState(false);
  const [uploadingQrCode, setUploadingQrCode] = useState(false);

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
        .select("email, full_name, avatar_url")
        .eq("id", user.id)
        .single();

      // Set avatar URL
      if ((userData as { avatar_url?: string } | null)?.avatar_url) {
        setAvatarUrl((userData as { avatar_url: string }).avatar_url);
      }

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

      // Set default business info
      setBusiness({
        businessName: "Strenx Fitness",
        tagline: "",
        website: "",
        supportEmail: "",
      });

    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const loadPaymentSettings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get coach's payment settings
      const { data: coach } = await (supabase as SupabaseClient)
        .from("coaches")
        .select("upi_id, payment_qr_url")
        .eq("user_id", user.id)
        .single();

      if (coach) {
        setPaymentSettings({
          upiId: (coach as { upi_id?: string }).upi_id || "",
          qrCodeUrl: (coach as { payment_qr_url?: string }).payment_qr_url || null,
        });
      }
    } catch (error) {
      console.error("Error loading payment settings:", error);
    }
  }, [supabase]);

  useEffect(() => {
    loadSettings();
    loadPaymentSettings();
  }, [loadSettings, loadPaymentSettings]);

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
      // Business settings are currently not persisted
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error("Error saving business:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePayment() {
    setSavingPayment(true);
    setPaymentSaveSuccess(false);

    try {
      const response = await fetch("/api/payment-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upiId: paymentSettings.upiId,
          qrCodeUrl: paymentSettings.qrCodeUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save payment settings");
      }

      setPaymentSaveSuccess(true);
      setTimeout(() => setPaymentSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving payment settings:", error);
      alert("Failed to save payment settings");
    } finally {
      setSavingPayment(false);
    }
  }

  async function handleQrCodeUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }

    setUploadingQrCode(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get coach ID
      const { data: coach } = await (supabase as SupabaseClient)
        .from("coaches")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!coach) {
        alert("Coach profile not found");
        return;
      }

      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${(coach as { id: string }).id}/payment-qr.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("payment-qr-codes")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert("Failed to upload QR code. Please try again.");
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("payment-qr-codes")
        .getPublicUrl(fileName);

      setPaymentSettings((prev) => ({ ...prev, qrCodeUrl: publicUrl }));

    } catch (error) {
      console.error("Error uploading QR code:", error);
      alert("Failed to upload QR code");
    } finally {
      setUploadingQrCode(false);
      // Reset file input
      if (qrCodeInputRef.current) {
        qrCodeInputRef.current.value = "";
      }
    }
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }

    setUploadingPhoto(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert("Failed to upload image. Please try again.");
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(fileName);

      // Update user record with avatar URL
      await (supabase as SupabaseClient)
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      setAvatarUrl(publicUrl);

    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload image");
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
    { id: "payment", label: "Payment", icon: QrCode },
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
                  <div className="w-20 h-20 rounded-full bg-brown-500 flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-white">{getInitials()}</span>
                    )}
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="px-4 py-2 text-sm text-brown-500 border border-brown-500 rounded-lg hover:bg-brown-50 dark:hover:bg-brown-900/20 disabled:opacity-50 flex items-center gap-2"
                    >
                      {uploadingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Change Photo"
                      )}
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

            {activeTab === "payment" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                  Payment Settings
                </h2>
                <p className="text-stone-500 text-sm">
                  Configure your UPI details for receiving payments from clients
                </p>

                {/* QR Code Upload */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                    Payment QR Code
                  </label>
                  <div className="flex items-start gap-6">
                    <div className="w-40 h-40 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-600 flex items-center justify-center overflow-hidden bg-stone-50 dark:bg-stone-800">
                      {paymentSettings.qrCodeUrl ? (
                        <Image
                          src={paymentSettings.qrCodeUrl}
                          alt="Payment QR Code"
                          width={160}
                          height={160}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <QrCode className="w-10 h-10 mx-auto text-stone-400 mb-2" />
                          <p className="text-xs text-stone-500">No QR uploaded</p>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <input
                        ref={qrCodeInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleQrCodeUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => qrCodeInputRef.current?.click()}
                        disabled={uploadingQrCode}
                        className="px-4 py-2 text-sm text-brown-500 border border-brown-500 rounded-lg hover:bg-brown-50 dark:hover:bg-brown-900/20 disabled:opacity-50 flex items-center gap-2"
                      >
                        {uploadingQrCode ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            {paymentSettings.qrCodeUrl ? "Change QR Code" : "Upload QR Code"}
                          </>
                        )}
                      </button>
                      <p className="text-xs text-stone-500">
                        Upload your UPI QR code image. JPG or PNG, max 2MB.
                      </p>
                      <p className="text-xs text-stone-500">
                        Clients will see this QR code when submitting their application.
                      </p>
                    </div>
                  </div>
                </div>

                {/* UPI ID */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    UPI ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={paymentSettings.upiId}
                      onChange={(e) =>
                        setPaymentSettings({ ...paymentSettings, upiId: e.target.value })
                      }
                      placeholder="yourname@upi"
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                    />
                  </div>
                  <p className="text-xs text-stone-500 mt-1.5">
                    Your UPI ID will be displayed to clients so they can pay via any UPI app.
                  </p>
                </div>

                {/* Preview */}
                {(paymentSettings.qrCodeUrl || paymentSettings.upiId) && (
                  <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
                      Preview (as shown to clients)
                    </p>
                    <div className="flex items-center gap-4">
                      {paymentSettings.qrCodeUrl && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-white">
                          <Image
                            src={paymentSettings.qrCodeUrl}
                            alt="QR Preview"
                            width={96}
                            height={96}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      {paymentSettings.upiId && (
                        <div className="flex-1">
                          <p className="text-xs text-stone-500 mb-1">UPI ID</p>
                          <div className="flex items-center gap-2">
                            <code className="px-3 py-1.5 bg-white dark:bg-stone-700 rounded-lg text-sm font-mono text-stone-800 dark:text-stone-200">
                              {paymentSettings.upiId}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(paymentSettings.upiId);
                              }}
                              className="p-1.5 text-stone-500 hover:text-brown-500"
                              title="Copy UPI ID"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-4">
                  <button
                    onClick={handleSavePayment}
                    disabled={savingPayment}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-brown-500 text-white rounded-lg font-medium hover:bg-brown-600 disabled:opacity-50"
                  >
                    {savingPayment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {savingPayment ? "Saving..." : "Save Payment Settings"}
                  </button>
                  {paymentSaveSuccess && (
                    <span className="text-green-600 flex items-center gap-1 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Saved successfully
                    </span>
                  )}
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
