<script lang="ts" setup>
import type { ProductBizPayload } from '../types/product';
import type { CategoryCascaderOption } from '../utils/categoryOptions';

import type { SysDictApi } from '#/api/core/sysDict';

import { computed, provide, reactive, ref, toRaw, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, message, Spin } from 'ant-design-vue';

import {
  getProductInfoApi,
  initProductInfoApi,
  saveOrUpdProductApi,
} from '#/api/core/product';
import { findJerseyTypeTreeApi } from '#/api/core/sysDict';
import {
  MALL_PRODUCT_LIST_ROUTE_NAME,
  markListRestore,
} from '#/composables/useMallListRestore';

import ProductFormBody from '../components/ProductFormBody.vue';
import {
  mallProductFormBizKey,
  mallProductFormMetaKey,
  mallProductFormOptionsKey,
} from '../injectionKeys';
import {
  findCategoryPathByLeafId,
  findFirstLeafCategoryId,
  mapJerseyTreeToCascaderOptions,
} from '../utils/categoryOptions';
import { mapProductDetailToForm } from '../utils/productDetailMapper';
import {
  createEmptyProductBiz,
  createEmptyProductFormOptions,
  mapInitToAddBiz,
  mapInitToFormOptions,
} from '../utils/productInitMapper';
import {
  getMainImgUrlsForSave,
  hasIncompleteMediaUploads,
  hasIncompleteSkuOptionMediaInAttributes,
} from '../utils/productMedia';
import { assembleProductSaveOrUpdBody } from '../utils/productSaveApiMapper';
import { hasDuplicateSkuAttributeNames } from '../utils/productVariation';

defineOptions({ name: 'MallProductForm' });

const route = useRoute();
const router = useRouter();

const mode = computed(() =>
  route.path.startsWith('/mall/product/edit/') ? 'edit' : 'add',
);

const pageTitle = computed(() =>
  mode.value === 'add' ? '新增商品' : '编辑商品',
);

const pageLoading = ref(true);
const saving = ref(false);
const categoryTree = ref<SysDictApi.JerseyTypeTreeNode[]>([]);
const categoryCascaderOptions = ref<CategoryCascaderOption[]>([]);
const formOptions = ref(createEmptyProductFormOptions());

const formMeta = reactive({
  categoryId: '',
  isHot: false,
  isNew: false,
  sku: '',
  status: 'on' as 'off' | 'on',
  title: '',
});

const formBiz = ref<ProductBizPayload>(createEmptyProductBiz());

provide(mallProductFormBizKey, formBiz);
provide(mallProductFormMetaKey, formMeta);
provide(mallProductFormOptionsKey, formOptions);

const editingId = ref<null | string>(null);

function resolveRouteProductId(): string | undefined {
  const rawId = route.params.id;
  if (typeof rawId === 'string') return rawId;
  if (Array.isArray(rawId)) return rawId[0];
  return undefined;
}

function defaultCategoryId() {
  const q = route.query.categoryId;
  if (typeof q === 'string' && q) return q;
  return findFirstLeafCategoryId(categoryTree.value) ?? '';
}

function resolveCategoryPath(leafId: string) {
  return findCategoryPathByLeafId(categoryTree.value, leafId);
}

async function loadCategoryOptions() {
  try {
    const tree = await findJerseyTypeTreeApi();
    categoryTree.value = tree ?? [];
    categoryCascaderOptions.value = mapJerseyTreeToCascaderOptions(
      categoryTree.value,
    );
  } catch {
    categoryTree.value = [];
    categoryCascaderOptions.value = [];
  }
}

function resetFormMetaForAdd() {
  editingId.value = null;
  formMeta.title = '';
  formMeta.sku = '';
  formMeta.categoryId = defaultCategoryId();
  formMeta.isHot = false;
  formMeta.isNew = false;
  formMeta.status = 'on';
}

function resetFormMetaForEdit(id: string) {
  editingId.value = id;
  formMeta.title = '';
  formMeta.sku = '';
  formMeta.categoryId = defaultCategoryId();
  formMeta.isHot = false;
  formMeta.isNew = false;
  formMeta.status = 'on';
}

async function bootstrapFormPage() {
  pageLoading.value = true;
  try {
    const initPromise = initProductInfoApi();
    const categoryPromise = loadCategoryOptions();

    if (mode.value === 'add') {
      const [init] = await Promise.all([initPromise, categoryPromise]);
      formOptions.value = mapInitToFormOptions(init);
      resetFormMetaForAdd();
      formBiz.value = mapInitToAddBiz(init);
      return;
    }

    const id = resolveRouteProductId();
    if (!id) {
      message.error('缺少商品 ID');
      router.replace({ name: 'MallProduct' });
      return;
    }

    const [init, , detail] = await Promise.all([
      initPromise,
      categoryPromise,
      getProductInfoApi(id),
    ]);

    formOptions.value = mapInitToFormOptions(init);
    resetFormMetaForEdit(id);

    const mapped = mapProductDetailToForm(detail);
    formBiz.value = mapped.biz;
    formMeta.title = mapped.meta.title;
    formMeta.sku = mapped.meta.sku;
    formMeta.categoryId = mapped.meta.categoryId || defaultCategoryId();
    formMeta.isHot = mapped.meta.isHot;
    formMeta.isNew = mapped.meta.isNew;
    formMeta.status = mapped.meta.status;
  } catch {
    formOptions.value = createEmptyProductFormOptions();
    if (mode.value === 'add') {
      resetFormMetaForAdd();
      formBiz.value = createEmptyProductBiz();
    } else {
      const id = resolveRouteProductId();
      if (id) {
        message.error('加载商品详情失败');
        router.replace({ name: 'MallProduct' });
      }
    }
  } finally {
    pageLoading.value = false;
  }
}

