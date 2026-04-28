import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { FlowSpringLogo } from "@/components/FlowSpringLogo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Splash,
  head: () => ({
    meta: [
      { title: "FlowSpring — Water Safety Network · SDG 6" },
      {
        name: "description",
        content:
          "Community water safety reporting platform supporting UN SDG 6. Report incidents, view the map, and protect clean water access.",
      },
    ],
  }),
});

function Splash() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-6 py-12">
      <div className="flex flex-col items-center gap-6 max-w-md w-full text-center">
        <FlowSpringLogo size={128} />
        <div>
          <h1 className="text-4xl font-bold text-primary tracking-tight">FlowSpring</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Water Safety Network · SDG 6
          </p>
        </div>
        <div className="w-full flex flex-col gap-3 mt-4">
          <Button asChild size="lg" className="w-full">
            <Link to="/signup">Get Started</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full border-primary text-primary hover:bg-primary/5">
            <Link to="/login">Log In</Link>
          </Button>
          <Link
            to="/home"
            className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline mt-2"
          >
            Continue as Guest
          </Link>
        </div>
      </div>
    </main>
  );
}
