import Link from "next/link";
import {
  Dumbbell,
  UtensilsCrossed,
  LineChart,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
  Target,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-8 h-8 text-amber-600" />
              <span className="text-xl font-bold text-stone-900 dark:text-white">
                Strenx
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Transform Your Body, Transform Your Life
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 dark:text-white leading-tight mb-6">
              Your Personal{" "}
              <span className="text-amber-600">Fitness Coach</span>,{" "}
              <br className="hidden sm:block" />
              Always By Your Side
            </h1>
            <p className="text-xl text-stone-600 dark:text-stone-400 mb-8 max-w-2xl mx-auto">
              Get personalized training programs, nutrition plans, and expert
              guidance from certified coaches. Track your progress and achieve
              your fitness goals faster than ever.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
              >
                Start Your Transformation
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-900 dark:text-white px-8 py-4 rounded-xl font-semibold text-lg border border-stone-200 dark:border-stone-700 transition-colors"
              >
                I Have an Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-stone-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
              Our comprehensive platform gives you all the tools and support you
              need to reach your fitness goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Dumbbell className="w-6 h-6" />}
              title="Custom Training"
              description="Personalized workout plans designed for your goals, experience level, and available equipment."
            />
            <FeatureCard
              icon={<UtensilsCrossed className="w-6 h-6" />}
              title="Nutrition Plans"
              description="Tailored meal plans with macros calculated specifically for your body and objectives."
            />
            <FeatureCard
              icon={<LineChart className="w-6 h-6" />}
              title="Progress Tracking"
              description="Track weight, measurements, photos, and performance metrics in one place."
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Coach Support"
              description="Direct messaging with your coach for guidance, questions, and accountability."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
              Get started in minutes and begin your transformation journey today.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number={1}
              title="Complete Your Assessment"
              description="Tell us about your goals, training history, lifestyle, and preferences through our comprehensive onboarding."
            />
            <StepCard
              number={2}
              title="Get Your Custom Plan"
              description="Your coach creates personalized training and nutrition plans based on your unique profile."
            />
            <StepCard
              number={3}
              title="Track & Transform"
              description="Check in daily, track your progress, and communicate with your coach to stay on track."
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-stone-900 dark:bg-stone-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Why Choose Strenx?
              </h2>
              <div className="space-y-4">
                <BenefitItem
                  icon={<Target className="w-5 h-5" />}
                  text="Goal-focused programs that adapt to your progress"
                />
                <BenefitItem
                  icon={<Shield className="w-5 h-5" />}
                  text="Secure, encrypted health data storage"
                />
                <BenefitItem
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  text="Daily accountability with smart check-ins"
                />
                <BenefitItem
                  icon={<MessageSquare className="w-5 h-5" />}
                  text="Real-time communication with your coach"
                />
                <BenefitItem
                  icon={<LineChart className="w-5 h-5" />}
                  text="Visual progress tracking with photos and metrics"
                />
                <BenefitItem
                  icon={<Zap className="w-5 h-5" />}
                  text="Quick, easy-to-use mobile-friendly interface"
                />
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Ready to Transform?</h3>
              <p className="text-amber-100 mb-6">
                Join hundreds of clients who have achieved their fitness goals
                with personalized coaching and accountability.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-white text-amber-700 px-6 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
              >
                Get Started Today
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white mb-4">
            Start Your Fitness Journey Today
          </h2>
          <p className="text-lg text-stone-600 dark:text-stone-400 mb-8">
            No commitments, no pressure. Complete your assessment and get
            matched with a coach who understands your goals.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
          >
            Begin Your Assessment
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-6 h-6 text-amber-600" />
              <span className="text-lg font-bold text-stone-900 dark:text-white">
                Strenx
              </span>
            </div>
            <p className="text-stone-500 dark:text-stone-500 text-sm">
              &copy; {new Date().getFullYear()} Strenx Fitness. All rights
              reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a
                href="#"
                className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-500 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-stone-600 dark:text-stone-400">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-stone-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-stone-600 dark:text-stone-400">{description}</p>
    </div>
  );
}

function BenefitItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-amber-600/20 rounded-lg flex items-center justify-center text-amber-500">
        {icon}
      </div>
      <span className="text-stone-300">{text}</span>
    </div>
  );
}
