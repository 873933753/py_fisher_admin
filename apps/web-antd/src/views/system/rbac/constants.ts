const ROLE_LABELS: Record<string, string> = {
  operator: '运营',
  super_admin: '超级管理员',
};

const GROUP_LABELS: Record<string, string> = {
  admin: '后台账号',
  rbac: '权限管理',
  upload: '上传',
  user: '用户',
};

export function formatRoleLabel(role?: string): string {
  const value = role?.trim();
  if (!value) {
    return '—';
  }
  return ROLE_LABELS[value] ?? value;
}

export function formatPermissionGroupLabel(groupName?: string): string {
  const value = groupName?.trim();
  if (!value) {
    return '其他';
  }
  return GROUP_LABELS[value] ?? value;
}
