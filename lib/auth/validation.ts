import { z } from "zod";
import { normalizeInternationalPhone } from "@/lib/auth/phone";

const email = z.string().trim().toLowerCase().email().max(254);
const username = z.string().trim().toLowerCase().min(3).max(30).regex(/^[a-z0-9_-]+$/, "Use only letters, numbers, underscores, or hyphens.");
const password = z.string().min(8).max(72).refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Password must be at most 72 UTF-8 bytes.").refine((value) => /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value), "Use uppercase, lowercase, and a number.");

export const registerSchema = z.object({
  username,
  email,
  phone: z.string().trim().min(7, "Enter a valid phone number.").max(30).regex(/^\+?[0-9 ()-]+$/, "Enter a valid phone number.").transform(normalizeInternationalPhone),
  password,
  confirmPassword: z.string(),
  ageConfirmed: z.literal("on", { error: "Winning Tips is for adults. Confirm you are 18 or older to continue." }),
  termsAccepted: z.literal("on", { error: "You must agree to the Terms of Service and Privacy Policy." }),
}).refine((data) => data.password === data.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] });

/**
 * The identity a member can change about themselves from the profile screen:
 * the name shown on their card and the handle their posts carry.
 *
 * The handle reuses the registration rule, so a name that could never have
 * been registered cannot be switched to later either.
 */
export const identitySchema = z.object({
  displayName: z.string().trim().min(2, "Enter a name of at least 2 characters.").max(80),
  username,
});

export const loginSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(3).max(254),
  password: z.string().min(1).max(72),
});

export const profileSchema = z.object({
  displayName: z.string().trim().max(80).optional().transform((value) => value || null),
  phone: z.string().trim().max(30).optional().transform((value) => value || null),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  password,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] });
