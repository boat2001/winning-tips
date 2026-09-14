import "server-only";

import { getDatabase } from "@/lib/db/client";
import { describeAuditAction, describePaymentStatus } from "@/lib/member/activity";

export type MemberActivityItem = {
  id: string;
  title: string;
  description: string;
  occurredAt: Date;
  tone: "emerald" | "blue" | "amber" | "slate";
  category: "account" | "payment" | "membership";
};

export async function getMemberActivity(userId: string, take = 40): Promise<MemberActivityItem[]> {
  const database = getDatabase();
  const [audits, payments] = await Promise.all([
    database.auditLog.findMany({
      where: { actorId: userId },
      select: { id: true, action: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take,
    }),
    database.payment.findMany({
      where: { userId },
      select: { id: true, status: true, amountMinor: true, currency: true, reference: true, createdAt: true, paidAt: true, plan: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take,
    }),
  ]);

  const auditItems: MemberActivityItem[] = audits.map((audit) => ({
    id: `audit-${audit.id}`,
    ...describeAuditAction(audit.action),
    occurredAt: audit.createdAt,
    category: "account",
  }));

  const paymentItems: MemberActivityItem[] = payments.map((payment) => {
    const status = describePaymentStatus(payment.status);
    const amount = new Intl.NumberFormat("en-GH", { style: "currency", currency: payment.currency }).format(payment.amountMinor / 100);
    return {
      id: `payment-${payment.id}`,
      title: status.title,
      description: `${payment.plan?.name ?? "VIP card"} · ${amount} · ${payment.reference}`,
      occurredAt: payment.paidAt ?? payment.createdAt,
      tone: status.tone,
      category: "payment",
    };
  });


  return [...auditItems, ...paymentItems]
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, take);
}

export async function getMemberOverview(userId: string) {
  const database = getDatabase();
  const [successfulPayments, paymentCount, recentActivity] = await Promise.all([
    database.payment.aggregate({ where: { userId, status: "SUCCESS" }, _sum: { amountMinor: true } }),
    database.payment.count({ where: { userId } }),
    getMemberActivity(userId, 6),
  ]);

  return {
    successfulSpendMinor: successfulPayments._sum.amountMinor ?? 0,
    paymentCount,
    recentActivity,
  };
}
