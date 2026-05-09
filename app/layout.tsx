import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { CommandPaletteProvider } from '@/components/command-palette';
import { NavWithSearch } from '@/components/nav-with-search';

export const metadata: Metadata = {
  title: 'BeastMode – AP Psychology Study App',
  description: 'A polished, locally-running study tool for the AP Psychology exam.',
};

export const viewport: Viewport = {
  themeColor: '#0b1220',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <CommandPaletteProvider>
            <NavWithSearch />
            <main className="container py-6 md:py-10 animate-fade-in">{children}</main>
          </CommandPaletteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
