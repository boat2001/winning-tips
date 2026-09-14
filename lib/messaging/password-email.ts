import "server-only";
import { getSiteUrl } from "@/lib/config/site";

export function passwordEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  if (!passwordEmailConfigured()) throw new Error("Password recovery is not configured.");
  const url = new URL("/reset-password", getSiteUrl());
  url.searchParams.set("token", token);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [email], subject: "Reset your Winning Tips password", text: `Use this link to reset your Winning Tips password. It expires in one hour.\n\n${url}\n\nIf you did not request this, you can ignore this email.` }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("Password email could not be delivered.");
}
