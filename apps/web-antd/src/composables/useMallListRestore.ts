export const MALL_ORDER_LIST_ROUTE_NAME = 'MallOrder';
export const MALL_PRODUCT_LIST_ROUTE_NAME = 'MallProduct';
export const SHOP_ORDER_LIST_ROUTE_NAME = 'ShopOrders';
export const SHOP_PRODUCT_LIST_ROUTE_NAME = 'ShopProducts';
export const SHOP_REFUND_LIST_ROUTE_NAME = 'ShopRefunds';

export type MallListKeepRestorePlan = {
  mode: 'keep';
  refresh: boolean;
  resetFilters?: boolean;
};

export type MallListResetRestorePlan = {
  mode: 'reset';
};

export type MallListRestorePlan =
  | MallListKeepRestorePlan
  | MallListResetRestorePlan;

const restorePlanMap = new Map<string, MallListRestorePlan>();

export function markListRestore(
  routeName: string,
  plan: MallListRestorePlan,
): void {
  restorePlanMap.set(routeName, plan);
}

export function consumeListRestore(
  routeName: string,
): MallListRestorePlan | undefined {
  const plan = restorePlanMap.get(routeName);
  restorePlanMap.delete(routeName);
  return plan;
}

export function isMenuResetListNavigation(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    (state as { resetListOnMenu?: boolean }).resetListOnMenu === true
  );
}
