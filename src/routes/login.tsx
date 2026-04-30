import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
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
    <main className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <FlowSpringLogo size={64} />
          <h1 className="text-2xl font-bold text-primary mt-3">Welcome back</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-xl border">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">Create an account</Link>
          </p>
        </form>
      </div>
    </main>
  );
}