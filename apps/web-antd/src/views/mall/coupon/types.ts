export interface CouponFormState {
  id?: string;
  title: string;
  discountPercentage: number | undefined;
  isDefault: number;
}

export function emptyCouponForm(): CouponFormState {
  return {
    title: '',
    discountPercentage: undefined,
    isDefault: 0,
  };
}
