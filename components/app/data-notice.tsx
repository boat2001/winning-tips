export function DataNotice({ unavailable }: { unavailable: boolean }) {
  if (!unavailable) return null;
  return <p role="status" className="rounded-card border border-gold-500/40 bg-gold-500/10 p-4 text-sm text-gold-100">Predictions are temporarily unavailable. Please try again shortly. Your account and purchases are unchanged.</p>;
}
