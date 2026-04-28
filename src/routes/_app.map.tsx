import { createFileRoute } from "@tanstack/react-router";
import { StubScreen } from "@/components/StubScreen";

export const Route = createFileRoute("/_app/map")({
  head: () => ({ meta: [{ title: "Map — FlowSpring" }] }),
  component: () => <StubScreen title="Map" />,
});