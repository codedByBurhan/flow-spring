import { createFileRoute } from "@tanstack/react-router";
import { StubScreen } from "@/components/StubScreen";

export const Route = createFileRoute("/_app/report")({
  head: () => ({ meta: [{ title: "Report — FlowSpring" }] }),
  component: () => <StubScreen title="Report Incident" />,
});