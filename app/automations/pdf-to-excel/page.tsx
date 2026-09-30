"use client";

import Link from "next/link";
import { useState } from "react";
import * as XLSX from "xlsx";

export default function PdfToExcelPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setDownloadReady(false);
    }
  }

  async function handleConvert() {
    if (!file) return;
    setProcessing(true);

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const extractedRows: string[][] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        let currentRow: string[] = [];
        let lastY: number | null = null;

        for (const item of textContent.items as any[]) {
          if (!item.str.trim()) continue;

          // Group text items by vertical position into spreadsheet rows
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            if (currentRow.length > 0) extractedRows.push(currentRow);
            currentRow = [];
          }
          currentRow.push(item.str.trim());
          lastY = item.transform[5];
        }
        if (currentRow.length > 0) extractedRows.push(currentRow);
      }

      if (extractedRows.length === 0) {
        alert("No readable text found in this PDF. It might be an image/scanned document.");
        setProcessing(false);
        return;
      }

      const worksheet = XLSX.utils.aoa_to_sheet(extractedRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Extracted PDF Data");

      const fileName = file.name.replace(/\.[^/.]+$/, "") + "_converted.xlsx";
      XLSX.writeFile(workbook, fileName);

      setDownloadReady(true);
    } catch (err) {
      console.error(err);
      alert("Error reading PDF file. Ensure it is a valid text PDF.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center text-xs text-blue-400 hover:text-blue-300">
          ← Back to SmartWork Suite
        </Link>

        <div className="space-y-2">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-2xl">
            📄
          </div>
          <h1 className="text-3xl font-bold">PDF to Excel Converter</h1>
          <p className="text-slate-400 text-sm">
            Extract actual text and tables from your PDF files directly into Excel `.xlsx` format.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 space-y-6">
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center space-y-3 bg-slate-950/50">
            <div className="text-3xl">📂</div>
            <div className="text-sm text-slate-300 font-medium">
              {file ? file.name : "Select or drag a PDF file here"}
            </div>
            
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="pdf-upload"
            />
            <label
              htmlFor="pdf-upload"
              className="inline-block rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 cursor-pointer"
            >
              Browse PDF
            </label>
          </div>

          <button
            onClick={handleConvert}
            disabled={!file || processing}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 transition-colors"
          >
            {processing ? "Extracting Text & Tables..." : "⚡ Convert PDF to Excel"}
          </button>

          {downloadReady && (
            <p className="text-xs text-emerald-400 text-center font-medium">
              ✓ File converted successfully! Your Excel sheet has been downloaded.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}