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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-900 dark:to-stone-950 p-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-stone-800 dark:text-stone-100">
          Strenx Fitness
        </h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">
          Transform Your Body & Mind
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 p-8">
          {children}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-stone-500 dark:text-stone-400">
        &copy; {new Date().getFullYear()} Strenx Fitness. All rights reserved.
      </p>
    </div>
  );
}
