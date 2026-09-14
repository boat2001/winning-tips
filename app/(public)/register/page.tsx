import type { Metadata } from "next";
import { AccountPreview } from "@/components/auth/account-preview";
export const metadata: Metadata = { title: "Register", description: "Create your Winning Tips account.", robots: { index: false, follow: false } };
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AccountPreview mode="register" next={next} />;
}
