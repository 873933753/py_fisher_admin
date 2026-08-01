export const ADMIN_PHONE_PATTERN = /^1[3-9]\d{9}$/;

const ADMIN_ROLE_LABELS: Record<string, string> = {
  operator: '运营',
};

export function formatAdminRoleLabel(role?: string): string {
  const value = role?.trim();
  if (!value) {
    return '—';
  }
  return ADMIN_ROLE_LABELS[value] ?? value;
}

export function getAdminDisabledLabel(isDisabled: boolean): string {
  return isDisabled ? '已禁用' : '启用';
}

export function getAdminDisabledTagColor(isDisabled: boolean): string {
  return isDisabled ? 'error' : 'success';
}
