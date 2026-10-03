import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — Cadence" }, { name: "description", content: "How Cadence handles your information." }, { property: "og:title", content: "Privacy Policy — Cadence" }, { property: "og:description", content: "How Cadence handles your information." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <div className="eyebrow mb-2">Legal</div>
      <h1 className="text-[32px] font-bold">Privacy Policy</h1>
      <p className="mt-4 text-muted-foreground">Our full privacy policy is being finalised and will be published here. Marketing emails are only sent if you opt in, and you can opt out at any time from your profile.</p>
      <Link to="/practice" className="btn btn-ghost mt-8">Back to practice</Link>
    </div>
  ),
});
