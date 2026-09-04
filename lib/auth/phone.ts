const trunkPrefixDialCodes = ["+233", "+234", "+254", "+27", "+44"] as const;

export function removeLeadingTrunkZero(value: string) {
  return value.replace(/^\s*0[\s()-]*/, "");
}

export function normalizeInternationalPhone(value: string) {
  const compact = value.trim().replace(/[ ()-]/g, "");
  const dialCode = trunkPrefixDialCodes.find((dial) => compact.startsWith(dial));

  if (!dialCode) return compact;

  const localNumber = removeLeadingTrunkZero(compact.slice(dialCode.length));
  return `${dialCode}${localNumber}`;
}
