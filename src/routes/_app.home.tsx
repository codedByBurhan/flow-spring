import { createFileRoute } from "@tanstack/react-router";
import { StubScreen } from "@/components/StubScreen";

export const Route = createFileRoute("/_app/home")({
  head: () => ({ meta: [{ title: "Home — FlowSpring" }] }),
  component: () => <StubScreen title="Home" />,
});