import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Sign in to your Strenx Fitness account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-secondary to-muted p-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">
          Strenx Fitness
        </h1>
        <p className="text-muted-foreground mt-1">
          Transform Your Body & Mind
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-xl border border-border p-8">
          {children}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Strenx Fitness. All rights reserved.
      </p>
    </div>
  );
}
