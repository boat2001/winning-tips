import { FlaskConical } from "lucide-react";
import { isDesignPreview } from "@/lib/config/countries";

/**
 * The visible marker guide §21.8 requires while screens still render demo data.
 *
 * Two deliberate choices. It renders in production too, not just in
 * development: the whole point is that fabricated figures can never be mistaken
 * for real ones, and hiding the warning in the environment where it matters
 * most would defeat that. And it is driven by `isFixtureBacked` — a constant
 * that goes away when the last fixture import does — rather than by an
 * environment variable that could be set wrongly.
 */
export function FixtureNotice() {
  if (!isDesignPreview()) return null;

  return (
    <p role="status" className="fixture-notice">
      <FlaskConical aria-hidden className="size-3.5 shrink-0" />
      <span><strong>Design preview</strong> · sample data</span>
    </p>
  );
}
