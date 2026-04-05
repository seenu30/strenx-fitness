"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dumbbell,
  UtensilsCrossed,
  LineChart,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Shield,
  Target,
  ChevronDown,
  Award,
  Users,
  TrendingUp,
  Calendar,
  Ruler,
  Check,
  X,
  Star,
  Menu,
} from "lucide-react";

// ============================================
// Data
// ============================================

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#benefits", label: "Benefits" },
  { href: "#pricing", label: "Pricing" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#faq", label: "FAQ" },
];

const certifications = [
  "NASM Certified",
  "ACE Certified",
  "ISSA Certified",
  "Precision Nutrition",
  "NSCA Certified",
  "ACSM Certified",
];

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Lost 30 lbs in 4 months",
    quote: "The personalized approach made all the difference. My coach understood my lifestyle and created a plan that actually worked for me.",
    avatar: "SM",
  },
  {
    name: "James Rodriguez",
    role: "Gained 15 lbs muscle",
    quote: "Finally found a coaching program that delivers results. The weekly check-ins kept me accountable and motivated throughout my journey.",
    avatar: "JR",
  },
  {
    name: "Emily Chen",
    role: "Fitness Enthusiast",
    quote: "As a busy mom, I needed flexibility. ZK Fitness gave me exactly that with workouts I could do at home and meal plans my whole family enjoys.",
    avatar: "EC",
  },
  {
    name: "Michael Thompson",
    role: "Marathon Runner",
    quote: "The nutrition guidance took my performance to the next level. I've hit personal records I never thought possible.",
    avatar: "MT",
  },
  {
    name: "Jessica Williams",
    role: "Corporate Professional",
    quote: "Working 60-hour weeks, I thought fitness was impossible. My coach proved me wrong with efficient, effective workouts.",
    avatar: "JW",
  },
  {
    name: "David Park",
    role: "Former Athlete",
    quote: "Getting back in shape after years of neglect seemed daunting. The step-by-step approach made it manageable and even enjoyable.",
    avatar: "DP",
  },
];

const faqs = [
  {
    question: "How is ZK Fitness different from other coaching programs?",
    answer: "Unlike generic fitness apps, ZK Fitness provides truly personalized coaching with a dedicated coach who understands your goals, lifestyle, and challenges. Every workout and meal plan is customized specifically for you, with real-time adjustments based on your progress.",
  },
  {
    question: "Is this suitable for beginners?",
    answer: "Absolutely! Our coaches work with all fitness levels, from complete beginners to advanced athletes. Your program starts exactly where you are and progressively builds as you improve. No prior experience is needed.",
  },
  {
    question: "How does the coaching relationship work?",
    answer: "You'll be matched with a certified coach who will create your personalized plans, review your weekly check-ins, answer your questions, and make adjustments as needed. Communication happens through our app, and most coaches respond within 24 hours.",
  },
  {
    question: "Can I customize my meal plan for dietary restrictions?",
    answer: "Yes! Your coach will take into account all dietary preferences and restrictions including vegetarian, vegan, gluten-free, dairy-free, allergies, and more. Your meal plan is built around foods you actually enjoy eating.",
  },
  {
    question: "What equipment do I need?",
    answer: "Your workout plan is customized based on your available equipment. Whether you have a full gym, just dumbbells at home, or no equipment at all, your coach will create effective workouts that work for your situation.",
  },
];

