export const memberActivityLabels: Record<string, { title: string; description: string; tone: "emerald" | "blue" | "amber" | "slate" }> = {
  USER_REGISTERED: { title: "Account created", description: "Your Smart Tips membership was created.", tone: "emerald" },
  USER_LOGGED_IN: { title: "Signed in", description: "A successful login was recorded.", tone: "blue" },
  USER_LOGGED_OUT: { title: "Signed out", description: "Your session was securely closed.", tone: "slate" },
  PROFILE_UPDATED: { title: "Profile updated", description: "Your account details were changed.", tone: "blue" },
  PASSWORD_RESET_REQUESTED: { title: "Password reset requested", description: "Password-reset instructions were requested.", tone: "amber" },
  PASSWORD_RESET_COMPLETED: { title: "Password changed", description: "Your account password was updated.", tone: "emerald" },
  PAYMENT_INITIALIZED: { title: "Checkout started", description: "You started a VIP checkout.", tone: "amber" },
};

export function describeAuditAction(action: string) {
  return memberActivityLabels[action] ?? {
    title: action.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()),
    description: "Account activity was recorded.",
    tone: "slate" as const,
  };
}

export function describePaymentStatus(status: string) {
  if (status === "SUCCESS") return { title: "Payment successful", tone: "emerald" as const };
  if (status === "PENDING") return { title: "Payment pending", tone: "amber" as const };
  if (status === "REFUNDED") return { title: "Payment refunded", tone: "blue" as const };
  if (status === "CANCELLED") return { title: "Payment cancelled", tone: "slate" as const };
  return { title: "Payment failed", tone: "slate" as const };
}
