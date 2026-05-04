import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlowSpringLogo } from "@/components/FlowSpringLogo";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Sign Up — FlowSpring" }] }),
});

function SignupPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const pwdStrength = (() => {
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) s++;
    return s; // 0..4
  })();
  const strengthLabel = ["Too short", "Weak", "Okay", "Good", "Strong"][pwdStrength];
  const strengthColor = ["#E53935", "#E53935", "#FB8C00", "#43A047", "#2E7D32"][pwdStrength];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/home`,
        data: { display_name: displayName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session?.user) {
      await supabase.from("profiles").upsert({
        id: data.session.user.id,
        display_name: displayName.trim(),
      });
      toast.success("Account created — welcome to FlowSpring!");
      navigate({ to: "/home" });
      return;
    }
    toast.success("Account created. Check your email to verify, then log in.");
    navigate({ to: "/login" });
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div
        className="relative px-6 pt-8 pb-24"
        style={{
          background: "linear-gradient(135deg, #2E7D32 0%, #43A047 100%)",
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        <Link
          to="/"
          aria-label="Back"
          className="inline-grid place-items-center h-11 w-11 rounded-full bg-white/15 hover:bg-white/25 text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex flex-col items-center text-white mt-3">
          <FlowSpringLogo size={56} />
          <h1 className="text-2xl font-extrabold mt-3">Join FlowSpring</h1>
          <p className="text-xs opacity-90 mt-1">Create your account to start reporting</p>
        </div>
      </div>
      <div className="flex-1 px-6 -mt-12 pb-12">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm mx-auto space-y-4 bg-white p-6 rounded-2xl fs-shadow-card"
          style={{ border: "1px solid #F3F4F6" }}
        >
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-12"
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPwd ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 pr-12"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Hide password" : "Show password"}
                className="absolute right-1 top-1 h-10 w-10 grid place-items-center text-muted-foreground hover:text-foreground rounded-md"
              >
                {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1" aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full"
                      style={{
                        backgroundColor: i < pwdStrength ? strengthColor : "#E5E7EB",
                        transition: "background-color 200ms",
                      }}
                    />
                  ))}
                </div>
                <p className="text-[11px] font-medium" style={{ color: strengthColor }}>
                  {strengthLabel}
                </p>
              </div>
            )}
          </div>
          <Button
            type="submit"
            className="w-full h-12 fs-press fs-shadow-button gap-2"
            style={{ backgroundColor: "#2E7D32", color: "#fff" }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Creating…
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}