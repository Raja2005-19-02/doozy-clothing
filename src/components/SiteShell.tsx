"use client";
import AnnouncementBar from "./AnnouncementBar";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";
import Navbar from "./Navbar";
import PageTransition from "./PageTransition";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-ink-950">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1 mobile-bottom-pad">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
