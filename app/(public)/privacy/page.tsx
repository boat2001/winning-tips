import type { Metadata } from "next";
import { ArticlePage } from "@/components/ui/article-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Smart Tips collects, uses and protects account and service data.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  ["Information we collect", "We store the account details you provide: your username, email address, phone number and profile details. Passwords are only ever stored as secure hashes, never as text we can read."],
  ["How we use information", "Account data authenticates you, powers member features, protects the service, lets us answer support requests and helps us improve Smart Tips. We do not use it for anything else."],
  ["Security and sessions", "Login sessions use secure HTTP-only cookies. Session tokens and password-reset tokens are stored as one-way hashes, and security-sensitive account activity is written to an audit log."],
  ["Sharing and retention", "We do not sell personal information. Data is disclosed to service providers or authorities only where it is necessary to operate the service or to comply with the law."],
  ["Your choices", "You can update your profile from Settings at any time. Contact us if you need help accessing, correcting or deleting your personal information."],
] as const;

export default function PrivacyPage() {
  return <ArticlePage kicker="Legal" title="Privacy policy" updated="14 August 2026" sections={sections} />;
}
