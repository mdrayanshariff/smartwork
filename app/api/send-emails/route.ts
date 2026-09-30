import { NextResponse } from "next/server";

// ⚠️ Replace this with your actual Google Apps Script Web App URL (must end with /exec)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxFjCOeaayqXTNLmC2mROAnu0IL8X7sTPrYci_hpP_R2eRKWw5qEH_9pN1vP6-krUoT/exec";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE")) {
      return NextResponse.json(
        { success: false, message: "Google Apps Script URL is missing in app/api/send-emails/route.ts" },
        { status: 400 }
      );
    }

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(body),
    });

    const rawText = await response.text();

    try {
      const data = JSON.parse(rawText);
      return NextResponse.json(data);
    } catch {
      console.error("Non-JSON response from Google Apps Script:", rawText);
      return NextResponse.json(
        {
          success: false,
          message: "Google Apps Script returned an unexpected response. Make sure the Web App is deployed as 'Anyone'.",
          rawResponse: rawText.substring(0, 300),
        },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("API Route Error:", err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Failed to connect to email backend." },
      { status: 500 }
    );
  }
}