"use client";
import { useActionState } from "react";
import { Bell, Check, Globe, LayoutGrid } from "lucide-react";
import { savePreferences } from "@/app/(app)/profile/actions";
import { SportIcon, sportLabel } from "@/components/ui/sport-icon";
import { countries } from "@/lib/config/countries";

const SPORTS = ["football", "basketball", "tennis"] as const;

/**
 * Member preferences as one card with one save action.
 *
 * It used to sit inside the settings link list, so a form with its own save
 * button interrupted a column of navigation rows — and when storage was down,
 * a disabled button and an apology sat in the middle of that list. Now the
 * form owns its card, and the unavailable state disables the whole fieldset
 * with one explanation in the footer, beside the button it explains.
 */
export function PreferenceForm({ countryCode, sports, notifications, available }: { countryCode: string; sports: string[]; notifications: boolean; available: boolean }) {
  const [state, action, pending] = useActionState(savePreferences, {});

  return (
    <form action={action} className="preference-form">
      <fieldset disabled={!available || pending} className="divide-y divide-card-line">
        <legend className="sr-only">Preferences</legend>

        <div className="pref-row">
          <RowIcon className="bg-blue-500"><Globe aria-hidden className="size-5" /></RowIcon>
          <div className="min-w-0 flex-1">
            <label htmlFor="country" className="font-semibold">Country edition</label>
            <p className="text-xs text-ink-500">Sets your currency, timezone and which services are available.</p>
          </div>
          <div className="pref-control">
          <select id="country" name="countryCode" defaultValue={countryCode} className="pref-select">
            {Object.values(countries).map((country) => (
              <option key={country.countryCode} value={country.countryCode} disabled={!country.enabled}>
                {country.name} · {country.enabled ? country.currency : "coming later"}
              </option>
            ))}
          </select>
          </div>
        </div>

        <div className="pref-row">
          <RowIcon className="bg-orange-500"><LayoutGrid aria-hidden className="size-5" /></RowIcon>
          <div className="min-w-0 flex-1">
            <p id="sports-label" className="font-semibold">Favourite sports</p>
            <p className="text-xs text-ink-500">Your home screen leads with these.</p>
          </div>
          <div role="group" aria-labelledby="sports-label" className="pref-control">
            {SPORTS.map((sport) => (
              <label key={sport} className="pref-chip">
                <input type="checkbox" name="sports" value={sport} defaultChecked={sports.includes(sport)} className="sr-only" />
                <SportIcon sport={sport} size="sm" className="!size-6 !p-0.5" />
                {sportLabel(sport)}
                <Check aria-hidden className="pref-chip-tick size-3.5" />
              </label>
            ))}
          </div>
        </div>

        <div className="pref-row">
          <RowIcon className="bg-blue-400"><Bell aria-hidden className="size-5" /></RowIcon>
          <label htmlFor="notifications" className="min-w-0 flex-1 cursor-pointer">
            <strong className="block font-semibold">Account updates</strong>
            <span className="text-xs text-ink-500">Show account activity in notifications. We never send marketing.</span>
          </label>
          <label className="pref-control relative">
            <input id="notifications" type="checkbox" role="switch" name="notifications" defaultChecked={notifications} className="peer sr-only" />
            <span aria-hidden className="pref-switch" />
          </label>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-card-line bg-card-2 px-4 py-3">
        <p role="status" className="mr-auto text-sm">
          {state.error ? <span className="text-red-500">{state.error}</span>
            : state.success ? <span className="text-green-600">{state.success}</span>
            : !available ? <span className="text-ink-500">Preferences can&apos;t be saved right now. Try again shortly.</span>
            : null}
        </p>
        <button disabled={pending || !available} className="min-h-11 rounded-control bg-blue-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? "Saving…" : "Save preferences"}
        </button>
      </div>
    </form>
  );
}

function RowIcon({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-white ${className}`}>{children}</span>;
}
