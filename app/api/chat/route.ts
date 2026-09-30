import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const text = message.toLowerCase();

    let reply = "";

    if (
      text.includes("seller") &&
      (text.includes("email") || text.includes("mail"))
    ) {
      reply =
        "I can help you create personalized emails for your sellers.\n\n" +
        "Next, upload your Excel or CSV file containing the seller information. " +
        "I'll identify the seller name and email columns and prepare a personalized email for each seller.";
    } else if (
      text.includes("excel") ||
      text.includes("spreadsheet") ||
      text.includes("csv")
    ) {
      reply =
        "I can work with your Excel or CSV file.\n\n" +
        "Upload the file and I'll inspect the columns and help you automate the task.";
    } else if (
      text.includes("report") ||
      text.includes("weekly report")
    ) {
      reply =
        "I can help create a structured report from your data.\n\n" +
        "Upload the Excel or CSV file and tell me what information you want in the report.";
    } else if (
      text.includes("duplicate") ||
      text.includes("clean data")
    ) {
      reply =
        "I can help clean your data and identify duplicate records.\n\n" +
        "Upload your Excel or CSV file to continue.";
    } else {
      reply =
        "I understand your request.\n\n" +
        "I'm currently running in free local mode. Upload an Excel or CSV file if your task involves data, sellers, emails, or reports, and I'll help you automate it.";
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("SmartWork error:", error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}