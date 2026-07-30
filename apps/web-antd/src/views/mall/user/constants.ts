export function getUserDisabledLabel(isDisabled: boolean): string {
  return isDisabled ? '已禁用' : '正常';
}

export function getUserDisabledTagColor(isDisabled: boolean): string {
  return isDisabled ? 'error' : 'success';
}