watch(
  () => [route.path, route.params.id, route.query.categoryId] as const,
  () => {
    void bootstrapFormPage();
  },
  { immediate: true },
);

function goBack() {
  markListRestore(MALL_PRODUCT_LIST_ROUTE_NAME, {
    mode: 'keep',
    refresh: false,
  });
  router.push({ name: 'MallProduct' });
}

function goBackToListAfterSave() {
  if (mode.value === 'add') {
    markListRestore(MALL_PRODUCT_LIST_ROUTE_NAME, {
      mode: 'keep',
      refresh: true,
      resetFilters: true,
    });
  } else {
    markListRestore(MALL_PRODUCT_LIST_ROUTE_NAME, {
      mode: 'keep',
      refresh: true,
    });
  }
  router.push({ name: 'MallProduct' });
}

async function handleSave() {
  if (!formMeta.title.trim() || !formMeta.categoryId) {
    message.warning('请填写标题并选择分类');
    return;
  }

  const categoryPath = resolveCategoryPath(formMeta.categoryId);
  if (!categoryPath || categoryPath.length !== 3) {
    message.warning('请选择完整的三级分类');
    return;
  }

  if (
    formBiz.value.skuAttributes.length > 0 &&
    hasDuplicateSkuAttributeNames(formBiz.value.skuAttributes)
  ) {
    message.warning('多属性维度名称不能重复，请修改后再保存');
    return;
  }

  if (hasIncompleteMediaUploads(formBiz.value.mediaItems)) {
    message.warning('商品素材仍在上传中或上传失败，请处理后再保存');
    return;
  }

  if (hasIncompleteSkuOptionMediaInAttributes(formBiz.value.skuAttributes)) {
    message.warning('规格选项图片仍在上传中或上传失败，请处理后再保存');
    return;
  }

  if (getMainImgUrlsForSave(formBiz.value.mediaItems).length === 0) {
    message.warning('请至少上传一个商品主图或视频');
    return;
  }

  const { salePrice, stock } = formBiz.value.singleSku;
  if (salePrice === undefined || Number.isNaN(salePrice) || salePrice <= 0) {
    message.warning('请填写售价');
    return;
  }
  if (stock === undefined || Number.isNaN(stock) || stock < 0) {
    message.warning('请填写库存');
    return;
  }

  if (
    formBiz.value.multiSkuEnabled &&
    formBiz.value.skuAttributes.length === 0
  ) {
    message.warning('请填写多属性，否则请关闭多属性开关');
    return;
  }

  if (!formBiz.value.shippingFree) {
    const fee = formBiz.value.shippingFee;
    if (fee === undefined || Number.isNaN(fee) || fee <= 0) {
      message.warning('不包邮时请填写运费');
      return;
    }
  }

  if (formBiz.value.returnsAllowed) {
    const days = formBiz.value.returnWithinDays;
    if (days === undefined || Number.isNaN(days) || days <= 0) {
      message.warning('允许退货时请选择可退货天数');
      return;
    }
  }

  const rawBiz = toRaw(formBiz.value) as ProductBizPayload;
  const apiBody = assembleProductSaveOrUpdBody({
    biz: rawBiz,
    formMeta: {
      isHot: formMeta.isHot,
      isNew: formMeta.isNew,
      title: formMeta.title.trim(),
    },
    dictCategoryPath: categoryPath,
    allowBuyCountryMap: formOptions.value.allowBuyCountryMap,
    productId:
      mode.value === 'edit' && editingId.value ? editingId.value : null,
  });

  if (apiBody.product.isMultiAttr === 1 && apiBody.skuList.length === 0) {
    message.warning('多规格商品请完善规格维度与 SKU 组合后再保存');
    return;
  }

  saving.value = true;
  try {
    await saveOrUpdProductApi(apiBody);
  } catch {
    return;
  } finally {
    saving.value = false;
  }

  message.success(mode.value === 'add' ? '已新增' : '已保存');
  goBackToListAfterSave();
}
</script>

<template>
  <Page :title="pageTitle">
    <template #extra>
      <Button @click="goBack">返回列表</Button>
    </template>

    <Spin :spinning="pageLoading">
      <ProductFormBody
        v-if="!pageLoading"
        :category-cascader-options="categoryCascaderOptions"
        :resolve-category-path="resolveCategoryPath"
      />
    </Spin>

    <div class="mall-product-form-footer">
      <Button
        type="primary"
        :disabled="pageLoading"
        :loading="saving"
        @click="handleSave"
      >
        保存
      </Button>
    </div>
  </Page>
</template>

<style scoped>
.mall-product-form-footer {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  padding-bottom: 10px;
  margin-top: 10px;

  /* border-top: 1px solid rgb(226 232 240); */
}
</style>
