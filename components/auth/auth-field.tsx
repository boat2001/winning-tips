"use client";

import { useState } from "react";
import { removeLeadingTrunkZero } from "@/lib/auth/phone";

const countries = [
  { code: "GH", name: "Ghana", dial: "+233", usesTrunkZero: true },
  { code: "NG", name: "Nigeria", dial: "+234", usesTrunkZero: true },
  { code: "CI", name: "Côte d’Ivoire", dial: "+225", usesTrunkZero: false },
  { code: "TG", name: "Togo", dial: "+228", usesTrunkZero: false },
  { code: "BF", name: "Burkina Faso", dial: "+226", usesTrunkZero: false },
  { code: "KE", name: "Kenya", dial: "+254", usesTrunkZero: true },
  { code: "ZA", name: "South Africa", dial: "+27", usesTrunkZero: true },
  { code: "GB", name: "United Kingdom", dial: "+44", usesTrunkZero: true },
  { code: "US", name: "United States / Canada", dial: "+1", usesTrunkZero: false },
] as const;

/**
 * Labels sit above the control in mono small caps rather than inside it. No
 * leading icons: the label already names the field, and the icons were the main
 * thing making these forms look like every other template.
 */
export function AuthField({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const password = type === "password";

  return (
    <label className="block min-w-0">
      <span className="field-label">{label}</span>
      <span className="relative block min-w-0">
        <input
          name={name}
          required={required}
          type={password && visible ? "text" : type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`field ${password ? "pr-11" : ""}`}
        />
        {password ? (
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-faint transition-colors hover:text-blue"
          >
            <EyeIcon open={visible} />
          </button>
        ) : null}
      </span>
    </label>
  );
}

export function PhoneField() {
  const [countryCode, setCountryCode] = useState("GH");
  const [localNumber, setLocalNumber] = useState("");
  const country = countries.find((item) => item.code === countryCode) ?? countries[0];

  function updateNumber(value: string) {
    const normalized = value.replace(/[^+0-9 ()-]/g, "");
    if (normalized.trim().startsWith("+")) {
      const compact = normalized.replace(/[ ()-]/g, "");
      const detected = [...countries].sort((a, b) => b.dial.length - a.dial.length).find((item) => compact.startsWith(item.dial));
      if (detected) {
        setCountryCode(detected.code);
        const detectedLocalNumber = compact.slice(detected.dial.length);
        setLocalNumber(detected.usesTrunkZero ? removeLeadingTrunkZero(detectedLocalNumber) : detectedLocalNumber);
        return;
      }
    }
    const nationalNumber = normalized.replace(/^\+/, "");
    setLocalNumber(country.usesTrunkZero ? removeLeadingTrunkZero(nationalNumber) : nationalNumber);
  }

  return (
    <label className="block min-w-0">
      <span className="field-label">Phone number</span>
      <span className="flex h-[2.875rem] min-w-0 rounded-sharp border border-line-2 bg-surface focus-within:border-blue focus-within:shadow-[inset_0_0_0_1px_var(--color-blue)]">
        <span className="relative flex shrink-0 items-center border-r border-line-2 bg-paper">
          <span className="num pointer-events-none flex items-center gap-1.5 px-3 text-sm font-medium">
            {country.code}
            <span className="text-muted">{country.dial}</span>
          </span>
          <select
            aria-label="Country code"
            value={country.code}
            onChange={(event) => {
              const selected = countries.find((item) => item.code === event.target.value) ?? countries[0];
              setCountryCode(selected.code);
              setLocalNumber(selected.usesTrunkZero ? removeLeadingTrunkZero(localNumber) : localNumber);
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {countries.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name} ({item.dial})
              </option>
            ))}
          </select>
        </span>
        <input
          name="phoneLocal"
          value={localNumber}
          onChange={(event) => updateNumber(event.target.value)}
          type="tel"
          required
          autoComplete="tel-national"
          inputMode="tel"
          placeholder="20 123 4567"
          className="num min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:font-sans placeholder:text-faint"
        />
        <input type="hidden" name="phone" value={`${country.dial} ${localNumber.trim()}`} />
      </span>
    </label>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
      {open && <path d="m4 4 16 16" />}
    </svg>
  );
}
