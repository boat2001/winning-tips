import type { Metadata } from "next";
import Link from "next/link";
import {
  Bookmark,
  ChevronRight,
  Crown,
  Gift,
  HelpCircle,
  Moon,
  Send,
  ShieldCheck,
  Target,
  Trophy,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { FormBars } from "@/components/predictions/form-bars";
import { PreferenceForm } from "@/components/auth/preference-form";
import { IdentityPanel } from "@/components/app/identity-panel";
import { SignOutOthers } from "@/components/app/sign-out-others";
import { ShareButton } from "@/components/ui/share-button";
import { StatTile } from "@/components/ui/metrics";
import { Card, Panel, SectionHead } from "@/components/ui/surface";
import { getCurrentViewer, requireMember } from "@/lib/app/current-viewer";
import { isDesignPreview } from "@/lib/config/countries";
import { getPreferences } from "@/lib/app/preferences";
import { getTipsData } from "@/lib/app/tips";
import { communityLinks } from "@/lib/config/site";
import { winRatePercent } from "@/lib/domain/performance";
import { dailyForm, summarizeResults } from "@/lib/domain/result-summary";

export const metadata: Metadata = { title: "Profile", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  await requireMember("/profile");
  const viewer = await getCurrentViewer();
  const [data, prefs] = await Promise.all([getTipsData(), getPreferences(viewer.id)]);

  const saved = data.tips.filter((tip) => tip.savedByViewer);
  const stats = summarizeResults(saved, "all");
  const rate = winRatePercent(stats.winRate);
  const favouriteSport = prefs.sports[0];

  return (
    <div className="profile-page page-stack">
      <PageHeader title="Profile" />

      <IdentityPanel viewer={viewer} canEdit={!isDesignPreview()}>
        {/* Four figures with icons, as the mock lays them out. Every one is a
            real count — the mock's streak and referral tiles have no source in
            the domain, so their slots carry metrics that do. */}
        <ul className="grid w-full grid-cols-2 gap-4 border-t border-navy-600 pt-4 sm:grid-cols-4">
          <li>
            <StatTile
              tone="on-navy"
              icon={<Bookmark aria-hidden className="size-5 shrink-0 text-blue-300" />}
              value={saved.length}
              label="Saved tips"
            />
          </li>
          <li>
            <StatTile
              tone="on-navy"
              icon={<Target aria-hidden className="size-5 shrink-0 text-green-400" />}
              value={stats.settled}
              label="Graded tips"
            />
          </li>
          <li>
            <StatTile
              tone="on-navy"
              icon={<Trophy aria-hidden className="size-5 shrink-0 text-gold-500" />}
              value={favouriteSport ? favouriteSport.charAt(0).toUpperCase() + favouriteSport.slice(1) : "—"}
              label="Favorite sport"
            />
          </li>
          <li>
            <StatTile
              tone="on-navy"
              icon={<Crown aria-hidden className="size-5 shrink-0 text-gold-500" />}
              value={viewer.plan === "PREMIUM" ? "Premium" : "Free"}
              label="Account plan"
            />
          </li>
        </ul>
      </IdentityPanel>

      <div className="grid gap-4">
        <Panel className="min-w-0 p-4 sm:p-5">
          <SectionHead title="My Saved Tip Results" action={{ label: "Saved tips", href: "/saved-tips" }} />

          <div className="mt-4 grid gap-4 sm:grid-cols-[1.5fr_1fr] sm:items-center">
            <ul className="grid grid-cols-4 gap-2 rounded-control border border-navy-600 p-3 sm:gap-3 sm:p-4">
              <li>
                <StatTile tone="won" surface="navy" value={rate === null ? "—" : `${rate}%`} label="Win rate" />
              </li>
              <li>
                <StatTile tone="on-navy" value={stats.settled} label="Graded" />
              </li>
              <li>
                <StatTile tone="won" surface="navy" value={stats.won} label="Won" />
              </li>
              <li>
                <StatTile tone="lost" surface="navy" value={stats.lost} label="Lost" />
              </li>
            </ul>

            <div className="flex items-center gap-3">
              <FormBars bars={dailyForm(saved)} className="min-w-0 flex-1" />
              {stats.settled > 0 ? (
                <p className="shrink-0 font-script text-2xl font-bold leading-tight text-green-400">
                  Keep
                  <br />
                  Going!
                </p>
              ) : null}
            </div>
          </div>

          <p className="mt-3 text-xs text-on-navy-muted">
            Published outcomes of saved tips. This is not a record of bets or winnings.
          </p>
        </Panel>

      </div>

      <section id="settings" aria-labelledby="preferences-title" className="section-stack scroll-mt-24">
        <h2 id="preferences-title">Preferences</h2>
        <Card className="overflow-hidden">
          <PreferenceForm countryCode={prefs.countryCode} sports={prefs.sports} notifications={prefs.notifications} available={prefs.available} />
        </Card>
      </section>

      <Card as="section" className="overflow-hidden">
        <h2 className="sr-only">Account</h2>

        {/* The account menu is hidden on phones, so this row is the way into
            the panel there. */}
        {viewer.canAccessAdmin ? (
          <SettingsRow
            icon={<ShieldCheck aria-hidden className="size-5" />}
            tone="bg-green-600"
            label="Admin panel"
            description="Manage tips, slips, payments and members"
            href="/admin"
            value="Open"
          />
        ) : null}

        <SettingsRow
          icon={<Bookmark aria-hidden className="size-5" />}
          tone="bg-blue-500"
          label="Saved Tips"
          description="Review your shortlist and published outcomes"
          href="/saved-tips"
          value={String(saved.length)}
        />
        <SettingsRow
          icon={<Send aria-hidden className="size-5" />}
          tone="bg-blue-400"
          label="Telegram Community"
          description="Join the official channel for published updates"
          href={communityLinks.telegram}
          value="Open channel"
        />

        {/* The mock shows a switch here. It renders as one, reporting the real
            state: there is only a dark theme, so it is on and disabled rather
            than a control that looks live and does nothing. */}
        <div className="settings-control">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#5b21b6] text-white">
            <Moon aria-hidden className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block">Appearance</strong>
            <span className="text-xs text-ink-500">Stadium dark theme</span>
          </span>
          <span
            role="switch"
            aria-checked="true"
            aria-disabled="true"
            aria-label="Dark theme, always on"
            className="inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-green-500 px-0.5 opacity-70"
          >
            <span aria-hidden className="ml-auto size-5 rounded-full bg-white" />
          </span>
        </div>

        <SettingsRow
          icon={<Crown aria-hidden className="size-5" />}
          tone="bg-gold-500"
          label="VIP Slips"
          description="View available slips and your purchases"
          href="/vip"
          value="View"
        />
        <SignOutOthers />

        <SettingsRow
          icon={<HelpCircle aria-hidden className="size-5" />}
          tone="bg-navy-700"
          label="Help & Support"
          description="FAQs, contact us, and responsible participation"
          href="/help"
          last
        />
      </Card>

      {/* Stacks below sm. Left as a single flex row, the copy was squeezed into
          a five-line column between the icon and the button on a 390px screen. */}
      <section className="flex flex-col items-start gap-4 rounded-card border border-blue-400 bg-gradient-to-r from-blue-600 to-navy-800 p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <Gift aria-hidden className="size-10 shrink-0 rounded-lg bg-green-500 p-2 text-white" />
          <div className="min-w-0">
            <h2>Invite Friends</h2>
            <p className="mt-1 text-sm text-on-navy-2">Share the analysis. Grow the conversation.</p>
          </div>
        </div>
        <div className="sm:ml-auto">
          <ShareButton />
        </div>
      </section>
    </div>
  );
}

function SettingsRow({
  icon,
  tone,
  label,
  description,
  href,
  value,
  last = false,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
  description: string;
  href: string;
  value?: string;
  last?: boolean;
}) {
  return (
    <Link href={href} className={`settings-control hover:bg-card-2${last ? " border-b-0" : ""}`}>
      <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-white ${tone}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block">{label}</strong>
        <span className="text-xs text-ink-500">{description}</span>
      </span>
      {value ? <span className="shrink-0 text-xs font-semibold text-blue-600">{value}</span> : null}
      <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-500" />
    </Link>
  );
}
