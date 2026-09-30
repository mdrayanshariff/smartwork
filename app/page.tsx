"use client";

import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: process.env.NEXT_PUBLIC_WEB3FORMS_KEY,
          name: formData.name,
          email: formData.email,
          message: formData.message,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSubmitted(true);
        setFormData({ name: "", email: "", message: "" });
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      alert("Error submitting form. Please check your network connection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="text-xl font-bold tracking-wider text-blue-400">SMARTWORK</div>
        <div className="flex gap-4 text-sm text-slate-300">
          <Link href="/automations/bulk-email" className="hover:text-white transition">Bulk Email</Link>
          <Link href="/automations/pdf-to-excel" className="hover:text-white transition">PDF to Excel</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Smart Work Automation Suite
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Streamline your daily repetitive tasks with automated workflows, bulk email management, and document processing.
          </p>
        </section>

        {/* Feature Tools Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/automations/bulk-email" className="block p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 transition group">
            <div className="text-3xl mb-3">✉️</div>
            <h2 className="text-xl font-semibold group-hover:text-blue-400 transition">Bulk Email Tool</h2>
            <p className="text-slate-400 text-sm mt-2">
              Send personalized automated emails to customers or leads effortlessly.
            </p>
          </Link>

          <Link href="/automations/pdf-to-excel" className="block p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 transition group">
            <div className="text-3xl mb-3">📄</div>
            <h2 className="text-xl font-semibold group-hover:text-emerald-400 transition">PDF to Excel Converter</h2>
            <p className="text-slate-400 text-sm mt-2">
              Extract tabular data, invoices, and reports directly into structured Excel sheets.
            </p>
          </Link>
        </section>

        {/* Contact / Feature Request Form */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Have a Request or Query?</h2>
            <p className="text-slate-400 text-sm">Fill out the form below to contact us or request a new automation feature.</p>
          </div>

          {submitted ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center text-sm font-medium">
              ✓ Message sent successfully! We will get back to you shortly.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Your Email</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Message / Requested Feature</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe what tool or automation you need..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold hover:bg-blue-500 disabled:bg-slate-800 transition"
              >
                {submitting ? "Sending..." : "Submit Request"}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}