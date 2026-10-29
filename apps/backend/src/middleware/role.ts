export const requireRole = (allowed: string[]) => (req: any) => {
  if (!req.user || !allowed.includes(req.user.role)) {
    throw new Error("FORBIDDEN");
  }
};
