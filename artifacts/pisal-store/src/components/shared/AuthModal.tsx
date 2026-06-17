import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, Phone, Eye, EyeOff, X } from "lucide-react";
import { useLogo } from "@/hooks/useLogo";

type Method = "email" | "phone";
type Mode = "login" | "signup";

export function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, setUser, setToken, setSession } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [method, setMethod] = useState<Method>("email");
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [form, setForm] = useState({ email: "", phone: "", password: "", confirmPassword: "", name: "" });
  const { toast } = useToast();
  const logoUrl = useLogo();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  useEffect(() => {
    if (!isAuthModalOpen) {
      setForm({ email: "", phone: "", password: "", confirmPassword: "", name: "" });
      setOtpSent(false);
      setOtp("");
      setMode("login");
      setMethod("email");
    }
  }, [isAuthModalOpen]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast({ title: "Fill in all fields", variant: "destructive" });
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) throw error;
      if (data.user && data.session) {
        setUser(data.user); setToken(data.session.access_token); setSession(data.session);
        setAuthModalOpen(false);
        toast({ title: "Welcome back!" });
      }
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.name) return toast({ title: "Fill in all fields", variant: "destructive" });
    if (form.password !== form.confirmPassword) return toast({ title: "Passwords don't match", variant: "destructive" });
    if (form.password.length < 6) return toast({ title: "Password must be 6+ characters", variant: "destructive" });
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { name: form.name, phone: form.phone } }
      });
      if (error) throw error;
      if (data.user && data.session) {
        setUser(data.user); setToken(data.session.access_token); setSession(data.session);
        setAuthModalOpen(false);
        toast({ title: "Account created!", description: "You are now logged in" });
      } else {
        toast({ title: "Verify your email", description: "Check your inbox to confirm your account" });
      }
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone) return toast({ title: "Enter your phone number", variant: "destructive" });
    setIsLoading(true);
    try {
      const phone = form.phone.startsWith("+") ? form.phone : "+91" + form.phone.replace(/\D/g, "");
      await supabase.auth.signInWithOtp({ phone });
      setOtpSent(true);
      toast({ title: "OTP sent!", description: "Check your SMS" });
    } catch (err: any) {
      toast({ title: "Failed to send OTP", description: err.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return toast({ title: "Enter OTP", variant: "destructive" });
    setIsLoading(true);
    try {
      const phone = form.phone.startsWith("+") ? form.phone : "+91" + form.phone.replace(/\D/g, "");
      const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
      if (error) throw error;
      if (data.user && data.session) {
        setUser(data.user); setToken(data.session.access_token); setSession(data.session);
        setAuthModalOpen(false);
        toast({ title: "Phone verified! Welcome!" });
      }
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={setAuthModalOpen}>
      <DialogContent className="p-0 gap-0 max-w-sm rounded-2xl overflow-hidden border-0 shadow-2xl">
        {/* Header */}
        <div className="bg-white px-6 pt-8 pb-5 text-center border-b border-gray-100 relative">
          <button
            onClick={() => setAuthModalOpen(false)}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <img src={logoUrl} alt="PISAL" className="w-16 h-16 rounded-full object-contain bg-black mx-auto mb-3 shadow-md" />
          <h2 className="text-xl font-bold text-gray-900">Welcome to PISAL</h2>
          <p className="text-xs text-gray-400 mt-0.5">Pure Taste of India</p>
        </div>

        <div className="bg-white px-6 py-5 space-y-5">
          {/* Method switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {(["email", "phone"] as Method[]).map(m => (
              <button key={m} onClick={() => { setMethod(m); setOtpSent(false); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${method === m ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
                {m === "email" ? "📧 Email" : "📱 Phone"}
              </button>
            ))}
          </div>

          {/* Email flow */}
          {method === "email" && (
            <>
              {/* Login / Sign Up toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                {(["login", "signup"] as Mode[]).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === m ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
                    {m === "login" ? "Login" : "Sign Up"}
                  </button>
                ))}
              </div>

              {mode === "login" ? (
                <form onSubmit={handleEmailLogin} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input type="email" placeholder="Email address" className="pl-9 h-10 rounded-xl border-gray-200 text-sm"
                      value={form.email} onChange={set("email")} disabled={isLoading} />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input type={showPassword ? "text" : "password"} placeholder="Password" className="pl-9 pr-10 h-10 rounded-xl border-gray-200 text-sm"
                      value={form.password} onChange={set("password")} disabled={isLoading} />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button type="submit" disabled={isLoading}
                    className="w-full h-10 rounded-xl bg-[#8B0000] hover:bg-[#6b0000] text-white text-sm font-semibold">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleEmailSignup} className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input type="text" placeholder="Full name" className="pl-9 h-10 rounded-xl border-gray-200 text-sm"
                      value={form.name} onChange={set("name")} disabled={isLoading} />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input type="email" placeholder="Email address" className="pl-9 h-10 rounded-xl border-gray-200 text-sm"
                      value={form.email} onChange={set("email")} disabled={isLoading} />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input type="tel" placeholder="Phone (optional)" className="pl-9 h-10 rounded-xl border-gray-200 text-sm"
                      value={form.phone} onChange={set("phone")} disabled={isLoading} />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input type={showPassword ? "text" : "password"} placeholder="Password (6+ chars)" className="pl-9 pr-10 h-10 rounded-xl border-gray-200 text-sm"
                      value={form.password} onChange={set("password")} disabled={isLoading} />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input type={showPassword ? "text" : "password"} placeholder="Confirm password" className="pl-9 h-10 rounded-xl border-gray-200 text-sm"
                      value={form.confirmPassword} onChange={set("confirmPassword")} disabled={isLoading} />
                  </div>
                  <Button type="submit" disabled={isLoading}
                    className="w-full h-10 rounded-xl bg-[#8B0000] hover:bg-[#6b0000] text-white text-sm font-semibold">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                  </Button>
                  <p className="text-xs text-gray-400 text-center">A verification link will be sent to your email</p>
                </form>
              )}
            </>
          )}

          {/* Phone flow */}
          {method === "phone" && (
            !otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input type="tel" placeholder="+91 9876543210" className="pl-9 h-10 rounded-xl border-gray-200 text-sm"
                    value={form.phone} onChange={set("phone")} disabled={isLoading} />
                </div>
                <Button type="submit" disabled={isLoading}
                  className="w-full h-10 rounded-xl bg-[#8B0000] hover:bg-[#6b0000] text-white text-sm font-semibold">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
                </Button>
                <p className="text-xs text-gray-400 text-center">We'll send a 6-digit OTP via SMS</p>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <p className="text-sm text-gray-500 text-center">OTP sent to <span className="font-medium text-gray-700">{form.phone}</span></p>
                <Input type="text" placeholder="Enter 6-digit OTP" maxLength={6} inputMode="numeric"
                  className="h-12 rounded-xl border-gray-200 text-center text-xl tracking-widest font-bold"
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} disabled={isLoading} />
                <Button type="submit" disabled={isLoading || otp.length < 6}
                  className="w-full h-10 rounded-xl bg-[#8B0000] hover:bg-[#6b0000] text-white text-sm font-semibold">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify OTP"}
                </Button>
                <button type="button" onClick={() => setOtpSent(false)} className="w-full text-xs text-gray-400 hover:text-gray-600 text-center">
                  ← Change number
                </button>
              </form>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
