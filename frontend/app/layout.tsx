import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/layout/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Truzon CMS",
    template: "%s | Truzon CMS",
  },
  description: "Admin dashboard for the Truzon Homes CMS.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
