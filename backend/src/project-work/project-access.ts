import { BadRequestException } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

export type AuthUser = { id: string; isAdmin: boolean };

export const idOf = (v: any) => String(v?._id ?? v);

export const oid = (id: string) => {
  if (!isValidObjectId(id)) throw new BadRequestException('Identifiant invalide');
  return id;
};

export const isManagerOrAdmin = (project: any, user: AuthUser) =>
  user.isAdmin ||
  (project.managerIds ?? []).some((m: any) => idOf(m) === user.id);

export const isParticipant = (project: any, user: AuthUser) =>
  isManagerOrAdmin(project, user) ||
  (project.memberIds ?? []).some((m: any) => idOf(m) === user.id);

export const projectUserIds = (project: any): string[] => [
  ...(project.managerIds ?? []).map(idOf),
  ...(project.memberIds ?? []).map(idOf),
];
