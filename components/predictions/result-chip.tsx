/** Settled-state chip. Shared by the board, the detail page and the VIP lists. */
export function Result({ result }: { result: string }) {
  if (result === "WON") return <span className="result result-won">Won</span>;
  if (result === "LOST") return <span className="result result-lost">Lost</span>;
  if (["VOID", "PUSH", "CANCELLED"].includes(result)) return <span className="result result-void">Void</span>;
  return <span className="result result-pending">Open</span>;
}
