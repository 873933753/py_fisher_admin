import type { CouponTemplateApi } from '#/api/core/couponTemplate';

export function formatDiscountPercentage(value: number): string {
  return `${value}%`;
}

export function isDefaultCoupon(
  isDefault: CouponTemplateApi.CouponTemplateRecord['isDefault'],
): boolean {
  return Number(isDefault) === 1;
}
