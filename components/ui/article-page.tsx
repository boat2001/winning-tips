import { PageMasthead, Shell } from "@/components/ui/layout";

/**
 * Shared shell for the long-form pages (terms, privacy, responsible gaming).
 * Sections are numbered and hairline-separated so a wall of policy text still
 * scans like a document rather than a blog post.
 */
export function ArticlePage({
  kicker,
  title,
  lede,
  updated,
  sections,
}: {
  kicker: string;
  title: string;
  lede?: string;
  updated?: string;
  sections: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <>
      <PageMasthead kicker={kicker} title={title} lede={lede} />
      <Shell className="pb-16">
        {updated ? <p className="eyebrow border-t border-line-2 pt-4">Last updated {updated}</p> : null}
        <div className="mt-8 max-w-3xl">
          {sections.map(([heading, copy], index) => (
            <section key={heading} className="grid gap-2 border-t border-line-2 py-7 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-6">
              <span className="num text-sm text-blue">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h2 className="display-heading text-xl font-semibold">{heading}</h2>
                <p className="mt-3 text-base leading-7 text-ink-2">{copy}</p>
              </div>
            </section>
          ))}
        </div>
      </Shell>
    </>
  );
}
