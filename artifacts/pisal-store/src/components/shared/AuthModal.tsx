import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useLogo } from "@/hooks/useLogo";

type Mode = "login" | "signup" | "verify";

export function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, setUser, setToken, setSession } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", name: "" });
  const { toast } = useToast();
  const logoUrl = useLogo();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  useEffect(() => {
    if (!isAuthModalOpen) {
      setForm({ email: "", password: "", confirmPassword: "", name: "" });
      setMode("login");
      setShowPassword(false);
    }
  }, [isAuthModalOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password)
      return toast({ title: "Please fill in all fields", variant: "destructive" });
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email, password: form.password,
      });
      if (error) throw error;
      if (data.user && data.session) {
        setUser(data.user);
        setToken(data.session.access_token);
        setSession(data.session);
        setAuthModalOpen(false);
        toast({ title: "Welcome back! 👋" });
      }
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password)
      return toast({ title: "Please fill in all fields", variant: "destructive" });
    if (form.password !== form.confirmPassword)
      return toast({ title: "Passwords don't match", variant: "destructive" });
    if (form.password.length < 6)
      return toast({ title: "Password must be at least 6 characters", variant: "destructive" });
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.name } },
      });
      if (error) throw error;
      if (data.user && data.session) {
        setUser(data.user);
        setToken(data.session.access_token);
        setSession(data.session);
        setAuthModalOpen(false);
        toast({ title: "Account created!", description: "Welcome to PISAL!" });
      } else {
        setMode("verify");
      }
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={setAuthModalOpen}>
      <DialogContent className="p-0 gap-0 max-w-sm rounded-2xl overflow-hidden border-0 shadow-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">PISAL Login</DialogTitle>

        {/* Top brand strip */}
        <div className="bg-white px-6 pt-7 pb-5 text-center">
          <img
            src={logoUrl}
            alt="PISAL"
            className="w-20 h-20 object-contain mx-auto mb-3"
            style={{ filter: "saturate(1.6) hue-rotate(-8deg) brightness(1.08) drop-shadow(0 0 10px rgba(212,175,55,0.55))" }}
          />
          <img
            src="/pisal-text-logo.png"
            alt="PISAL Future Driven"
            className="h-9 w-auto object-contain mx-auto"
          />
        </div>

        <div className="h-px bg-gray-100" />

        {/* Email verification success screen */}
        {mode === "verify" ? (
          <div className="bg-white px-6 py-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-500" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Check your email!</h3>
              <p className="text-sm text-gray-500 mt-1">
                We've sent a verification link to
              </p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{form.email}</p>
              <p className="text-xs text-gray-400 mt-3">
                Click the link in the email to activate your account, then come back to login.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full h-10 rounded-xl text-sm border-gray-200"
              onClick={() => setMode("login")}
            >
              Go to Login
            </Button>
            <button
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setAuthModalOpen(false)}
            >
              Close
            </button>
          </div>
        ) : (
          <div className="bg-white px-6 py-5 space-y-4">
            {/* Login / Sign Up tab row */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === "login" ? "bg-white shadow text-gray-900" : "text-gray-400"}`}
              >
                Login
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === "signup" ? "bg-white shadow text-gray-900" : "text-gray-400"}`}
              >
                Sign Up
              </button>
            </div>

            {/* LOGIN form */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    className="pl-9 h-10 rounded-xl border-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-amber-700/40"
                    value={form.email}
                    onChange={set("email")}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="pl-9 pr-10 h-10 rounded-xl border-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-amber-700/40"
                    value={form.password}
                    onChange={set("password")}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 rounded-xl bg-[#8B0000] hover:bg-[#6b0000] text-white text-sm font-semibold mt-1"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login"}
                </Button>
              </form>
            )}

            {/* SIGN UP form */}
            {mode === "signup" && (
              <form onSubmit={handleSignup} className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Full name"
                    className="pl-9 h-10 rounded-xl border-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-amber-700/40"
                    value={form.name}
                    onChange={set("name")}
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    className="pl-9 h-10 rounded-xl border-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-amber-700/40"
                    value={form.email}
                    onChange={set("email")}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password (min 6 chars)"
                    className="pl-9 pr-10 h-10 rounded-xl border-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-amber-700/40"
                    value={form.password}
                    onChange={set("password")}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    className="pl-9 h-10 rounded-xl border-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-amber-700/40"
                    value={form.confirmPassword}
                    onChange={set("confirmPassword")}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 rounded-xl bg-[#8B0000] hover:bg-[#6b0000] text-white text-sm font-semibold mt-1"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>
                <p className="text-[11px] text-gray-400 text-center pb-1">
                  📧 A verification email will be sent to confirm your account
                </p>
              </form>
            )}

            <button
              className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors pt-1 text-center"
              onClick={() => setAuthModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
