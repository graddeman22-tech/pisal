import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import { useLogo } from "@/hooks/useLogo";

export function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, setUser, setToken, setSession } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const logoUrl = useLogo();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '', phone: '', password: '', name: '', confirmPassword: ''
  });
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: formData.email, password: formData.password });
      if (error) throw error;
      if (data.user && data.session) {
        setUser(data.user);
        setToken(data.session.access_token);
        setSession(data.session);
        setAuthModalOpen(false);
        toast({ title: "Welcome back!", description: "Successfully logged in" });
      }
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (formData.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { name: formData.name, phone: formData.phone } }
      });
      if (error) throw error;
      if (data.user && data.session) {
        setUser(data.user);
        setToken(data.session.access_token);
        setSession(data.session);
        setAuthModalOpen(false);
        toast({ title: "Account created!", description: "Successfully registered and logged in" });
      } else {
        toast({ title: "Registration successful", description: "Please check your email to verify your account" });
      }
    } catch (error: any) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone) {
      toast({ title: "Error", description: "Please enter your phone number", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await supabase.auth.signInWithOtp({ phone: formData.phone });
      toast({ title: "OTP Sent", description: "Please check your phone for the verification code" });
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthModalOpen) {
      setFormData({ email: '', phone: '', password: '', name: '', confirmPassword: '' });
    }
  }, [isAuthModalOpen]);

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={setAuthModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center gap-2 pb-2">
          <img src={logoUrl} alt="PISAL" className="w-20 h-20 rounded-full object-contain bg-black shadow-lg border border-amber-700/40" />
          <DialogTitle className="text-center text-xl font-bold">Welcome to PISAL</DialogTitle>
          <p className="text-xs text-muted-foreground text-center -mt-1">Pure Taste of India</p>
        </DialogHeader>
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
          </TabsList>
          <TabsContent value="email" className="space-y-4 pt-2">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleEmailLogin} className="space-y-4 pt-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="email" name="email" type="email" placeholder="Enter your email" className="pl-10"
                        value={formData.email} onChange={handleInputChange} disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password"
                        className="pl-10 pr-10" value={formData.password} onChange={handleInputChange} disabled={isLoading} />
                      <button type="button" className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(s => !s)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-[#8B0000] hover:bg-[#6b0000] text-white" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Login
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleEmailSignup} className="space-y-4 pt-3">
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input name="name" type="text" placeholder="Your full name" className="pl-10"
                        value={formData.name} onChange={handleInputChange} disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input name="email" type="email" placeholder="Enter your email" className="pl-10"
                        value={formData.email} onChange={handleInputChange} disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input name="password" type={showPassword ? "text" : "password"} placeholder="Create a password"
                        className="pl-10 pr-10" value={formData.password} onChange={handleInputChange} disabled={isLoading} />
                      <button type="button" className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(s => !s)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input name="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Confirm password"
                        className="pl-10" value={formData.confirmPassword} onChange={handleInputChange} disabled={isLoading} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-[#8B0000] hover:bg-[#6b0000] text-white" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </TabsContent>
          <TabsContent value="phone">
            <form onSubmit={handlePhoneLogin} className="space-y-4 pt-3">
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input name="phone" type="tel" placeholder="+91 9876543210" className="pl-10"
                    value={formData.phone} onChange={handleInputChange} disabled={isLoading} />
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#8B0000] hover:bg-[#6b0000] text-white" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send OTP
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
