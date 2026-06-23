import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edge IoT Dashboard",
  description: "Real-time 3D spatial IoT sensor dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0a0a0f", color: "#fff" }}>
        {children}
      </body>
    </html>
  );
}
