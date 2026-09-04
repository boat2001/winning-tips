import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/ui/layout";
import { verifyAndFulfilPayment } from "@/lib/payments/service";

export const metadata: Metadata = { title: "Payment Verification", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PaymentVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const query = await searchParams;
  const reference = query.reference || query.trxref || "";
  let result: Awaited<ReturnType<typeof verifyAndFulfilPayment>> = { status: "not_found" };
  try {
    if (reference) result = await verifyAndFulfilPayment(reference);
  } catch {
    result = { status: "failed" };
  }
  const success = result.status === "success";

  return (
    <Shell className="py-16">
      <div className="max-w-xl">
        <div className={success ? "border-t-[3px] border-won" : "border-t-[3px] border-hold"} />
        <p className={`eyebrow pt-5 ${success ? "text-won" : "text-hold"}`}>
          {success ? "Payment confirmed" : result.status === "cancelled" ? "Payment cancelled" : "Payment not confirmed"}
        </p>
        <h1 className="display-heading mt-3 text-[clamp(1.875rem,6vw,3rem)] font-bold leading-[0.95]">
          {success ? "Your slip is unlocked" : "Nothing was unlocked"}
        </h1>
        <p className="mt-4 text-base leading-7 text-ink-2">
          {success
            ? "The games and results on this VIP slip are waiting in your dashboard, and they stay there for good."
            : "No VIP games were unlocked. If your account was charged, send us the reference below and we will sort it."}
        </p>
        {reference ? (
          <p className="eyebrow mt-6 border-y border-line-2 py-3">
            Reference <span className="num text-ink">{reference}</span>
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={success ? "/dashboard#my-vip-games" : "/vip"} className="btn btn-primary">
            {success ? "View your games" : "Back to VIP slips"}
          </Link>
          <Link href={success ? "/account" : "/contact"} className="btn btn-ghost">
            {success ? "Settings" : "Contact support"}
          </Link>
        </div>
      </div>
    </Shell>
  );
}
