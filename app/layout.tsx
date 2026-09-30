import "./globals.css";
import Providers from "./Providers";

export const metadata = {
  title: "Smart Work",
  description: "Automations App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
