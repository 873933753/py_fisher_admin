export const ADMIN_PHONE_PATTERN = /^1[3-9]\d{9}$/;

export function getAdminDisabledLabel(isDisabled: boolean): string {
  return isDisabled ? '已禁用' : '启用';
}

export function getAdminDisabledTagColor(isDisabled: boolean): string {
  return isDisabled ? 'error' : 'success';
}
