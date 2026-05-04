import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";

// Guests can browse Home, Map, and Profile. Routes that require auth
// (e.g. /report) gate themselves individually.
export const Route = createFileRoute("/_app")({
  component: AppLayout,
});