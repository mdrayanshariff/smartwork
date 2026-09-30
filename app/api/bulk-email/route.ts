import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { google } from "googleapis";
import { authOptions } from "../auth/[...nextauth]/auth";

export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in with Google." },
        { status: 401 }
      );
    }

    const { emails } = await req.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { success: false, error: "No emails provided." },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const results = [];

    for (const emailObj of emails) {
      const { to, cc, subject, message, name } = emailObj;

      try {
        const rawMessage = [
          `To: ${to}`,
          cc ? `Cc: ${cc}` : "",
          `Subject: ${subject}`,
          "Content-Type: text/plain; charset=utf-8",
          "MIME-Version: 1.0",
          "",
          message,
        ]
          .filter(Boolean)
          .join("\n");

        const encodedMessage = Buffer.from(rawMessage)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        await gmail.users.messages.send({
          userId: "me",
          requestBody: { raw: encodedMessage },
        });

        results.push({ name: name || to, email: to, status: "sent" });
      } catch (err: any) {
        results.push({
          name: name || to,
          email: to,
          status: "failed",
          error: err.message,
        });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}