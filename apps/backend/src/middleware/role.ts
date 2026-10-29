export function requireUser(user: { id: string; role: string } | null | undefined) {
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function requireRole(user: { role: string } | null | undefined, allowed: string[]) {
  if (!user) throw new Error("UNAUTHORIZED");
  if (!allowed.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}
