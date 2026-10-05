import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms — TheUnspoken" }, { name: "description", content: "TheUnspoken terms of use." }, { property: "og:title", content: "Terms — TheUnspoken" }, { property: "og:description", content: "TheUnspoken terms of use." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <div className="eyebrow mb-2">Legal</div>
      <h1 className="text-[32px] font-bold">Terms of use</h1>
      <p className="mt-4 text-muted-foreground">Our full terms are being finalised and will be published here.</p>
      <Link to="/practice" className="btn btn-ghost mt-8">Back to practice</Link>
    </div>
  ),
});
