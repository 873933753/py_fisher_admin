import type { ShopProductFormState } from '../types';

import type { AdminShopProductApi } from '#/api/core/admin-shop-products';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { message } from 'ant-design-vue';

import {
  createShopProductApi,
  getShopProductApi,
  updateShopProductApi,
} from '#/api/core/admin-shop-products';
import {
  markListRestore,
  SHOP_PRODUCT_LIST_ROUTE_NAME,
} from '#/composables/useMallListRestore';

import {
  SHOP_PRODUCT_DESCRIPTION_MAX,
  SHOP_PRODUCT_NAME_MAX,
} from '../constants';
import { emptyShopProductForm, mapProductToForm } from '../types';
import { yuanToCents } from '../utils/price';

export function useShopProductForm() {
  const route = useRoute();
  const router = useRouter();

  const mode = computed(() =>
    route.path.startsWith('/shop/products/edit/') ? 'edit' : 'add',
  );

  const pageTitle = computed(() =>
    mode.value === 'add' ? '新增商品' : '编辑商品',
  );

  const pageLoading = ref(true);
  const saving = ref(false);
  const formState = ref<ShopProductFormState>(emptyShopProductForm());
  const editingId = ref<null | number>(null);

  function resolveRouteProductId(): number | undefined {
    const rawId = route.params.id;
    const idStr = typeof rawId === 'string' ? rawId : rawId?.[0];
    if (!idStr) return undefined;
    const id = Number(idStr);
    return Number.isFinite(id) && id > 0 ? id : undefined;
  }

  function validateForm(): boolean {
    const name = formState.value.name.trim();
    if (!name) {
      message.warning('请输入商品名称');
      return false;
    }
    if (name.length > SHOP_PRODUCT_NAME_MAX) {
      message.warning(`商品名称不能超过 ${SHOP_PRODUCT_NAME_MAX} 个字符`);
      return false;
    }

    const description = formState.value.description.trim();
    if (description.length > SHOP_PRODUCT_DESCRIPTION_MAX) {
      message.warning(
        `商品描述不能超过 ${SHOP_PRODUCT_DESCRIPTION_MAX} 个字符`,
      );
      return false;
    }

    const priceYuan = formState.value.priceYuan;
    if (priceYuan === undefined || priceYuan <= 0) {
      message.warning('请输入大于 0 的售价');
      return false;
    }

    const stock = formState.value.stock;
    if (stock === undefined || stock < 0) {
      message.warning('库存不能小于 0');
      return false;
    }

    if (!formState.value.cover_url.trim()) {
      message.warning('请上传商品主图');
      return false;
    }

    return true;
  }

  function buildCreatePayload(): AdminShopProductApi.CreateParams {
    return {
      name: formState.value.name.trim(),
      description: formState.value.description.trim() || undefined,
      price: yuanToCents(formState.value.priceYuan!),
      stock: formState.value.stock ?? 0,
      cover_url: formState.value.cover_url.trim(),
    };
  }

  function buildUpdatePayload(): AdminShopProductApi.UpdateParams {
    return {
      name: formState.value.name.trim(),
      description: formState.value.description.trim() || undefined,
      price: yuanToCents(formState.value.priceYuan!),
      stock: formState.value.stock ?? 0,
      cover_url: formState.value.cover_url.trim(),
      status: formState.value.status,
    };
  }

  async function loadDetail() {
    const productId = resolveRouteProductId();
    if (!productId) {
      message.error('商品 ID 无效');
      router.replace({ name: SHOP_PRODUCT_LIST_ROUTE_NAME });
      return;
    }

    pageLoading.value = true;
    try {
      const product = await getShopProductApi(productId);
      editingId.value = product.id;
      formState.value = mapProductToForm(product);
    } catch {
      router.replace({ name: SHOP_PRODUCT_LIST_ROUTE_NAME });
    } finally {
      pageLoading.value = false;
    }
  }

  async function initPage() {
    pageLoading.value = true;
    try {
      if (mode.value === 'edit') {
        await loadDetail();
      } else {
        editingId.value = null;
        formState.value = emptyShopProductForm();
      }
    } finally {
      pageLoading.value = false;
    }
  }

  function goBack(refresh = true) {
    markListRestore(SHOP_PRODUCT_LIST_ROUTE_NAME, {
      mode: 'keep',
      refresh,
    });
    router.push({ name: SHOP_PRODUCT_LIST_ROUTE_NAME });
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    saving.value = true;
    try {
      if (mode.value === 'add') {
        await createShopProductApi(buildCreatePayload());
        message.success('创建成功');
      } else if (editingId.value !== null) {
        await updateShopProductApi(editingId.value, buildUpdatePayload());
        message.success('更新成功');
      }
      goBack(true);
    } finally {
      saving.value = false;
    }
  }

  function handleCancel() {
    goBack(false);
  }

  onMounted(() => {
    void initPage();
  });

  return {
    formState,
    handleCancel,
    handleSubmit,
    mode,
    pageLoading,
    pageTitle,
    saving,
  };
}
