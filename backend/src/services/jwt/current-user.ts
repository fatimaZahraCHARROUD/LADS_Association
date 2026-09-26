import { UnauthorizedException } from '@nestjs/common';

export function getUserId(req: {
  user?: { userId?: string; sub?: string };
}): string {
  const id = req.user?.userId ?? req.user?.sub;
  if (!id) throw new UnauthorizedException();
  return String(id);
}
