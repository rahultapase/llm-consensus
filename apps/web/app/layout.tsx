import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "katex/dist/katex.min.css";
import { ThemeProvider } from "@/components/theme/theme-provider";

export const metadata: Metadata = {
  title: "LLM Consensus",
  description: "Multi-model LLM council with consensus synthesis",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: { url: "/brain_black_128px.png", sizes: "128x128", type: "image/png" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="font-sans antialiased">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var c=document.cookie.match(/theme=([^;]+)/);var t=c?c[1]:'light';if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark')}else{document.documentElement.setAttribute('data-theme','light')}}catch(e){}})()`,
          }}
        />
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
