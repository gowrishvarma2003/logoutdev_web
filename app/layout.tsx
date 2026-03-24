import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LogoutDev - Where Developers Build in Public",
  description: "A proof-of-work platform where developers share projects, collaborate on spaces, launch products, and get hired based on real contributions.",
  keywords: ["developer", "build in public", "collaboration", "projects", "open source", "freelance", "hiring"],
  openGraph: {
    title: "LogoutDev - Where Developers Build in Public",
    description: "A proof-of-work platform where developers share projects, collaborate, and get hired based on real contributions.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LogoutDev - Where Developers Build in Public",
    description: "A proof-of-work platform for developers to build, collaborate, and get discovered.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
