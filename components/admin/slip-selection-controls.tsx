"use client";

import { useEffect, useState } from "react";

const selector = 'input[name="bookingIds"][form="bulk-delete-form"]';

export function SlipSelectionControls() {
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const update = () => setSelected(document.querySelectorAll<HTMLInputElement>(`${selector}:checked`).length);
    document.addEventListener("change", update);
    update();
    return () => document.removeEventListener("change", update);
  }, []);

  function setAll(checked: boolean) {
    document.querySelectorAll<HTMLInputElement>(selector).forEach((input) => { input.checked = checked; });
    setSelected(checked ? document.querySelectorAll(selector).length : 0);
  }

  return (
    <div className="flex flex-wrap gap-2 pb-1">
      <button type="button" onClick={() => setAll(true)} className="min-h-10 shrink-0 whitespace-nowrap rounded-sharp bg-blue-500 px-4 text-xs font-semibold text-white hover:bg-blue-600">Select all</button>
      <button type="button" onClick={() => setAll(false)} className="min-h-10 shrink-0 whitespace-nowrap rounded-sharp bg-line px-4 text-xs font-semibold text-ink-2">Clear selection</button>
      <button type="submit" disabled={!selected} className="min-h-10 shrink-0 whitespace-nowrap rounded-sharp border border-lost-bg px-4 text-xs font-semibold text-lost disabled:border-line disabled:text-faint">Delete selected ({selected})</button>
    </div>
  );
}
