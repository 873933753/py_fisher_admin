const ROLE_LABELS: Record<string, string> = {
  operator: '运营',
  super_admin: '超级管理员',
};

export const SUPER_ADMIN_ROLE_CODE = 'super_admin';

export function formatRoleLabel(role?: string): string {
  const value = role?.trim();
  if (!value) {
    return '—';
  }
  return ROLE_LABELS[value] ?? value;
}

export function isSuperAdminRole(roleCode?: string) {
  return roleCode === SUPER_ADMIN_ROLE_CODE;
}
