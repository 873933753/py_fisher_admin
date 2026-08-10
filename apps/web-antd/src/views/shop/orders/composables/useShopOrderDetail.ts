import type { AdminShopOrderApi } from '#/api/core/admin-shop-orders';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { message } from 'ant-design-vue';

import { getShopOrderApi } from '#/api/core/admin-shop-orders';
import {
  markListRestore,
  SHOP_ORDER_LIST_ROUTE_NAME,
} from '#/composables/useMallListRestore';

export function useShopOrderDetail() {
  const route = useRoute();
  const router = useRouter();

  const pageLoading = ref(false);
  const detail = ref<AdminShopOrderApi.OrderDetail | null>(null);

  const orderId = computed(() => {
    const raw = route.params.id;
    const value = Array.isArray(raw) ? raw[0] : raw;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  });

  async function fetchDetail() {
    if (!orderId.value) {
      message.error('缺少订单 ID');
      return;
    }

    pageLoading.value = true;
    try {
      detail.value = await getShopOrderApi(orderId.value);
    } catch {
      detail.value = null;
    } finally {
      pageLoading.value = false;
    }
  }

  function goBack() {
    markListRestore(SHOP_ORDER_LIST_ROUTE_NAME, {
      mode: 'keep',
      refresh: false,
    });
    router.push({ name: SHOP_ORDER_LIST_ROUTE_NAME });
  }

  onMounted(() => {
    void fetchDetail();
  });

  return {
    detail,
    goBack,
    pageLoading,
  };
}
