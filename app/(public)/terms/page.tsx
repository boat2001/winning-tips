import type { Metadata } from "next";
import { legalDocuments } from "@/lib/config/legal";
import { ArticlePage } from "@/components/ui/article-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing your use of Winning Tips football tips, predictions and account services.",
  alternates: { canonical: "/terms" },
};

const sections = [
  ["Using Winning Tips", "Winning Tips publishes football tips, predictions and match analysis for information only. You must be at least 18 and legally permitted to use betting-related services where you live."],
  ["No guaranteed results", "Every prediction is an opinion formed from the information available at the time. No result, return or profit is guaranteed, and every betting decision you make remains yours."],
  ["Your account", "Keep your login details secure and give accurate account information. We may restrict accounts used unlawfully or fraudulently, or in a way that harms the service or other members."],
  ["VIP access", "VIP slips are sold individually, each with its own price and contents. Access is personal: slips must not be copied, resold or shared without our permission."],
  ["Responsible gaming", "Set limits, never borrow money to bet and never chase a loss. Stop and seek professional support if gambling stops being enjoyable or starts causing harm."],
] as const;

export default function TermsPage() {
  return <ArticlePage kicker="Legal" title="Terms of service" updated={legalDocuments.terms.updated} sections={sections} />;
}
