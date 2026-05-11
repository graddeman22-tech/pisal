import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { AuthModal } from "../shared/AuthModal";
import { WhatsAppButton } from "../shared/WhatsAppButton";
import { CartDrawer } from "../shared/CartDrawer";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar />
      <main className="flex-grow pt-[68px]">
        {children}
      </main>
      <Footer />
      <AuthModal />
      <WhatsAppButton />
      <CartDrawer />
    </div>
  );
}
