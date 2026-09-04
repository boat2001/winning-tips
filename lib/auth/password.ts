import bcrypt from "bcryptjs";

const bcryptRounds = 12;
const dummyHash = "$2b$12$AnZAe4Z/QwGNNAXUulhiN.QIKrh9FMihNDAAnImcCq7YQThIk.kIC";

export function hashPassword(password: string) {
  return bcrypt.hash(password, bcryptRounds);
}

export function verifyPassword(password: string, passwordHash?: string | null) {
  return bcrypt.compare(password, passwordHash?.startsWith("$2") ? passwordHash : dummyHash);
}
