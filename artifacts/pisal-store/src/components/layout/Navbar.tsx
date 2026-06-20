import { Link, useLocation } from "wouter";
import { Search, ShoppingBag, User, Heart, Menu, X, LogOut, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { useLogo } from "@/hooks/useLogo";

export function Navbar() {
  const [location] = useLocation();
  const { user, setAuthModalOpen, logout, setCartDrawerOpen } = useAppStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const logoUrl = useLogo();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop Spices", href: "/products" },
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "backdrop-blur-xl bg-background/80 py-3 shadow-sm" : "bg-transparent py-4"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

          <button className="lg:hidden text-foreground p-1" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>

          <Link href="/" className="flex items-center gap-2 relative z-10">
            <img
              src={logoUrl}
              alt="PISAL"
              className="h-11 w-11 object-contain"
            />
            <img
              src="/pisal-text-logo.png"
              alt="PISAL Future Driven"
              className="hidden sm:block h-9 w-auto object-contain"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium hover:text-primary transition-colors relative ${location === link.href ? "text-primary" : "text-foreground/80"}`}
              >
                {link.name}
                {location === link.href && (
                  <motion.div layoutId="nav-indicator" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/products" className="text-foreground/70 hover:text-primary transition-colors hidden sm:block p-1">
              <Search className="w-5 h-5" />
            </Link>

            {user ? (
              <>
                <Link href="/wishlist" className="text-foreground/70 hover:text-primary transition-colors hidden sm:block p-1">
                  <Heart className="w-5 h-5" />
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger className="outline-none">
                    <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all duration-200">
                      <User className="w-4 h-4" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 shadow-2xl rounded-2xl p-1.5">
                    <div className="px-3 py-2.5">
                      <p className="text-sm font-semibold leading-none">{(user as any).user_metadata?.name || (user as any).name || "Customer"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{(user as any).email || (user as any).phone}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer w-full flex items-center rounded-xl">
                        <BarChart2 className="w-4 h-4 mr-2 text-primary" /> My Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer w-full flex items-center rounded-xl">
                        <User className="w-4 h-4 mr-2 text-primary" /> My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="cursor-pointer w-full flex items-center rounded-xl">
                        <ShoppingBag className="w-4 h-4 mr-2 text-primary" /> My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer rounded-xl">
                      <LogOut className="w-4 h-4 mr-2" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <button onClick={() => setCartDrawerOpen(true)} className="relative text-foreground/70 hover:text-primary transition-colors p-1">
                  <ShoppingBag className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setAuthModalOpen(true)} className="hidden sm:inline-flex text-foreground/80 hover:text-primary text-sm">
                  Log In
                </Button>
                <Button onClick={() => setAuthModalOpen(true)} className="bg-[#8B0000] hover:bg-[#6b0000] text-white rounded-full px-5 py-2 text-sm shadow-md">
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: -300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -300 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 w-[80vw] max-w-sm bg-card shadow-2xl z-[70] p-6 flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <img
                    src={logoUrl}
                    alt="PISAL"
                    className="h-10 w-10 object-contain"
                  />
                  <img
                    src="/pisal-text-logo.png"
                    alt="PISAL Future Driven"
                    className="h-9 w-auto object-contain"
                  />
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1"><X className="w-6 h-6" /></button>
              </div>

              <nav className="flex flex-col gap-1 text-base font-medium mb-8">
                {navLinks.map((link) => (
                  <Link key={link.name} href={link.href} onClick={() => setMobileMenuOpen(false)}
                    className={`py-3 px-3 rounded-xl transition-colors ${location === link.href ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"}`}>
                    {link.name}
                  </Link>
                ))}
                {user && (
                  <>
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="py-3 px-3 rounded-xl text-primary hover:bg-muted transition-colors font-medium">My Dashboard</Link>
                    <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="py-3 px-3 rounded-xl text-foreground hover:bg-muted transition-colors">My Orders</Link>
                    <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="py-3 px-3 rounded-xl text-foreground hover:bg-muted transition-colors">Wishlist</Link>
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="py-3 px-3 rounded-xl text-foreground hover:bg-muted transition-colors">Admin</Link>
                  </>
                )}
              </nav>

              {!user && (
                <div className="mt-auto">
                  <Button onClick={() => { setMobileMenuOpen(false); setAuthModalOpen(true); }} className="w-full bg-[#8B0000] hover:bg-[#6b0000] text-white rounded-xl h-12 font-medium">
                    Login / Sign Up
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
