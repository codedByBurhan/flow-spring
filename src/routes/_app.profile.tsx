import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — FlowSpring" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold text-primary">Profile</h1>
      <p className="text-muted-foreground">{user?.email}</p>
      <Button
        onClick={async () => {
          await signOut();
          navigate({ to: "/login" });
        }}
      >
        Sign out
      </Button>
    </div>
  );
}