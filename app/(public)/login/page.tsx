import type { Metadata } from "next";
import { AccountPreview } from "@/components/auth/account-preview";
export const metadata: Metadata = { title: "Login", description: "Login to your Smart Tips account.", robots: { index: false, follow: false } };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AccountPreview mode="login" next={next} />;
}
