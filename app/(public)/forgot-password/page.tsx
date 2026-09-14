import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/password-reset-forms";

export const metadata: Metadata = { title: "Forgot Password", description: "Request password-reset instructions for your Winning Tips account.", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() { return <ForgotPasswordForm />; }
