import type { CouponFormState } from '../types';

import type { CouponTemplateApi } from '#/api/core/couponTemplate';

export function recordToCouponForm(
  record: CouponTemplateApi.CouponTemplateRecord,
): CouponFormState {
  return {
    id: record.id,
    title: record.title ?? '',
    discountPercentage: record.discountPercentage,
    isDefault: Number(record.isDefault) === 1 ? 1 : 0,
  };
}

export function couponFormToSaveBody(
  form: CouponFormState,
): CouponTemplateApi.SaveOrUpdBody {
  const body: CouponTemplateApi.SaveOrUpdBody = {
    title: form.title.trim(),
    discountPercentage: Number(form.discountPercentage),
    isDefault: Number(form.isDefault) === 1 ? 1 : 0,
  };
  if (form.id) {
    body.id = form.id;
  }
  return body;
}

export { emptyCouponForm } from '../types';
