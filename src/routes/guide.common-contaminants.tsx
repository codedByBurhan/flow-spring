import { createFileRoute, Link } from "@tanstack/react-router";

const URL = "https://flow-spring.lovable.app/guide/common-contaminants";
const TITLE = "Directory of Common Water Contaminants";
const PAGE_TITLE = "Common Water Contaminants — FlowSpring";
const DESCRIPTION =
  "A directory of common water contamination and pollution sources — nitrates, lead, coliform, arsenic, chlorine byproducts — with visible indicators, health risks, and what to do.";

export const Route = createFileRoute("/guide/common-contaminants")({
  component: GuidePage,
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESCRIPTION,
          mainEntityOfPage: URL,
          author: { "@type": "Organization", name: "FlowSpring" },
          publisher: {
            "@type": "Organization",
            name: "FlowSpring",
            logo: {
              "@type": "ImageObject",
              url: "https://flow-spring.lovable.app/favicon.ico",
            },
          },
        }),
      },
    ],
  }),
});

interface Contaminant {
  name: string;
  sources: string;
  indicators: string;
  risks: string;
  action: string;
}

const CONTAMINANTS: Contaminant[] = [
  {
    name: "Lead",
    sources: "Corroded service lines, brass fixtures, lead solder in older plumbing.",
    indicators: "Usually invisible and tasteless. First-draw water after long stagnation has the highest levels.",
    risks: "Developmental delays in children, kidney damage, high blood pressure. No safe level.",
    action: "Use an NSF/ANSI 53 certified filter, flush taps for 30 seconds before drinking, request a service-line inspection.",
  },
  {
    name: "Nitrates",
    sources: "Agricultural runoff, septic systems, fertilizer leaching.",
    indicators: "Invisible; only detectable with a test strip or lab analysis.",
    risks: "Methemoglobinemia ('blue baby syndrome') in infants; possible thyroid effects.",
    action: "Use bottled or reverse-osmosis water for infants; switch sources if a test exceeds 10 mg/L (US MCL).",
  },
  {
    name: "Total Coliform & E. coli",
    sources: "Sewage cross-connections, broken mains, septic seepage into shallow wells.",
    indicators: "Sometimes cloudiness or odor; often no visible sign at all.",
    risks: "Gastrointestinal illness; E. coli indicates fecal contamination.",
    action: "Boil water for 1 minute before drinking, report the supply issue, and request upstream testing.",
  },
  {
    name: "Arsenic",
    sources: "Natural mineral deposits, mining runoff, some pesticides.",
    indicators: "Invisible and tasteless; requires lab testing.",
    risks: "Long-term exposure linked to skin lesions, cardiovascular disease, several cancers.",
    action: "Use reverse-osmosis or activated-alumina filtration certified for arsenic.",
  },
  {
    name: "Chlorine & chloramine byproducts",
    sources: "Municipal disinfection; reacts with organic matter to form trihalomethanes.",
    indicators: "Strong bleach or pool smell; chemical aftertaste.",
    risks: "Long-term exposure to byproducts is associated with elevated cancer risk.",
    action: "An activated-carbon filter at the tap removes most chlorine and its byproducts.",
  },
  {
    name: "Iron & manganese",
    sources: "Naturally occurring in groundwater; corroded iron pipes.",
    indicators: "Reddish-brown or black staining on fixtures, metallic taste, rusty water after stagnation.",
    risks: "Mostly aesthetic at low levels; high manganese exposure can affect neurological development.",
    action: "Oxidizing or greensand filters; whole-house treatment if levels are persistent.",
  },
  {
    name: "Hydrogen sulfide",
    sources: "Sulfate-reducing bacteria in wells or water heaters; some geologic sources.",
    indicators: "Strong rotten-egg smell, especially in hot water.",
    risks: "Corrosive to plumbing; irritant at high concentrations.",
    action: "Aeration, oxidation, or activated-carbon filtration; disinfect the water heater if smell is only in hot water.",
  },
  {
    name: "Hydrocarbons (oil, fuel, solvents)",
    sources: "Industrial spills, leaking underground tanks, illegal dumping.",
    indicators: "Oily sheen on the surface, fuel or solvent smell.",
    risks: "Many hydrocarbons are toxic or carcinogenic even at low exposure.",
    action: "Stop drinking immediately, switch to bottled water, and file a report so authorities can investigate the source.",
  },
];

function GuidePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <article className="max-w-2xl mx-auto prose prose-slate">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          {TITLE}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          A FlowSpring reference on water contamination and pollution
        </p>

        <p className="mt-6 text-base leading-relaxed">
          Water contamination and pollution take many forms — some you
          can see or smell, many you can't. This directory covers the
          contaminants most often found in tap and well water, the
          sources they come from, the indicators to watch for, the
          health risks they pose, and what to do if you find them.
        </p>

        <div className="mt-8 space-y-6">
          {CONTAMINANTS.map((c) => (
            <section key={c.name}>
              <h2 className="text-xl font-bold">{c.name}</h2>
              <dl className="mt-2 space-y-1 text-sm">
                <div>
                  <dt className="inline font-semibold">Sources: </dt>
                  <dd className="inline">{c.sources}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold">Visible indicators: </dt>
                  <dd className="inline">{c.indicators}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold">Health risks: </dt>
                  <dd className="inline">{c.risks}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold">What to do: </dt>
                  <dd className="inline">{c.action}</dd>
                </div>
              </dl>
            </section>
          ))}
        </div>

        <h2 className="text-xl font-bold mt-10">Report what you find</h2>
        <p>
          If you spot any of these indicators in your water, file a
          FlowSpring report so neighbors and authorities can act on it
          quickly.
        </p>
        <p className="mt-4 flex gap-3 flex-wrap">
          <Link
            to="/report"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Report a water incident
          </Link>
          <Link
            to="/guide/test-water"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            How to test your water
          </Link>
        </p>
      </article>
    </main>
  );
}