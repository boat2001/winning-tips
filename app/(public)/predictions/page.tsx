import { permanentRedirect } from "next/navigation";

/** Superseded by /tips, which carries the same free board, VIP slips and full list. */
export default function PredictionsPage() {
  permanentRedirect("/tips");
}
