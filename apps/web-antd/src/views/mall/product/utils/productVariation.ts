import type {
  ProductSkuAttributeRow,
  ProductVariationRow,
} from '../types/product';

import {
  getFirstSkuOptionMediaPreviewUrlForVariation,
  getVariationRowPreviewUrl,
  resolveOssPreviewUrl,
} from './productMedia';

/** 与维度编辑处一致：去空白、小写后比较是否同名 */
function skuAttrNameKey(name: string) {
  return name.trim().toLowerCase();
}

/** 多属性开启时用于校验：非空属性名不得重复 */
export function hasDuplicateSkuAttributeNames(
  rows: ProductSkuAttributeRow[],
): boolean {
  const seen = new Set<string>();
  for (const r of rows) {
    const k = skuAttrNameKey(r.name);
    if (!k) continue;
    if (seen.has(k)) return true;
    seen.add(k);
  }
  return false;
}

/**
 * 根据 skuAttributes 派生 multiSkuEnabled：
 * 至少 1 个属性 name 非空且至少有 1 个 option.label 非空
 */
export function deriveMultiSkuEnabled(rows: ProductSkuAttributeRow[]): boolean {
  return rows.some(
    (r) => r.name.trim() !== '' && r.options.some((o) => o.label.trim() !== ''),
  );
}

/** 用于合并刷新前后的行数据 */
export function variationSignature(attrs: Record<string, string>): string {
  return Object.keys(attrs)
    .toSorted()
    .map((k) => `${k}:${attrs[k]}`)
    .join('|');
}

function cartesian(valueArrays: string[][]): string[][] {
  let acc: string[][] = [[]];
  for (const curr of valueArrays) {
    acc = acc.flatMap((prefix) => curr.map((c) => [...prefix, c]));
  }
  return acc;
}

/**
 * 根据「属性名 + 选项数组」计算所有 SKU 组合（笛卡尔积）。
 * 忽略 name 为空或 options 全空的维度；options 内 label 为空也跳过。
 */
export function skuComboAttrs(
  rows: ProductSkuAttributeRow[],
): Record<string, string>[] {
  const active = rows
    .map((r) => ({
      name: r.name.trim(),
      values: r.options.map((o) => o.label.trim()).filter(Boolean),
    }))
    .filter((r) => r.name && r.values.length > 0);

  if (active.length === 0) return [];

  const combos = cartesian(active.map((r) => r.values));
  return combos.map((vals) => {
    const attrs: Record<string, string> = {};
    active.forEach((a, i) => {
      const v = vals.at(i);
      if (v !== undefined) attrs[a.name] = v;
    });
    return attrs;
  });
}

