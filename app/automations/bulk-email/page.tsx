"use client";

import Link from "next/link";
import * as XLSX from "xlsx";
import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

type Seller = Record<string, string>;

type SendResult = {
  name: string;
  email: string;
  status: "sent" | "draft_created" | "failed";
  error?: string;
};

export default function BulkEmailPage() {
  const { data: session, status } = useSession();

  const [mailSheetData, setMailSheetData] = useState<Seller[]>([]);
  const [dataSheetRows, setDataSheetRows] = useState<Seller[]>([]);

  const [mailHeaders, setMailHeaders] = useState<string[]>([]);
  const [dataHeaders, setDataHeaders] = useState<string[]>([]);

  const [nameColumn, setNameColumn] = useState("");
  const [emailColumn, setEmailColumn] = useState("");
  const [matchColumnMail, setMatchColumnMail] = useState("");
  const [matchColumnData, setMatchColumnData] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [testEmailAddress, setTestEmailAddress] = useState("");

  const [subject, setSubject] = useState("Important Updates for {{name}}");
  const [message, setMessage] = useState(
    `Hi {{name}},\n\nPlease find attached your updated data report.\n\nLet us know if you have any questions.\n\nBest regards,\nSmartWork Team`
  );

  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<SendResult[]>([]);

  function downloadSampleTemplate() {
    const wb = XLSX.utils.book_new();

    const mailData = [
      { "Seller ID": "S001", "Brand Name": "Puma", "Email": "puma@example.com" },
      { "Seller ID": "S002", "Brand Name": "Nike", "Email": "nike@example.com" },
    ];
    const ws1 = XLSX.utils.json_to_sheet(mailData);
    XLSX.utils.book_append_sheet(wb, ws1, "Mail");

    const customData = [
      { "Seller ID": "S001", "MRP Style": "Style-A", "Price": 1200, "GMV": "50K" },
      { "Seller ID": "S001", "MRP Style": "Style-B", "Price": 1800, "GMV": "80K" },
      { "Seller ID": "S002", "MRP Style": "Style-X", "Price": 2500, "GMV": "120K" },
    ];
    const ws2 = XLSX.utils.json_to_sheet(customData);
    XLSX.utils.book_append_sheet(wb, ws2, "Data");

    XLSX.writeFile(wb, "SmartWork_BulkEmail_Template.xlsx");
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setGenerated(false);
    setSendResults([]);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      if (workbook.SheetNames.length === 0) {
        setError("Workbook is empty.");
        return;
      }

      // Read Sheet 1 (Mail)
      const sheet1Name = workbook.SheetNames[0];
      const sheet1 = workbook.Sheets[sheet1Name];
      const mailRows = XLSX.utils.sheet_to_json<Seller>(sheet1, { defval: "" });

      if (!mailRows.length) {
        setError("Sheet 1 (Mail) contains no data.");
        return;
      }

      const mHeaders = Object.keys(mailRows[0]);
      setMailHeaders(mHeaders);
      setMailSheetData(mailRows);

      setNameColumn(mHeaders.find((h) => /name|seller|brand/i.test(h)) || mHeaders[0]);
      setEmailColumn(mHeaders.find((h) => /email|mail/i.test(h)) || mHeaders[1] || mHeaders[0]);
      setMatchColumnMail(mHeaders.find((h) => /id|brand|seller/i.test(h)) || mHeaders[0]);

      // Read Sheet 2 (Data)
      if (workbook.SheetNames.length > 1) {
        const sheet2Name = workbook.SheetNames[1];
        const sheet2 = workbook.Sheets[sheet2Name];
        const dataRows = XLSX.utils.sheet_to_json<Seller>(sheet2, { defval: "" });

        if (dataRows.length > 0) {
          const dHeaders = Object.keys(dataRows[0]);
          setDataHeaders(dHeaders);
          setDataSheetRows(dataRows);
          setMatchColumnData(dHeaders.find((h) => /id|brand|seller/i.test(h)) || dHeaders[0]);
        }
      } else {
        setDataSheetRows([]);
        setDataHeaders([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to parse Excel file.");
    }
  }

  function getSellerDataRows(seller: Seller) {
    if (!dataSheetRows.length || !matchColumnMail || !matchColumnData) return [];
    const matchVal = String(seller[matchColumnMail] || "").trim().toLowerCase();
    return dataSheetRows.filter(
      (row) => String(row[matchColumnData] || "").trim().toLowerCase() === matchVal
    );
  }

  function generateBase64Excel(rows: Seller[], fileName: string) {
    if (!rows || rows.length === 0) return null;
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data_Report");
    const base64 = XLSX.write(workbook, { bookType: "xlsx", type: "base64" });
    return {
      filename: `${fileName.replace(/[^a-z0-9]/gi, "_")}_Data.xlsx`,
      content: base64,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }

  function personalize(template: string, seller: Seller) {
    let result = template;
    mailHeaders.forEach((h) => {
      const val = String(seller[h] || "");
      result = result.replace(new RegExp(`{{\\s*${h}\\s*}}`, "gi"), val);
    });
    result = result
      .replace(/{{\s*name\s*}}/gi, String(seller[nameColumn] || ""))
      .replace(/{{\s*email\s*}}/gi, String(seller[emailColumn] || ""));
    return result;
  }

  async function processEmails(action: "send" | "draft", singleRecipientOverride?: string) {
    if (!session) {
      setError("Please sign in with Google first before sending emails.");
      return;
    }

    if (sending || !mailSheetData.length) return;

    setSending(true);
    setError("");
    setSendResults([]);

    try {
      const targetSellers = singleRecipientOverride
        ? [mailSheetData[0]] // Test with 1st seller's data payload
        : mailSheetData;

      const payload = {
        action: action,
        emails: targetSellers.map((seller) => {
          const sellerName = String(seller[nameColumn] || "");
          const matchingRows = getSellerDataRows(seller);
          const attachment = generateBase64Excel(matchingRows, sellerName);

          return {
            name: sellerName,
            to: singleRecipientOverride || String(seller[emailColumn] || ""),
            cc: ccEmail.trim(),
            subject: (singleRecipientOverride ? "[TEST] " : "") + personalize(subject, seller),
            message: personalize(message, seller),
            attachment: attachment,
          };
        }),
      };

      const response = await fetch("/api/bulk-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to process emails via server API.");
      }

      setSendResults(data.results || []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error processing request.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-sm text-slate-400 hover:text-white">← Back to SmartWork</Link>

          {/* Google Auth Status Badge */}
          {session ? (
            <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 rounded-full px-4 py-1.5 text-xs">
              {session.user?.image && (
                <img src={session.user.image} alt="User Avatar" className="w-5 h-5 rounded-full" />
              )}
              <span className="text-slate-300">{session.user?.email}</span>
              <button
                onClick={() => signOut()}
                className="text-red-400 hover:text-red-300 font-semibold ml-2"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors flex items-center gap-2"
            >
              🔑 Sign In with Google
            </button>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold">Personalized Bulk Email</h1>
          <p className="text-slate-400 mt-1">Upload multi-sheet Excel files to attach seller-specific reports directly.</p>
        </div>

        {!session && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 flex items-center justify-between text-sm text-blue-200">
            <span>Please sign in with Google to send emails directly from your Gmail account.</span>
            <button
              onClick={() => signIn("google")}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition"
            >
              Sign In Now
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* 1. File Upload */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <h2 className="text-lg font-semibold">1. Upload Multi-Sheet Excel</h2>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-500 cursor-pointer"
          />
          <button
            onClick={downloadSampleTemplate}
            className="text-xs text-blue-400 underline hover:text-blue-300 block pt-1"
          >
            📥 Download Sample 2-Sheet Excel Template
          </button>
        </section>

        {mailSheetData.length > 0 && (
          <>
            {/* 2. Column Mapping */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h2 className="text-lg font-semibold">2. Column Mapping</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Seller Name Column (Sheet 1)</label>
                  <select
                    value={nameColumn}
                    onChange={(e) => setNameColumn(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm text-white"
                  >
                    {mailHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Email Column (Sheet 1)</label>
                  <select
                    value={emailColumn}
                    onChange={(e) => setEmailColumn(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm text-white"
                  >
                    {mailHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              {dataSheetRows.length > 0 && (
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Sheet 1 Key Column (Linking ID)</label>
                    <select
                      value={matchColumnMail}
                      onChange={(e) => setMatchColumnMail(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm text-white"
                    >
                      {mailHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Sheet 2 Key Column (Linking ID)</label>
                    <select
                      value={matchColumnData}
                      onChange={(e) => setMatchColumnData(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm text-white"
                    >
                      {dataHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </section>

            {/* 3. Template & Settings */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h2 className="text-lg font-semibold">3. Email Template</h2>

              <div>
                <label className="text-xs text-slate-400 block mb-1">CC Email (Optional)</label>
                <input
                  type="email"
                  placeholder="manager@company.com"
                  value={ccEmail}
                  onChange={(e) => setCcEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Message Body (Supports {"{{name}}"}, {"{{email}}"}, etc.)</label>
                <textarea
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 font-mono text-sm text-white"
                />
              </div>

              <button
                onClick={() => setGenerated(true)}
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium hover:bg-blue-500 text-white transition-colors"
              >
                Generate Previews & Attachments
              </button>
            </section>

            {/* 4. Preview, Test & Send */}
            {generated && (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
                <h2 className="text-lg font-semibold">4. Review & Verification</h2>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {mailSheetData.map((seller, idx) => {
                    const matchedRows = getSellerDataRows(seller);
                    return (
                      <div key={idx} className="rounded-lg bg-slate-950 p-4 border border-slate-800 space-y-1">
                        <div className="flex justify-between text-sm font-semibold">
                          <span>{String(seller[nameColumn] || "Unknown")}</span>
                          <span className="text-xs font-normal text-slate-400">{String(seller[emailColumn] || "")}</span>
                        </div>
                        <div className="text-xs text-blue-400">
                          📎 Attachment: {matchedRows.length > 0 ? `${matchedRows.length} data rows matched` : "No data attached"}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Single Test / Verification Options */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-amber-300">🧪 Verify Before Bulk Sending</h3>
                  <p className="text-xs text-slate-300">
                    Send a single test email (using 1st seller's data) to your own email address to check formatting and inspect the Excel attachment.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Enter your personal email to test..."
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-white"
                    />
                    <button
                      onClick={() => processEmails("send", testEmailAddress)}
                      disabled={sending || !testEmailAddress.trim()}
                      className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium hover:bg-amber-500 disabled:bg-slate-700 text-white"
                    >
                      Send Test Email
                    </button>
                    <button
                      onClick={() => processEmails("draft", testEmailAddress)}
                      disabled={sending || !testEmailAddress.trim()}
                      className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-600 disabled:bg-slate-800 text-white"
                    >
                      Save as Draft in Gmail
                    </button>
                  </div>
                </div>

                {/* Final Bulk Send */}
                <button
                  onClick={() => processEmails("send")}
                  disabled={sending || !session}
                  className="w-full rounded-lg bg-green-600 px-6 py-3 font-semibold hover:bg-green-500 disabled:bg-slate-700 text-white transition-colors"
                >
                  {sending ? "⏳ Processing..." : "🚀 Send All Emails to All Sellers"}
                </button>

                {sendResults.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {sendResults.map((r, i) => (
                      <div key={i} className="flex justify-between items-center rounded-lg bg-slate-950 p-3 text-sm border border-slate-800">
                        <div>
                          <div className="font-semibold">{r.name}</div>
                          <div className="text-xs text-slate-400">{r.email}</div>
                          {r.error && <div className="text-xs text-red-400">{r.error}</div>}
                        </div>
                        <span className={
                          r.status === "sent" 
                            ? "text-green-400 font-bold" 
                            : r.status === "draft_created" 
                            ? "text-amber-400 font-bold" 
                            : "text-red-400 font-bold"
                        }>
                          {r.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}