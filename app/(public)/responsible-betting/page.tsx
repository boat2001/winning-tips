import type { Metadata } from "next";
import { ArticlePage } from "@/components/ui/article-page";

export const metadata: Metadata = {
  title: "Responsible Gaming",
  description: "Practical guidance for responsible betting and safer play.",
  alternates: { canonical: "/responsible-betting" },
};

const sections = [
  ["Treat every tip as an opinion", "A prediction is a considered view, not a forecast of what will happen. Even a well-reasoned pick at short odds loses often enough to matter over a season."],
  ["Decide the limit before you stake", "Set the amount you are willing to lose before you look at the card, and stake to that. A limit chosen after a result is not a limit."],
  ["Never chase a loss", "Raising a stake to win back what you have lost is the fastest way to turn a bad day into a bad month. Stop for the day instead."],
  ["Never borrow to bet", "If a stake needs a loan, an overdraft, or money set aside for something else, the stake is too big. Skip it."],
  ["Know when to stop", "If betting stops being enjoyable, if you hide it, or if it starts affecting your work, sleep or relationships, step away and speak to a professional support service."],
] as const;

export default function ResponsibleBettingPage() {
  return (
    <ArticlePage
      kicker="18+ only"
      title="Responsible gaming"
      lede="Betting carries real risk. These are the rules we would want anyone using this site to follow."
      sections={sections}
    />
  );
}
