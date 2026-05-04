import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlowSpringLogo } from "@/components/FlowSpringLogo";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (search): { redirect?: string } => ({
    redirect:
      typeof search.redirect === "string" && search.redirect ? search.redirect : undefined,
  }),
  component: LoginPage,
  head: () => ({ meta: [{ title: "Log In — FlowSpring" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const redirectTo = search.redirect?.startsWith("/") ? search.redirect : "/home";
    await navigate({ to: redirectTo as never });
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
          <h1 className="text-2xl font-extrabold mt-3">Welcome back</h1>
          <p className="text-xs opacity-90 mt-1">Log in to continue protecting your community's water</p>
        </div>
      </div>
      <div className="flex-1 px-6 -mt-12 pb-12">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm mx-auto space-y-4 bg-white p-6 rounded-2xl fs-shadow-card"
          style={{ border: "1px solid #F3F4F6" }}
        >
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 pr-12"
                autoComplete="current-password"
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
          </div>
          <Button
            type="submit"
            className="w-full h-12 fs-press fs-shadow-button gap-2"
            style={{ backgroundColor: "#2E7D32", color: "#fff" }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Logging in…
              </>
            ) : (
              "Log In"
            )}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}