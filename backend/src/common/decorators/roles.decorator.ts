import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  INGENIERO = 'ingeniero',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// Matriz de permisos por módulo/acción
export const PERMISSIONS_MATRIX = {
  projects: {
    create: [UserRole.ADMIN, UserRole.EDITOR, UserRole.INGENIERO],
    read: [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER, UserRole.INGENIERO],
    update: [UserRole.ADMIN, UserRole.EDITOR, UserRole.INGENIERO],
    delete: [UserRole.ADMIN],
    export: [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER, UserRole.INGENIERO],
  },
  normatives: {
    read: [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER, UserRole.INGENIERO],
    update: [UserRole.ADMIN, UserRole.INGENIERO],
    create: [UserRole.ADMIN, UserRole.INGENIERO],
  },
  exports: {
    read: [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER, UserRole.INGENIERO],
    create: [UserRole.ADMIN, UserRole.EDITOR, UserRole.INGENIERO],
    delete: [UserRole.ADMIN, UserRole.EDITOR, UserRole.INGENIERO],
    download: [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER, UserRole.INGENIERO],
  },
  ai: {
    evaluate: [UserRole.ADMIN, UserRole.EDITOR, UserRole.INGENIERO],
    suggestions: [UserRole.ADMIN, UserRole.EDITOR, UserRole.INGENIERO],
    health: [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER, UserRole.INGENIERO],
  },
};