const pricingPlans = {
  monthly: [
    {
      name: "Essential",
      price: 99,
      description: "Perfect for getting started",
      features: [
        { text: "Personalized workout plan", included: true },
        { text: "Basic nutrition guidelines", included: true },
        { text: "Weekly coach check-ins", included: true },
        { text: "Progress tracking", included: true },
        { text: "Custom meal plans", included: false },
        { text: "Priority support", included: false },
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Premium",
      price: 199,
      description: "Complete transformation package",
      features: [
        { text: "Everything in Essential", included: true },
        { text: "Custom macro-based meal plans", included: true },
        { text: "Daily coach messaging", included: true },
        { text: "Video form reviews", included: true },
        { text: "Supplement guidance", included: true },
        { text: "Priority support & onboarding", included: true },
      ],
      cta: "Upgrade Now",
      popular: true,
    },
  ],
  yearly: [
    {
      name: "Essential",
      price: 79,
      description: "Perfect for getting started",
      features: [
        { text: "Personalized workout plan", included: true },
        { text: "Basic nutrition guidelines", included: true },
        { text: "Weekly coach check-ins", included: true },
        { text: "Progress tracking", included: true },
        { text: "Custom meal plans", included: false },
        { text: "Priority support", included: false },
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Premium",
      price: 159,
      description: "Complete transformation package",
      features: [
        { text: "Everything in Essential", included: true },
        { text: "Custom macro-based meal plans", included: true },
        { text: "Daily coach messaging", included: true },
        { text: "Video form reviews", included: true },
        { text: "Supplement guidance", included: true },
        { text: "Priority support & onboarding", included: true },
      ],
      cta: "Upgrade Now",
      popular: true,
    },
  ],
};

// ============================================
// Main Component
// ============================================

export default function Home() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Full-page background elements - fixed position */}
      <div className="fixed inset-0 pointer-events-none z-[5]">
        {/* Dot grid pattern - throughout homepage */}
        <div className="absolute inset-0 dot-pattern opacity-40" />
      </div>

      {/* Full-page grid lines - fixed position, above navbar */}
      <div className="fixed inset-0 pointer-events-none z-[60]">
        {/* Vertical lines (3) - from top to above footer */}
        <div className="absolute left-6 sm:left-9 lg:left-12 xl:left-[max(3rem,calc(50%-640px+3rem))] top-0 bottom-20 w-px hero-grid-line" />
        <div className="absolute left-1/2 top-0 bottom-20 w-px hero-grid-line" />
        <div className="absolute right-6 sm:right-9 lg:right-12 xl:right-[max(3rem,calc(50%-640px+3rem))] top-0 bottom-20 w-px hero-grid-line" />
        {/* Bottom horizontal line - above footer */}
        <div className="absolute left-0 right-0 bottom-20 h-px hero-grid-line" />
      </div>

      {/* Animated noise overlay - covers navbar + hero only */}
      <div className="fixed top-0 left-0 right-0 h-screen pointer-events-none z-[45] overflow-hidden noise-container">
        <div className="noise-overlay" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-9 lg:px-12 xl:px-[max(3rem,calc(50%-640px+3rem))]">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Dumbbell className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-foreground">ZKF</span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden xl:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="hidden xl:block text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/apply"
                className="hidden xl:inline-flex group items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Get Started
                <ArrowRight className="w-4 h-4 arrow-hover" />
              </Link>

              {/* Hamburger Menu Button - Mobile/Tablet/Small Desktop */}
              <button
                className="xl:hidden p-2 text-foreground hover:bg-accent rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile/Tablet/Small Desktop Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="xl:hidden py-4 border-t border-border mobile-menu-enter">
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors px-2 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground font-medium transition-colors px-2 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/apply"
                  className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-lg font-medium transition-colors mt-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen pt-32 pb-20 px-20 sm:px-24 lg:px-32 xl:px-[max(8rem,calc(50%-640px+8rem))] overflow-hidden">
        {/* Scrolling horizontal line below navbar */}
        <div className="absolute left-0 right-0 top-16 h-px hero-grid-line z-[5]" />

        {/* Meteor Streaks - Only in hero section */}
        <div className="absolute inset-0 pointer-events-none z-[5] overflow-hidden">
          <div className="meteor-streak meteor-1" />
          <div className="meteor-streak meteor-2" />
          <div className="meteor-streak meteor-3" />
          <div className="meteor-streak meteor-4" />
        </div>

        {/* Radial gradient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(205,133,63,0.2),transparent)]" />

        {/* Background Glow Shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
          {/* Top-right glow blob */}
          <div
            className="absolute -top-1/4 -right-1/4 w-[60%] h-[60%] rounded-full opacity-40"
            style={{
              background: 'radial-gradient(circle, rgba(205,127,50,0.6) 0%, rgba(205,127,50,0.2) 40%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />

          {/* Center-left glow blob */}
          <div
            className="absolute top-1/4 -left-1/4 w-[50%] h-[50%] rounded-full opacity-35"
            style={{
              background: 'radial-gradient(circle, rgba(255,140,0,0.5) 0%, rgba(205,127,50,0.15) 50%, transparent 70%)',
              filter: 'blur(100px)',
            }}
          />

          {/* Bottom-center glow blob */}
          <div
            className="absolute bottom-0 left-1/4 w-[70%] h-[40%] rounded-full opacity-30"
            style={{
              background: 'radial-gradient(ellipse, rgba(205,127,50,0.4) 0%, rgba(255,140,0,0.1) 50%, transparent 70%)',
              filter: 'blur(120px)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <div
              className="relative inline-flex items-center justify-center px-3 py-[7px] mb-6 rounded-[15px] backdrop-blur-[5px] shadow-[0_3px_10px_0_rgba(205,133,63,0.5)]"
              style={{ border: '1px solid rgba(205, 133, 63, 0.6)' }}
            >
              <p className="text-sm text-white font-normal">
                Transform Your Body
              </p>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-none tracking-tight mb-6">
              Empowering Your{" "}
              <span className="gradient-text">Fitness Journey</span>{" "}
              with Expert Coaching
            </h1>

            <p className="text-base text-muted-foreground mb-8 max-w-xl mx-auto">
              Our personalized coaching transforms your health by combining science-backed training with tailored nutrition plans designed for your unique goals.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 mb-8 justify-center">
              <Link
                href="/apply"
                className="group inline-flex items-center justify-center gap-2.5 bg-white/85 hover:bg-white text-black pl-4 pr-1.5 py-2 rounded-[20px] text-xs font-normal transition-all"
              >
                Get Started
                <span className="bg-black rounded-full p-1.5">
                  <ArrowRight className="w-3 h-3 text-white" />
                </span>
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center bg-[rgba(138,138,138,0.3)] hover:bg-[rgba(138,138,138,0.4)] text-white px-4 py-2 rounded-[20px] text-xs font-normal transition-colors backdrop-blur-sm shadow-[inset_0_0_6px_3px_rgba(138,138,138,0.3)]"
              >
                Learn More
              </a>
            </div>

            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">Trusted already by 500+</span> clients worldwide
            </p>
          </div>
        </div>
      </section>

      {/* Logo Marquee Section */}
      <section className="py-12 border-y border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-20 sm:px-24 lg:px-32 xl:px-[max(8rem,calc(50%-640px+8rem))] mb-8">
          <h2 className="text-center text-lg font-medium text-muted-foreground">
            Certified by leading fitness organizations
          </h2>
        </div>
        <div className="relative overflow-hidden">
          <div className="flex animate-marquee">
            {[...certifications, ...certifications].map((cert, index) => (
              <div
                key={index}
                className="flex-shrink-0 mx-8 flex items-center gap-2 text-muted-foreground"
              >
                <Award className="w-5 h-5 text-primary" />
                <span className="font-medium whitespace-nowrap">{cert}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase Card */}
      <section className="py-20 px-20 sm:px-24 lg:px-32 xl:px-[max(8rem,calc(50%-640px+8rem))]">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-card to-card border border-border">
            <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">
              <div className="flex flex-col justify-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  Simpler & More Effective
                </h2>
                <p className="text-muted-foreground mb-6">
                  Our coaching methodology combines cutting-edge sports science with practical, sustainable habits. No fad diets, no extreme workouts—just proven strategies that deliver lasting results.
                </p>
                <a
                  href="#features"
                  className="group inline-flex items-center gap-2 text-primary font-semibold hover:underline"
                >
                  Learn More
                  <ArrowRight className="w-4 h-4 arrow-hover" />
                </a>
              </div>
              <div className="relative">
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                    <LineChart className="w-12 h-12 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Benefits Section */}
      <section id="benefits" className="py-20 px-20 sm:px-24 lg:px-32 xl:px-[max(8rem,calc(50%-640px+8rem))] bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Train with Confidence. Backed by Science.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Large Card 1 */}
            <div className="md:col-span-2 lg:col-span-2 bg-card border border-border rounded-2xl p-8 glow-card">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Precision-Driven Training
                  </h3>
                  <p className="text-muted-foreground">
                    Every workout is guided by data and insights for smarter progress. Your program adapts based on your performance, recovery, and goals.
                  </p>
                </div>
                <div className="w-32 h-32 bg-gradient-to-br from-primary/30 to-primary/5 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-16 h-16 text-primary" />
                </div>
              </div>
            </div>

            {/* Small Card 1 */}
            <div className="bg-card border border-border rounded-2xl p-6 glow-card">
              <h3 className="text-lg font-bold text-foreground mb-2">
                Personalized Nutrition
              </h3>
              <p className="text-sm text-muted-foreground">
                Tailor your diet to achieve optimal performance with macro-calculated meal plans.
              </p>
            </div>

            {/* Small Card 2 */}
            <div className="bg-card border border-border rounded-2xl p-6 glow-card">
              <h3 className="text-lg font-bold text-foreground mb-2">
                Real-Time Progress Tracking
              </h3>
              <p className="text-sm text-muted-foreground">
                Adjusted instantly with your feedback to enhance training efficiency.
              </p>
            </div>

            {/* Large Card 2 */}
            <div className="md:col-span-2 lg:col-span-2 bg-card border border-border rounded-2xl p-8 glow-card">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Expert Coach Support
                  </h3>
                  <p className="text-muted-foreground">
                    A fully supported coaching system that saves you time and worry. Get answers when you need them and stay accountable with regular check-ins.
                  </p>
                </div>
                <div className="w-32 h-32 bg-gradient-to-br from-primary/30 to-primary/5 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-16 h-16 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features with Links Section */}
      <section id="features" className="py-20 px-20 sm:px-24 lg:px-32 xl:px-[max(8rem,calc(50%-640px+8rem))]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Your Fitness Journey Starts Here
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<LineChart className="w-8 h-8" />}
              title="Transparent Progress Tracking"
              description="Monitor your transformation with real-time, easy-to-read analytics and visual progress photos."
            />
            <FeatureCard
              icon={<UtensilsCrossed className="w-8 h-8" />}
              title="Seamless Meal Planning"
              description="Balance your nutrition across macros for better energy, recovery, and results."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Smart Program Adjustments"
              description="Your coach analyzes your feedback and progress to minimize plateaus and maximize gains."
            />
          </div>
        </div>
      </section>

      {/* 6-Item Feature Grid */}
      <section className="py-20 px-20 sm:px-24 lg:px-32 xl:px-[max(8rem,calc(50%-640px+8rem))] bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Stronger Results.
            </h2>
            <h2 className="text-3xl sm:text-4xl font-bold gradient-text">
              Better Life.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureItem
              icon={<LineChart className="w-6 h-6" />}
              title="Progress Tracking"
              description="Access your metrics in real-time to make timely and informed decisions about your training."
            />
            <FeatureItem
              icon={<Dumbbell className="w-6 h-6" />}
              title="Custom Workouts"
              description="Smart programming to maximize results and control fatigue effectively."
            />
            <FeatureItem
              icon={<UtensilsCrossed className="w-6 h-6" />}
              title="Nutrition Guidance"
              description="Live analytics provide clarity for every meal and macro decision."
            />
            <FeatureItem
              icon={<Calendar className="w-6 h-6" />}
              title="Weekly Check-ins"
              description="Seamless communication from question to answer, with precision and speed."
            />
            <FeatureItem
              icon={<Target className="w-6 h-6" />}
              title="Goal Setting"
              description="Your coach adjusts targets based on changing progress and lifestyle factors."
            />
            <FeatureItem
              icon={<Ruler className="w-6 h-6" />}
              title="Body Measurements"
              description="Monitor measurements in real-time with clear metrics and visual reporting."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-20 sm:px-24 lg:px-32 xl:px-[max(8rem,calc(50%-640px+8rem))]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Results You Can Measure
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StatCard value="95%" label="Client Retention Rate" />
            <StatCard value="500+" label="Clients Transformed" />
            <StatCard value="10K+" label="Workouts Completed" />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-20 sm:px-24 lg:px-32 xl:px-[max(8rem,calc(50%-640px+8rem))] bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Choose Your Plan
            </h2>
            <p className="text-muted-foreground">
              Select the coaching plan that fits your goals
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                billingPeriod === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                billingPeriod === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans[billingPeriod].map((plan) => (
              <PricingCard key={plan.name} plan={plan} period={billingPeriod} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-20 sm:px-24 lg:px-32 xl:px-[max(8rem,calc(50%-640px+8rem))] overflow-hidden">
        <div className="max-w-7xl mx-auto mb-12">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Trusted by Fitness Enthusiasts
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real stories from clients who&apos;ve transformed their health and fitness with personalized coaching.
            </p>
          </div>
        </div>

        {/* Testimonial Row 1 */}
        <div className="relative mb-6">
          <div className="flex animate-testimonial">
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </div>
        </div>

        {/* Testimonial Row 2 - Reverse */}
        <div className="relative">
          <div className="flex animate-testimonial-reverse">
            {[...testimonials.slice(3), ...testimonials.slice(0, 3), ...testimonials.slice(3), ...testimonials.slice(0, 3)].map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-20 sm:px-24 lg:px-32 xl:px-[max(8rem,calc(50%-640px+8rem))] bg-card/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              FAQ
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFaq === index}
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-20 sm:px-24 lg:px-32 xl:px-[max(8rem,calc(50%-640px+8rem))]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Start Your Transformation Today
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Harness the power of personalized coaching to achieve your fitness goals with confidence and clarity.
          </p>
          <Link
            href="/apply"
            className="group inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-all animate-pulse-glow"
          >
            Get Started
            <ArrowRight className="w-5 h-5 arrow-hover" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-20 sm:px-24 lg:px-32 xl:px-[max(8rem,calc(50%-640px+8rem))] border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Dumbbell className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-foreground">ZKF</span>
            </Link>

            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
              <span>&copy; {new Date().getFullYear()} ZKF. All rights reserved.</span>
              <div className="flex gap-4">
                <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                <a href="#" className="hover:text-foreground transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================
// Sub-Components
// ============================================

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
    <div className="bg-card border border-border rounded-2xl p-6 glow-card">
      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <a
        href="#"
        className="group inline-flex items-center gap-2 text-primary font-medium hover:underline"
      >
        Learn More
        <ArrowRight className="w-4 h-4 arrow-hover" />
      </a>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 p-4">
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-8 bg-card border border-border rounded-2xl">
      <p className="text-4xl sm:text-5xl font-bold text-primary mb-2">{value}</p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}

function PricingCard({
  plan,
  period,
}: {
  plan: (typeof pricingPlans.monthly)[0];
  period: "monthly" | "yearly";
}) {
  return (
    <div
      className={`relative bg-card border rounded-2xl p-8 ${
        plan.popular ? "border-primary" : "border-border"
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
          Best Value
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </div>

      <div className="mb-6">
        <span className="text-4xl font-bold text-foreground">${plan.price}</span>
        <span className="text-muted-foreground">/{period === "monthly" ? "mo" : "mo"}</span>
        {period === "yearly" && (
          <p className="text-xs text-muted-foreground mt-1">Billed annually</p>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            {feature.included ? (
              <Check className="w-5 h-5 text-primary" />
            ) : (
              <X className="w-5 h-5 text-muted-foreground/50" />
            )}
            <span
              className={
                feature.included ? "text-foreground" : "text-muted-foreground/50"
              }
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/apply"
        className={`group w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${
          plan.popular
            ? "bg-primary hover:bg-primary/90 text-primary-foreground"
            : "bg-card hover:bg-accent text-foreground border border-border"
        }`}
      >
        {plan.cta}
        <ArrowRight className="w-4 h-4 arrow-hover" />
      </Link>
    </div>
  );
}

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof testimonials)[0];
}) {
  return (
    <div className="flex-shrink-0 w-80 mx-3 bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
          {testimonial.avatar}
        </div>
        <div>
          <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
          <p className="text-xs text-muted-foreground">{testimonial.role}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{testimonial.quote}</p>
      <div className="flex gap-1 mt-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-primary text-primary" />
        ))}
      </div>
    </div>
  );
}

function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <h3 className="font-semibold text-foreground pr-4">{question}</h3>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div className={`accordion-content ${isOpen ? "open" : ""}`}>
        <div className="accordion-inner">
          <p className="px-6 pb-6 text-muted-foreground">{answer}</p>
        </div>
      </div>
    </div>
  );
}
