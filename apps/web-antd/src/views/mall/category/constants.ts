/** 分类最大层级（含顶级） */
export const MAX_CATEGORY_LEVEL = 3

const LEVEL_ZH: Record<number, string> = {
  1: '一',
  2: '二',
  3: '三',
}

/** 层级数字转中文（用于「新增二级分类」等） */
export function formatCategoryLevelZh(level: number): string {
  return LEVEL_ZH[level] ?? String(level)
}
