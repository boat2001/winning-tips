import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyHmacSha512(rawBody: string, signature: string | null, secret?: string) {
  if (!secret || !signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
}
