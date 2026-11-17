import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export function hash(password: string) {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function compare(password: string, passwordHash: string) {
  return bcrypt.compareSync(password, passwordHash);
}
