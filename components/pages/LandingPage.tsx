"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 dark:bg-slate-950/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 dark:supports-[backdrop-filter]:bg-slate-950/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              href="/"
              className="text-2xl font-bold text-foreground capitalize"
            >
              my hrms cloud
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/auth/login"
                className="text-sm px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors font-medium"
              >
                Log in
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden pb-4 space-y-3 border-t border-border pt-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block text-sm text-gray-600 hover:text-black transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 space-y-2 border-t border-border">
                <Link
                  href="/auth/login"
                  className="block text-sm px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors font-medium text-center"
                >
                  Log in
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pb-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              The All-in-One HR Platform
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed">
              Simplify your entire HR workflow. From payroll and employee
              management to analytics and compliance, my hrms cloud brings
              everything together in one powerful platform.
            </p>

            <p className="text-sm text-muted-foreground">
              Trusted by leading organizations worldwide.
            </p>
          </div>

          {/* Illustration */}
          <div className="relative h-96 md:h-full hidden md:flex items-center justify-center">
            <img
              src="/images/revenue_analysis.svg"
              alt="Financial Analytics for Payroll"
              className="w-full h-full max-w-md object-contain"
            />
          </div>
        </div>
      </section>

      {/* Mobile Illustration */}
      <div className="md:hidden px-4 py-12">
        <img
          src="/images/analytics.svg"
          alt="Analytics Dashboard"
          className="w-full h-auto max-w-sm"
        />
      </div>

      {/* Features Section */}
      <section id="features" className="bg-accent/5 dark:bg-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to streamline your HR operations and
              drive employee engagement.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Automated Payroll",
                description:
                  "Process payroll in minutes, not hours. Automated tax calculations, compliance updates, and secure disbursements.",
                icon: "https://img.icons8.com/fluency/96/money-bag.png",
              },
              {
                title: "Employee Lifecycle",
                description:
                  "Manage hire to retire. From onboarding to performance reviews, keep all employee data centralized.",
                icon: "https://img.icons8.com/fluency/96/employee-card.png",
              },
              {
                title: "Attendance & Leaves",
                description:
                  "Track attendance in real-time. Manage leave approvals, accruals, and maintain compliance effortlessly.",
                icon: "https://img.icons8.com/fluency/96/calendar.png",
              },
              {
                title: "Performance Management",
                description:
                  "Set goals, conduct reviews, and track employee growth with intuitive performance tools.",
                icon: "https://img.icons8.com/fluency/96/bar-chart.png",
              },
              {
                title: "Reporting & Analytics",
                description:
                  "Get actionable insights with advanced reports and dashboards for data-driven decisions.",
                icon: "https://img.icons8.com/fluency/96/business-report.png",
              },
              {
                title: "Compliance & Security",
                description:
                  "Stay compliant with labor laws. Bank-level security protects your sensitive employee data.",
                icon: "https://img.icons8.com/fluency/96/lock.png",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-8 rounded-lg border border-border bg-card hover:shadow-lg transition-all hover:border-primary/50 hover:-translate-y-1"
              >
                <img
                  src={feature.icon}
                  alt={feature.title}
                  className="w-16 h-16 mb-4"
                />
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>{" "}
        </div>{" "}
      </section>

      {/* Info Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Empower Your Organization
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            my hrms cloud is the modern HR management platform trusted by
            forward-thinking organizations. Streamline your processes, engage
            your workforce, and focus on what matters most.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-muted/30 dark:bg-muted/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Get in Touch
            </h2>
            <p className="text-lg text-muted-foreground">
              Have questions? We'd love to hear from you. Reach out to us via
              phone or WhatsApp.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <a
                href="tel:+1234567890"
                className="flex items-center gap-4 p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-all hover:border-primary/50 hover:-translate-y-1"
              >
                <img
                  src="https://img.icons8.com/fluency/96/phone.png"
                  alt="Phone"
                  className="w-12 h-12"
                />
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Call Us
                  </h3>
                  <p className="text-primary font-medium">+1 (234) 567-890</p>
                </div>
              </a>
              <a
                href="https://wa.me/1234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-all hover:border-primary/50 hover:-translate-y-1"
              >
                <img
                  src="https://img.icons8.com/fluency/96/whatsapp.png"
                  alt="WhatsApp"
                  className="w-12 h-12"
                />
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    WhatsApp
                  </h3>
                  <p className="text-primary font-medium">+1 (234) 567-890</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Copyright */}
      <div className="border-t border-border bg-card/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; 2026 my hrms cloud. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
