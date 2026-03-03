"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle, Mail, Clock, ArrowRight } from "lucide-react";

export default function ThankYouPage() {
  // Clear local storage on successful submission
  useEffect(() => {
    localStorage.removeItem("strenx_application");
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-12">
      {/* Success Icon */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Mail className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Application Submitted!
        </h1>
        <p className="text-lg text-muted-foreground">
          Thank you for applying to Strenx Fitness. We&apos;re excited to help you on your transformation journey.
        </p>
      </div>

      {/* What happens next */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          What happens next?
        </h2>
        <ol className="space-y-4">
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
              1
            </span>
            <div>
              <p className="font-medium text-foreground">Coach Review</p>
              <p className="text-sm text-muted-foreground">
                Our coach will review your application within 24-48 hours.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
              2
            </span>
            <div>
              <p className="font-medium text-foreground">Plan Selection</p>
              <p className="text-sm text-muted-foreground">
                Based on your goals, we&apos;ll recommend the best plan for you.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
              3
            </span>
            <div>
              <p className="font-medium text-foreground">Payment Confirmation</p>
              <p className="text-sm text-muted-foreground">
                Once payment is confirmed, you&apos;ll receive an email to create your account.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
              4
            </span>
            <div>
              <p className="font-medium text-foreground">Get Started!</p>
              <p className="text-sm text-muted-foreground">
                Set your password and start your transformation journey!
              </p>
            </div>
          </li>
        </ol>
      </div>

      {/* Contact info */}
      <div className="bg-muted/50 rounded-xl p-6 text-center mb-8">
        <p className="text-muted-foreground mb-2">
          Questions? Contact us at
        </p>
        <a
          href="mailto:support@strenxfitness.com"
          className="text-primary font-medium hover:underline"
        >
          support@strenxfitness.com
        </a>
      </div>

      {/* Back to home */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          Back to Home
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
