"use client";

import { useState, useEffect, useRef } from "react";
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
  Plus,
  Twitter,
  Instagram,
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
  const [scrollRotation, setScrollRotation] = useState(0);
  const column1Ref = useRef<HTMLDivElement>(null);
  const column2Ref = useRef<HTMLDivElement>(null);

  // Scroll-based effects with requestAnimationFrame for smooth performance
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          // Slow rotation: 1 full rotation (360deg) per 10000px scroll
          const rotation = (scrollY / 10000) * 360;
          setScrollRotation(rotation);

          // Testimonial columns movement
          if (column1Ref.current) {
            column1Ref.current.style.transform = `translate3d(0, ${-scrollY * 0.15 + 50}px, 0)`;
          }
          if (column2Ref.current) {
            column2Ref.current.style.transform = `translate3d(0, ${scrollY * 0.15 - 800}px, 0)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll-triggered animations (replays on scroll)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          } else {
            // Remove class when element leaves viewport to replay animation
            entry.target.classList.remove('is-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Full-page background elements - fixed position, above triangles */}
      <div className="fixed inset-0 pointer-events-none z-[2]">
        {/* Dot grid pattern - throughout homepage, orange dots on top of triangles */}
        <div className="absolute inset-0 dot-pattern opacity-60" />
      </div>

      {/* Full-page grid lines - fixed position, above dot pattern */}
      <div className="fixed inset-0 pointer-events-none z-[3]">
        {/* Vertical lines (3) - from top to above footer */}
        <div className="absolute left-6 sm:left-9 lg:left-12 xl:left-[max(3rem,calc(50%-640px+3rem))] top-0 bottom-20 w-px hero-grid-line" />
        <div className="absolute left-1/2 top-0 bottom-20 w-px hero-grid-line" />
        <div className="absolute right-6 sm:right-9 lg:right-12 xl:right-[max(3rem,calc(50%-640px+3rem))] top-0 bottom-20 w-px hero-grid-line" />
        {/* Bottom horizontal line - above footer */}
        <div className="absolute left-0 right-0 bottom-20 h-px hero-grid-line" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-9 lg:px-12 xl:px-[max(3rem,calc(50%-640px+3rem))] relative z-[60]">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Dumbbell
                className="w-8 h-8 text-primary transition-transform duration-100"
                style={{ transform: `rotate(${scrollRotation}deg)` }}
              />
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
                className="hidden xl:inline-flex group items-center gap-2 bg-white/85 hover:bg-white text-gray-900 px-4 py-2 rounded-full font-medium transition-colors"
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
                <div className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
                  <span className="hamburger-line"></span>
                  <span className="hamburger-line"></span>
                  <span className="hamburger-line"></span>
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Mobile/Tablet/Small Desktop Menu - Two Layer Approach */}
        {mobileMenuOpen && (
          <>
            {/* Layer 1: Blur overlay - slides down like a curtain with delay */}
            <div
              className="xl:hidden mobile-menu-blur-overlay"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Layer 2: Menu content - appears immediately */}
            <div className="xl:hidden mobile-menu-content">
              <div className="flex flex-col gap-4 pt-20 pb-6 px-6 sm:px-9 lg:px-12">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="mobile-menu-item text-muted-foreground hover:text-foreground font-medium transition-colors px-2 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <Link
                  href="/login"
                  className="mobile-menu-item text-muted-foreground hover:text-foreground font-medium transition-colors px-2 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/apply"
                  className="mobile-menu-item inline-flex items-center justify-center gap-2 bg-white/85 hover:bg-white text-gray-900 px-4 py-3 rounded-full font-medium transition-colors mt-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen pt-32 pb-20 px-6 sm:px-9 lg:px-12 xl:px-[max(3rem,calc(50%-640px+3rem))] overflow-hidden">
        {/* Animated noise overlay - only for hero section */}
        <div className="absolute inset-0 pointer-events-none z-[4] overflow-hidden noise-container">
          <div className="noise-overlay" />
        </div>

        {/* Scrolling horizontal line below navbar */}
        <div className="absolute left-0 right-0 top-16 h-px hero-grid-line z-[5]" />

        {/* Meteor Streaks - Only in hero section */}
        <div className="absolute inset-0 pointer-events-none z-[5] overflow-hidden">
          <div className="meteor-streak meteor-1" />
          <div className="meteor-streak meteor-2" />
          <div className="meteor-streak meteor-3" />
          <div className="meteor-streak meteor-4" />
        </div>

        {/* Two Triangular Shapes with Rounded Corners Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              {/* Radial gradient for Triangle 1 - glowy orange */}
              <radialGradient id="triangleGradient1" cx="11%" cy="4%" r="80%" fx="11%" fy="4%">
                <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.8" />
                <stop offset="15%" stopColor="#FF4D00" stopOpacity="0.7" />
                <stop offset="40%" stopColor="#FF4D00" stopOpacity="0.4" />
                <stop offset="70%" stopColor="#CC3D00" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#171717" stopOpacity="0" />
              </radialGradient>

              {/* Radial gradient for Triangle 2 - glowy orange */}
              <radialGradient id="triangleGradient2" cx="89%" cy="96%" r="80%" fx="89%" fy="96%">
                <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.8" />
                <stop offset="15%" stopColor="#FF4D00" stopOpacity="0.7" />
                <stop offset="40%" stopColor="#FF4D00" stopOpacity="0.4" />
                <stop offset="70%" stopColor="#CC3D00" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#171717" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* ========== Triangle 1: Bottom-left ========== */}
            <path
              d="M 50,900 L 50,460 C 50,310 150,320 250,380 L 1119,900 Z"
              fill="url(#triangleGradient1)"
            />

            {/* ========== Triangle 2: Top-right ========== */}
            <path
              d="M 950,100 L 950,540 C 950,690 850,680 750,620 L -119,100 Z"
              fill="url(#triangleGradient2)"
            />
          </svg>
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

            <p className="text-base text-muted-foreground mb-8 max-w-xl mx-auto word-reveal">
              <span>Our </span>
              <span>personalized </span>
              <span>coaching </span>
              <span>transforms </span>
              <span>your </span>
              <span>health </span>
              <span>by </span>
              <span>combining </span>
              <span>science-backed </span>
              <span>training </span>
              <span>with </span>
              <span>tailored </span>
              <span>nutrition </span>
              <span>plans </span>
              <span>designed </span>
              <span>for </span>
              <span>your </span>
              <span>unique </span>
              <span>goals.</span>
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
        <div className="max-w-7xl mx-auto px-6 sm:px-9 lg:px-12 xl:px-[max(3rem,calc(50%-640px+3rem))] mb-8 animate-on-scroll">
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
      <section className="py-20 px-6 sm:px-9 lg:px-12 xl:px-[max(3rem,calc(50%-640px+3rem))]">
        <div className="max-w-7xl mx-auto animate-on-scroll">
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
      <section id="benefits" className="py-20 px-6 sm:px-9 lg:px-12 xl:px-[max(3rem,calc(50%-640px+3rem))] bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-on-scroll">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Train with Confidence. Backed by Science.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-on-scroll">
            {/* Large Card 1 */}
            <div className="md:col-span-2 lg:col-span-2 bg-card border border-border rounded-2xl p-8 glow-card-enhanced">
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
            <div className="bg-card border border-border rounded-2xl p-6 glow-card-enhanced">
              <h3 className="text-lg font-bold text-foreground mb-2">
                Personalized Nutrition
              </h3>
              <p className="text-sm text-muted-foreground">
                Tailor your diet to achieve optimal performance with macro-calculated meal plans.
              </p>
            </div>

            {/* Small Card 2 */}
            <div className="bg-card border border-border rounded-2xl p-6 glow-card-enhanced">
              <h3 className="text-lg font-bold text-foreground mb-2">
                Real-Time Progress Tracking
              </h3>
              <p className="text-sm text-muted-foreground">
                Adjusted instantly with your feedback to enhance training efficiency.
              </p>
            </div>

            {/* Large Card 2 */}
            <div className="md:col-span-2 lg:col-span-2 bg-card border border-border rounded-2xl p-8 glow-card-enhanced">
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
      <section id="features" className="py-20 px-6 sm:px-9 lg:px-12 xl:px-[max(3rem,calc(50%-640px+3rem))]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-on-scroll">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Your Fitness Journey Starts Here
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 animate-on-scroll">
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
      <section className="py-20 px-6 sm:px-9 lg:px-12 xl:px-[max(3rem,calc(50%-640px+3rem))] bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-on-scroll">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Stronger Results.
            </h2>
            <h2 className="text-3xl sm:text-4xl font-bold gradient-text">
              Better Life.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-on-scroll">
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
      <section className="py-20 px-6 sm:px-9 lg:px-12 xl:px-[max(3rem,calc(50%-640px+3rem))]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-on-scroll">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Results You Can Measure
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 animate-on-scroll">
            <StatCard value="95%" label="Client Retention Rate" />
            <StatCard value="500+" label="Clients Transformed" />
            <StatCard value="10K+" label="Workouts Completed" />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 sm:px-9 lg:px-12 xl:px-[max(3rem,calc(50%-640px+3rem))] bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 animate-on-scroll">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Choose Your Plan
            </h2>
            <p className="text-muted-foreground">
              Select the coaching plan that fits your goals
            </p>
          </div>

          {/* Billing Toggle - Pill Style */}
          <div className="flex items-center justify-center mb-12">
            <div className="pricing-toggle">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={billingPeriod === "monthly" ? "active" : "inactive"}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={billingPeriod === "yearly" ? "active" : "inactive"}
              >
                Yearly
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto animate-on-scroll">
            {pricingPlans[billingPeriod].map((plan) => (
              <PricingCard key={plan.name} plan={plan} period={billingPeriod} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-6 sm:px-9 lg:px-12 xl:px-[max(3rem,calc(50%-640px+3rem))] overflow-hidden">
        <div className="max-w-7xl mx-auto mb-12 animate-on-scroll">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Trusted by Fitness Enthusiasts
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real stories from clients who&apos;ve transformed their health and fitness with personalized coaching.
            </p>
          </div>
        </div>

        {/* Vertical Testimonial Columns */}
        <div className="relative h-[900px] overflow-hidden">
          <div className="flex gap-6 justify-center">
            {/* Column 1 - Moves up on scroll */}
            <div
              ref={column1Ref}
              className="flex flex-col gap-6 will-change-transform"
              style={{ transition: 'transform 0.1s linear' }}
            >
              {[...testimonials, ...testimonials, ...testimonials, ...testimonials].map((testimonial, index) => (
                <TestimonialCard key={`col1-${index}`} testimonial={testimonial} />
              ))}
            </div>

            {/* Column 2 - Moves down on scroll */}
            <div
              ref={column2Ref}
              className="flex flex-col gap-6 will-change-transform"
              style={{ transition: 'transform 0.1s linear' }}
            >
              {[...testimonials.slice(3), ...testimonials.slice(0, 3), ...testimonials, ...testimonials, ...testimonials].map((testimonial, index) => (
                <TestimonialCard key={`col2-${index}`} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 sm:px-9 lg:px-12 xl:px-[max(3rem,calc(50%-640px+3rem))] bg-card/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 animate-on-scroll">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              FAQ
            </h2>
          </div>

          <div className="space-y-4 animate-on-scroll">
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
      <section className="py-20 px-6 sm:px-9 lg:px-12 xl:px-[max(3rem,calc(50%-640px+3rem))]">
        <div className="max-w-4xl mx-auto animate-on-scroll">
          <div className="cta-gradient-card px-8 py-16 sm:px-12 sm:py-20 text-center relative z-10">
            {/* Noise overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl" style={{ opacity: 0.05, mixBlendMode: 'screen' }}>
              <div className="noise-overlay" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 relative z-10">
              Start Your Transformation Today
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto relative z-10">
              Harness the power of personalized coaching to achieve your fitness goals with confidence and clarity.
            </p>
            <Link
              href="/apply"
              className="btn-pill btn-pill-primary inline-flex relative z-10"
            >
              Get Started
              <span className="arrow-circle">
                <ArrowRight className="w-3 h-3 text-white" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 sm:px-9 lg:px-12 xl:px-[max(3rem,calc(50%-640px+3rem))] border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-8 animate-on-scroll">
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

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <a href="#" className="social-icon" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="social-icon" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
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
    <div className="bg-card border border-border rounded-2xl p-6 glow-card-enhanced">
      <div className="feature-icon-container mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <a
        href="#"
        className="btn-pill btn-pill-primary inline-flex text-xs"
      >
        Learn More
        <span className="arrow-circle">
          <ArrowRight className="w-3 h-3 text-white" />
        </span>
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
    <div className="flex flex-col sm:flex-row gap-4 p-4 items-center sm:items-start text-center sm:text-left">
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
    <div className="stats-card">
      <p className="stats-value">{value}</p>
      <p className="stats-label">{label}</p>
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
      className={`relative rounded-2xl p-8 ${
        plan.popular
          ? "pricing-card-premium"
          : "pricing-card-basic"
      }`}
    >
      {plan.popular && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
          <span className="best-value-badge">Best value</span>
        </div>
      )}

      {!plan.popular && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        </div>
      )}

      <div className="mb-6">
        <span className={`text-4xl font-bold ${plan.popular ? "text-white" : "text-foreground"}`}>
          ${plan.price}
        </span>
        <span className={plan.popular ? "text-white/80" : "text-muted-foreground"}>
          /{period === "monthly" ? "mo" : "mo"}
        </span>
        {period === "yearly" && (
          <p className={`text-xs mt-1 ${plan.popular ? "text-white/70" : "text-muted-foreground"}`}>
            Billed annually
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            {feature.included ? (
              <Check className={`w-5 h-5 ${plan.popular ? "text-white" : "text-primary"}`} />
            ) : (
              <X className={`w-5 h-5 ${plan.popular ? "text-white/40" : "text-muted-foreground/50"}`} />
            )}
            <span
              className={
                feature.included
                  ? (plan.popular ? "text-white" : "text-foreground")
                  : (plan.popular ? "text-white/40" : "text-muted-foreground/50")
              }
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/apply"
        className={`group w-full inline-flex items-center justify-center gap-2 py-3 rounded-full font-medium transition-all ${
          plan.popular
            ? "bg-white hover:bg-white/90 text-gray-900 px-6"
            : "btn-pill btn-pill-primary justify-center"
        }`}
      >
        {plan.cta}
        <span className={plan.popular ? "" : "arrow-circle"}>
          <ArrowRight className={`w-4 h-4 ${plan.popular ? "" : "text-white"}`} />
        </span>
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
    <div className="flex-shrink-0 w-72 sm:w-80 bg-card border border-border rounded-2xl p-6">
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
    <div className="bg-card border border-border rounded-xl overflow-hidden glow-card-enhanced">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <h3 className="font-semibold faq-question pr-4">{question}</h3>
        <Plus
          className={`w-5 h-5 text-primary faq-icon flex-shrink-0 ${
            isOpen ? "open" : ""
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
