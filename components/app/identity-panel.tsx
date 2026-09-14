"use client";

import { useActionState, useState } from "react";
import type { ReactNode } from "react";
import { Crown, MapPin, Pencil, X } from "lucide-react";
import { updateIdentity } from "@/app/(app)/profile/actions";
import { Avatar } from "@/components/ui/avatar";
import { Panel } from "@/components/ui/surface";
import { buttonClass } from "@/components/ui/button";
import type { Viewer } from "@/lib/domain/viewer";

/**
 * The profile identity card, with its edit form.
 *
 * The mock's "Edit Profile" button and the badge on the avatar both used to
 * link to the legacy account page, which dropped the member into a different
 * design system to change a name. Both now open this form in place, and it
 * writes the two fields the card actually shows.
 *
 * Photo upload is deliberately absent rather than faked: there is no asset
 * store configured yet, so the badge edits the details it can change.
 */
export function IdentityPanel({
  viewer,
  canEdit,
  children,
}: {
  viewer: Viewer;
  /** False in the design preview, where there is no database to write to. */
  canEdit: boolean;
  /** The stat row, rendered on the server. */
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateIdentity, {} as { error?: string; success?: string });

  return (
    <Panel className="profile-identity flex flex-wrap items-center gap-4 p-4 sm:p-5">
      <div className="relative shrink-0">
        <Avatar name={viewer.displayName} src={viewer.avatarUrl} size="xl" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Edit your name and handle"
          className="absolute -bottom-1 -right-1 inline-flex size-8 items-center justify-center rounded-full border-2 border-navy-800 bg-blue-500 text-white transition-colors hover:bg-blue-600"
        >
          <Pencil aria-hidden className="size-3.5" />
        </button>
      </div>

      <div className="min-w-0 flex-1 basis-56">
        <h2 className="flex flex-wrap items-center gap-2.5 break-words">
          {viewer.displayName}
          {viewer.plan === "PREMIUM" ? (
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-gold-500/15 px-3 py-1 text-[0.8125rem] font-bold text-gold-500 ring-1 ring-gold-500/40">
              <Crown aria-hidden className="size-3.5 fill-gold-500" />
              Premium
            </span>
          ) : null}
        </h2>
        <p className="mt-1 text-sm text-on-navy-2">@{viewer.handle}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-blue-300">
          <MapPin aria-hidden className="size-3.5 shrink-0" />
          {viewer.countryName} · {viewer.timezone}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="identity-form"
        className={buttonClass("primary", "md", "shrink-0")}
      >
        {open ? <X aria-hidden className="size-4" /> : <Pencil aria-hidden className="size-4" />}
        {open ? "Close" : "Edit Profile"}
      </button>

      {open ? (
        <form id="identity-form" action={action} className="w-full rounded-card border border-navy-600 bg-navy-900/60 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-on-navy">
              Display name
              <input
                name="displayName"
                defaultValue={viewer.displayName}
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                className="mt-1.5 block min-h-11 w-full rounded-control border border-navy-600 bg-navy-950 px-3 text-[0.9375rem] font-normal text-on-navy"
              />
              <span className="mt-1 block text-xs font-normal text-on-navy-muted">Shown on your profile and your greeting.</span>
            </label>

            <label className="block text-sm font-semibold text-on-navy">
              Handle
              <span className="mt-1.5 flex min-h-11 w-full items-center rounded-control border border-navy-600 bg-navy-950 pl-3">
                <span aria-hidden className="text-[0.9375rem] font-normal text-on-navy-muted">@</span>
                <input
                  name="username"
                  defaultValue={viewer.handle}
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[A-Za-z0-9_\-]+"
                  autoComplete="username"
                  className="min-h-11 w-full rounded-r-control bg-transparent px-1.5 text-[0.9375rem] font-normal text-on-navy"
                />
              </span>
              <span className="mt-1 block text-xs font-normal text-on-navy-muted">Letters, numbers, hyphens and underscores. Your posts carry it.</span>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            <p role="status" className="mr-auto text-sm">
              {state.error ? <span className="text-red-500">{state.error}</span>
                : state.success ? <span className="text-green-400">{state.success}</span>
                : !canEdit ? <span className="text-on-navy-muted">Editing is disabled in the design preview.</span>
                : null}
            </p>
            <button type="button" onClick={() => setOpen(false)} className={buttonClass("ghost", "md")}>
              Cancel
            </button>
            <button disabled={pending || !canEdit} className={buttonClass("primary", "md")}>
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      ) : null}

      {children}
    </Panel>
  );
}
