"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!message.trim() || loading) return;

    setLoading(true);
    setReply("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setReply(data.reply);
    } catch (error) {
      setReply(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    "Send an email separately to 25 sellers with their own names",
    "Clean this Excel file and remove duplicate seller IDs",
    "Create a weekly report from this Excel file",
    "Send personalized emails to everyone in this list",
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col">

        <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-blue-400">⚡</span> SmartWork
            </h1>
            <p className="text-sm text-slate-400">
              Your AI work automation assistant
            </p>
          </div>

          <button className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300">
            Settings
          </button>
        </header>

        <section className="flex flex-1 flex-col items-center px-6 py-16">

          <div className="mb-8 text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              What can I help you automate?
            </h2>

            <p className="mt-4 max-w-2xl text-slate-400">
              Tell SmartWork what you want to accomplish in normal language.
            </p>
          </div>

          <div className="w-full max-w-3xl">

            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-2xl">

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Tell me what you want to automate..."
                rows={4}
                className="w-full resize-none bg-transparent p-3 text-lg outline-none placeholder:text-slate-500"
              />

              <div className="flex items-center justify-between px-2 pb-1">

                <button className="rounded-lg px-3 py-2 text-sm text-slate-400">
                  + Add file
                </button>

                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || loading}
                  className="rounded-xl bg-blue-500 px-5 py-2.5 font-medium transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? "Thinking..." : "Start →"}
                </button>

              </div>
            </div>

            {reply && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="mb-3 text-sm font-semibold text-blue-400">
                  SmartWork
                </div>

                <div className="whitespace-pre-wrap leading-7 text-slate-200">
                  {reply}
                </div>
              </div>
            )}

            {!reply && (
              <div className="mt-6">
                <p className="mb-3 text-sm text-slate-500">
                  Try asking:
                </p>

                <div className="grid gap-2 sm:grid-cols-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setMessage(suggestion)}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm text-slate-300 transition hover:border-blue-400/40 hover:bg-white/[0.06]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>

        <footer className="border-t border-white/10 px-6 py-4 text-center text-xs text-slate-500">
          SmartWork • Automate repetitive work with AI
        </footer>

      </div>
    </main>
  );
}