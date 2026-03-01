import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complete Your Profile",
  description: "Complete your assessment to get started with your personalized fitness journey",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">
              Strenx Fitness
            </h1>
            <span className="text-sm text-muted-foreground">
              Complete Your Profile
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
