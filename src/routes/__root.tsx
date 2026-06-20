import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import { SplashScreen } from "@/components/SplashScreen";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FlowSpring · Water Safety Network" },
      {
        name: "description",
        content:
          "FlowSpring helps communities report unsafe water in 90 seconds. Live incident map, NGO dashboards, and SDG 6 alignment.",
      },
      { name: "author", content: "FlowSpring" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "FlowSpring" },
      { name: "twitter:card", content: "summary" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/20810fa4-fd50-49cf-9f4e-1a536a8ee01f" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/20810fa4-fd50-49cf-9f4e-1a536a8ee01f" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href:
          "data:image/svg+xml;utf8," +
          encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 120'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='#43A047'/><stop offset='100%' stop-color='#2E7D32'/></linearGradient></defs><path d='M50 5 C50 5, 15 50, 15 78 C15 99, 31 115, 50 115 C69 115, 85 99, 85 78 C85 50, 50 5, 50 5 Z' fill='url(#g)'/><path d='M35 75 C35 90, 45 100, 55 100' stroke='white' stroke-width='4' stroke-linecap='round' fill='none' opacity='0.9'/></svg>`,
          ),
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "FlowSpring",
          url: "https://flow-spring.lovable.app",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "FlowSpring",
          url: "https://flow-spring.lovable.app",
          logo: "https://flow-spring.lovable.app/favicon.ico",
          description:
            "FlowSpring is a community water safety network aligned with UN SDG 6, helping people report incidents and protect clean water access.",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <SplashScreen />
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
