"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  AlertTriangle,
  BarChart3,
  CreditCard,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Dumbbell,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NotificationToggle } from "@/components/NotificationToggle";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Clients",
    href: "/admin/clients",
    icon: Users,
    subItems: [
      { label: "All Clients", href: "/admin/clients" },
      { label: "Invite Client", href: "/admin/clients/invite" },
    ],
  },
  {
    label: "Plans",
    href: "/admin/plans",
    icon: ClipboardList,
    subItems: [
      { label: "Nutrition Plans", href: "/admin/plans/nutrition" },
      { label: "Training Plans", href: "/admin/plans/training" },
      { label: "Create Plan", href: "/admin/plans/create" },
    ],
  },
  {
    label: "Risk Flags",
    href: "/admin/risk-flags",
    icon: AlertTriangle,
    badge: 3,
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    label: "Subscriptions",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const supabase = createClient();

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    window.location.href = "/login";
  };

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Admin sidebar uses dark theme */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <Link href="/admin" className="flex items-center gap-2">
            <Dumbbell className="w-8 h-8 text-primary" />
            <div>
              <span className="text-xl font-bold text-sidebar-foreground">Strenx</span>
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-primary text-primary-foreground rounded">
                Admin
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedItems.includes(item.label);

            return (
              <div key={item.label}>
                {hasSubItems ? (
                  <button
                    onClick={() => toggleExpanded(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-sidebar-primary/20 text-sidebar-primary"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-sidebar-primary/20 text-sidebar-primary"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </div>
                    {"badge" in item && item.badge && item.badge > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-destructive text-destructive-foreground rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}

                {/* Sub-items */}
                {hasSubItems && isExpanded && (
                  <div className="mt-1 ml-8 space-y-1">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          pathname === subItem.href
                            ? "bg-sidebar-primary/10 text-sidebar-primary"
                            : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
                        }`}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                Coach
              </p>
              <p className="text-xs text-sidebar-foreground/50 truncate">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-card border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-foreground">
              Coach Dashboard
            </h1>
          </div>

          <Link href="/admin" className="lg:hidden flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-primary" />
            <span className="font-bold text-foreground">
              Strenx
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <NotificationToggle compact />
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