function newVariationId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `var-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 按属性顺序匹配当前变体组合，取各维度对应选项的首张可预览图。
 * 例如图片挂在「尺码」上时，red+M 会继承 M 的选项图，而非只看第一个「颜色」维度。
 */
export function pickVariationPreviewFromSkuAttributes(
  skuAttributes: ProductSkuAttributeRow[],
  attrs: Record<string, string>,
): string | undefined {
  for (const row of skuAttributes) {
    const name = row.name.trim();
    if (!name) continue;
    const label = (attrs[name] ?? '').trim();
    if (!label) continue;
    const opt = row.options.find((o) => o.label.trim() === label);
    if (!opt) continue;
    const preview = getFirstSkuOptionMediaPreviewUrlForVariation(opt.images);
    if (preview) return preview;
  }
  return undefined;
}

function pickInheritedMainImage(
  skuAttributes: ProductSkuAttributeRow[],
  attrs: Record<string, string>,
): string | undefined {
  return pickVariationPreviewFromSkuAttributes(skuAttributes, attrs);
}

function normalizeKeptVariationImageUrls(urls: string[]): string[] {
  const raw = urls[0]?.trim();
  if (!raw) return [];
  const preview = resolveOssPreviewUrl(raw) ?? getVariationRowPreviewUrl(urls);
  return preview ? [preview] : [];
}

/** 去掉已不在当前属性笛卡尔积内的排除项，避免列表无限增长 */
export function pruneExcludedVariationSignatures(
  skuAttributes: ProductSkuAttributeRow[],
  excluded: string[],
  precomputedCombos?: Record<string, string>[],
): string[] {
  const combos = precomputedCombos ?? skuComboAttrs(skuAttributes);
  const valid = new Set(combos.map((attrs) => variationSignature(attrs)));
  return excluded.filter((sig) => valid.has(sig));
}

/** 记录用户在变体组合表中删除的组合，完成/保存后不再自动补回 */
export function excludeVariationSignature(
  excluded: string[],
  attrs: Record<string, string>,
): string[] {
  const sig = variationSignature(attrs);
  return excluded.includes(sig) ? excluded : [...excluded, sig];
}

/**
 * 详情回显：规格维度仍是全量选项，但 specSkuMap 可能少于笛卡尔积；
 * 未出现在 loaded 中的组合视为已排除，避免 rebuild 补全。
 */
export function computeExcludedVariationSignatures(
  skuAttributes: ProductSkuAttributeRow[],
  loaded: ProductVariationRow[],
): string[] {
  const loadedSigs = new Set(loaded.map((r) => variationSignature(r.attrs)));
  return skuComboAttrs(skuAttributes)
    .map((attrs) => variationSignature(attrs))
    .filter((sig) => !loadedSigs.has(sig));
}

/**
 * 属性变更后重建变体表：
 * 1) 相同属性组合的旧行保留库存、价格、SKU、selected、imageOverride。
 * 2) 主图：imageOverride=true（变体表手改）时保留旧 imageUrls；否则始终跟选项图继承，无图则为空数组。
 * 3) 新增行同样根据继承规则填充主图，imageOverride 默认 false。
 * 4) excludedVariationSignatures 中的组合不会自动生成（用户删行）。
 */
export function rebuildVariations(
  skuAttributes: ProductSkuAttributeRow[],
  prev: ProductVariationRow[],
  excluded: string[] = [],
): ProductVariationRow[] {
  const allCombos = skuComboAttrs(skuAttributes);
  const excludedSet = new Set(
    pruneExcludedVariationSignatures(skuAttributes, excluded, allCombos),
  );
  const combos = allCombos.filter(
    (attrs) => !excludedSet.has(variationSignature(attrs)),
  );
  const prevMap = new Map(prev.map((r) => [variationSignature(r.attrs), r]));

  return combos.map((attrs) => {
    const key = variationSignature(attrs);
    const old = prevMap.get(key);
    const inherited = pickInheritedMainImage(skuAttributes, attrs);

    if (old) {
      const keptUrls = normalizeKeptVariationImageUrls(old.imageUrls);
      const keepUserImage = old.imageOverride === true && keptUrls.length > 0;
      let imageUrls: string[] = [];
      if (keepUserImage) {
        imageUrls = keptUrls;
      } else if (inherited) {
        imageUrls = [inherited];
      }
      return {
        ...old,
        attrs: { ...attrs },
        imageUrls,
        imageOverride: keepUserImage,
      };
    }
    return {
      id: newVariationId(),
      selected: false,
      attrs,
      imageUrls: inherited ? [inherited] : [],
      imageOverride: false,
      skuCode: '',
      quantity: 1,
      originalPrice: undefined,
      price: undefined,
    };
  });
}

function variationRowLabel(row: ProductVariationRow): string {
  const parts = Object.values(row.attrs)
    .map((v) => v.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : '未命名变体';
}

/** 变体组合价库：返回 null 表示通过，否则为提示文案 */
export function getVariationPricingBlockReason(
  rows: ProductVariationRow[],
): null | string {
  if (rows.length === 0) {
    return '请完善变体组合后再完成';
  }

  for (const row of rows) {
    const label = variationRowLabel(row);
    const { price, quantity, originalPrice } = row;

    if (price === undefined || Number.isNaN(price) || price <= 0) {
      return `变体【${label}】请填写有效售价（大于 0）`;
    }

    if (quantity === undefined || Number.isNaN(quantity) || quantity < 0) {
      return `变体【${label}】请填写有效库存`;
    }

    if (
      originalPrice !== undefined &&
      !Number.isNaN(originalPrice) &&
      originalPrice < price
    ) {
      return `变体【${label}】原价不能低于售价`;
    }
  }

  return null;
}
