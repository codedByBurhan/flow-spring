import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { FlowSpringLogo } from "@/components/FlowSpringLogo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Splash,
  head: () => ({
    meta: [
      { title: "FlowSpring — Community Water Safety Network · SDG 6" },
      {
        name: "description",
        content:
          "FlowSpring is a community water safety network aligned with UN SDG 6. Report unsafe water, view a live incident map, and protect clean water access.",
      },
      { property: "og:title", content: "FlowSpring — Community Water Safety Network" },
      {
        property: "og:description",
        content:
          "Report unsafe water in 90 seconds and see live community alerts on a shared map.",
      },
      { property: "og:url", content: "https://flow-spring.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://flow-spring.lovable.app/" }],
  }),
});

function Splash() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-white px-6 pt-[20vh] pb-12">
      <div className="flex flex-col items-center gap-5 max-w-sm w-full text-center">
        <div className="fs-spring-in">
          <FlowSpringLogo size={96} />
        </div>
        <h1
          className="fs-fade-up text-3xl font-extrabold tracking-tight"
          style={{ color: "#2E7D32", letterSpacing: "-0.5px", animationDelay: "200ms" }}
        >
          FlowSpring
          <span className="sr-only"> — Community Water Safety Network</span>
        </h1>
        <p
          className="fs-fade-up text-xs -mt-2"
          style={{ color: "#6B7280", animationDelay: "300ms" }}
        >
          Water Safety Network · SDG 6
        </p>
        <span className="fs-sdg-pill fs-fade-up" style={{ animationDelay: "400ms" }}>
          💧 Clean Water for All
        </span>
        <div
          className="w-full flex flex-col gap-3 mt-6 fs-fade-up"
          style={{ animationDelay: "550ms" }}
        >
          <Button
            asChild
            className="w-full fs-press fs-shadow-button"
            style={{ height: 52, backgroundColor: "#2E7D32", color: "#fff", borderRadius: 12 }}
          >
            <Link to="/signup">Get Started</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full fs-press"
            style={{
              height: 48,
              borderWidth: 1.5,
              borderColor: "#2E7D32",
              color: "#2E7D32",
              borderRadius: 12,
              background: "transparent",
            }}
          >
            <Link to="/login">Log In</Link>
          </Button>
          <Link
            to="/home"
            className="text-[13px] mt-2"
            style={{ color: "#6B7280" }}
          >
            Continue as Guest
          </Link>
        </div>
      </div>
    </main>
  );
}
