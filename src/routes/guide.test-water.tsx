import { createFileRoute, Link } from "@tanstack/react-router";

const URL = "https://flow-spring.lovable.app/guide/test-water";
const TITLE = "How to Test Your Home Water Quality and Understand the Results";
const DESCRIPTION =
  "A practical guide to testing your home water quality — what to look, smell, and test for, how to read a water quality report, and what to do next.";

export const Route = createFileRoute("/guide/test-water")({
  component: GuidePage,
  head: () => ({
    meta: [
      { title: `${TITLE} — FlowSpring` },
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

function GuidePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <article className="max-w-2xl mx-auto prose prose-slate">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          {TITLE}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Updated 2026 · A FlowSpring community guide
        </p>

        <p className="mt-6 text-base leading-relaxed">
          Testing your home water takes about 10 minutes and answers two
          questions: <strong>is it safe to drink?</strong> and{" "}
          <strong>what needs fixing if it isn't?</strong> This guide walks
          through the quick observable checks anyone can do today, when to
          use a home test kit, how to read the results, and what to do
          next.
        </p>

        <h2 className="text-xl font-bold mt-8">1. Observable indicators</h2>
        <p>Before any test kit, use your senses. Note anything unusual:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Color or cloudiness</strong> — yellow, brown, or milky water often means rust, sediment, or air; persistent cloudiness can indicate pipe corrosion.</li>
          <li><strong>Chemical smell</strong> — strong chlorine, bleach, or solvent smells are a red flag, especially near industrial sites.</li>
          <li><strong>Rotten-egg smell</strong> — usually hydrogen sulfide; harmless in trace amounts, but corrosive at higher levels.</li>
          <li><strong>Metallic or earthy taste</strong> — iron, manganese, or algae byproducts.</li>
          <li><strong>Particulates</strong> — sand, flakes, or grit point to pipe or supply issues.</li>
          <li><strong>Oily sheen</strong> — possible hydrocarbon contamination; stop drinking immediately and report.</li>
        </ul>

        <h2 className="text-xl font-bold mt-8">2. Use a home test kit</h2>
        <p>
          A basic strip kit (₹300–₹1,500 / $5–$25) checks pH, hardness,
          chlorine, nitrates, nitrites, and total dissolved solids in
          minutes. For lead, arsenic, or microbial contamination, send a
          sample to a certified lab — at-home kits for those are unreliable.
        </p>
        <p>
          Collect from the tap you actually drink from. Run it for 30
          seconds first if you want a steady-state reading, or use the
          first-draw sample if you suspect lead leaching overnight.
        </p>

        <h2 className="text-xl font-bold mt-8">3. How to read a water quality report</h2>
        <p>
          Annual reports (called CCRs in the US, water quality reports in
          India) list each contaminant alongside the detected level and the
          regulatory limit. Three columns matter:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Detected level</strong> — what was measured.</li>
          <li><strong>MCL / permissible limit</strong> — the legal maximum.</li>
          <li><strong>MCLG / ideal goal</strong> — the health-based target (often zero for carcinogens).</li>
        </ul>
        <p>
          If a detected level approaches or exceeds the limit, that's the
          contaminant to act on. Pay extra attention to lead, arsenic,
          nitrates, and total coliform — these have the most serious
          health consequences.
        </p>

        <h2 className="text-xl font-bold mt-8">4. What to do based on the result</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>All within limits</strong> — keep monitoring; retest yearly or after any plumbing change.</li>
          <li><strong>High chlorine or hardness</strong> — a carbon filter or softener usually fixes it.</li>
          <li><strong>Lead or heavy metals</strong> — use a certified NSF/ANSI 53 filter, switch to a different source, and request a service-line inspection.</li>
          <li><strong>Microbial contamination</strong> — boil water for 1 minute before drinking; report the issue so the supply can be tested upstream.</li>
          <li><strong>Anything unexplained</strong> — file a report so neighbors can compare and authorities can respond.</li>
        </ul>

        <h2 className="text-xl font-bold mt-8">Report what you find</h2>
        <p>
          If your water looks, smells, or tests wrong, file a FlowSpring
          report. Community-verified reports get routed to NGOs and
          authorities, and the live map helps neighbors spot patterns.
        </p>
        <p className="mt-4">
          <Link
            to="/report"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Report a water incident
          </Link>
        </p>
      </article>
    </main>
  );
}