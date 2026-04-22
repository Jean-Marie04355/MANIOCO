export enum UserRole {
  CLIENT = 'CLIENT',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export const ROLE_LABELS = {
  [UserRole.CLIENT]: 'Client',
  [UserRole.SELLER]: 'Vendeur',
  [UserRole.ADMIN]: 'Administrateur',
  [UserRole.SUPER_ADMIN]: 'Super Administrateur',
};
