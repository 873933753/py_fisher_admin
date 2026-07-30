<script lang="ts" setup>
import type { OrderApi } from '#/api/core/order';
import type { OrderRefundApplyApi } from '#/api/core/orderRefundApply';

import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  Checkbox,
  Drawer,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Select,
  Spin,
} from 'ant-design-vue';

import {
  backRefundItemApi,
  findReasonTypeApi,
} from '#/api/core/orderRefundApply';
import ProductReviewMediaUpload from '#/views/mall/product-review/components/ProductReviewMediaUpload.vue';
import { REVIEW_FILE_MAX_COUNT } from '#/views/mall/product-review/constants';

import { formatMoneyAmount, formatSpecData } from '../constants';

const props = defineProps<{
  open: boolean;
  order: null | OrderApi.OrderRecord;
}>();

const emit = defineEmits<{
  submitted: [];
  'update:open': [value: boolean];
}>();

const REFUND_TYPE_OPTIONS = [
  { value: 1, label: '全额退款' },
  { value: 2, label: '部分退款' },
] as const;

const drawerOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const loading = ref(false);
const submitting = ref(false);
const reasonTypeMap = ref<Record<string, string>>({});
const reasonType = ref<string | undefined>(undefined);
const refundType = ref<1 | 2>(1);
const refundAmount = ref<number | undefined>(undefined);
const handleNote = ref('');
const mediaUploadRef = ref<InstanceType<
  typeof ProductReviewMediaUpload
> | null>(null);

/** 部分退款时勾选的商品：itemId -> refundCount */
const selectedItems = reactive<Record<string, number>>({});

const orderId = computed(() => props.order?.orderId?.trim() ?? '');

const orderLabel = computed(
  () => props.order?.orderNo?.trim() || orderId.value || '—',
);

const currency = computed(() => props.order?.currency);

const orderItems = computed(() => props.order?.myOrderItemList ?? []);

const reasonTypeOptions = computed(() =>
  Object.entries(reasonTypeMap.value).map(([value, label]) => ({
    value,
    label,
  })),
);

const showPartialItemSelection = computed(() => refundType.value === 2);

const showRefundAmount = computed(() => refundType.value === 2);

function getOrderItemId(item: OrderApi.OrderItemRecord): string {
  const raw =
    item.id ??
    (item as OrderApi.OrderItemRecord & { myOrderItemId?: unknown })
      .myOrderItemId;
  if (raw === undefined || raw === null) {
    return '';
  }
  return String(raw).trim();
}

function getSelectPopupContainer(triggerNode: HTMLElement): HTMLElement {
  return (
    triggerNode.closest('.ant-drawer-body') ??
    triggerNode.parentElement ??
    document.body
  );
}

function resetForm() {
  reasonType.value = undefined;
  refundType.value = 1;
  refundAmount.value = undefined;
  handleNote.value = '';
  Object.keys(selectedItems).forEach((key) => {
    delete selectedItems[key];
  });
  mediaUploadRef.value?.resetSlots();
}

function isItemSelected(itemId: string): boolean {
  if (!itemId) {
    return false;
  }
  return selectedItems[itemId] !== undefined;
}

function getItemRefundCount(item: OrderApi.OrderItemRecord): number {
  const itemId = getOrderItemId(item);
  if (!itemId) {
    return 1;
  }
  return selectedItems[itemId] ?? item.quantity;
}

function handleItemCheckChange(
  item: OrderApi.OrderItemRecord,
  checked: boolean,
) {
  const itemId = getOrderItemId(item);
  if (!itemId) {
    return;
  }
  if (checked) {
    selectedItems[itemId] = item.quantity;
    return;
  }
  delete selectedItems[itemId];
}

function handleItemRefundCountChange(
  item: OrderApi.OrderItemRecord,
  value: null | number | string,
) {
  const itemId = getOrderItemId(item);
  if (!itemId || !isItemSelected(itemId)) {
    return;
  }
  const max = item.quantity;
  const count = value === null || value === undefined ? 1 : Number(value);
  selectedItems[itemId] = Math.min(Math.max(1, count), max);
}

function buildFullRefundItemList(): OrderRefundApplyApi.BackRefundItemEntry[] {
  return orderItems.value
    .map((item) => ({
      myOrderItemId: getOrderItemId(item),
      refundCount: item.quantity,
    }))
    .filter((entry) => entry.myOrderItemId && entry.refundCount > 0);
}

function buildPartialRefundItemList(): OrderRefundApplyApi.BackRefundItemEntry[] {
  return Object.entries(selectedItems)
    .map(([myOrderItemId, refundCount]) => ({
      myOrderItemId,
      refundCount,
    }))
    .filter((entry) => entry.myOrderItemId && entry.refundCount > 0);
}

async function loadDrawerData() {
  if (!orderId.value) {
    message.warning('订单 ID 不存在');
    drawerOpen.value = false;
    return;
  }

  loading.value = true;
  resetForm();

  try {
    reasonTypeMap.value = (await findReasonTypeApi()) ?? {};
  } catch {
    drawerOpen.value = false;
  } finally {
    loading.value = false;
  }
}

function validateSubmit(): boolean {
  if (!orderId.value) {
    message.warning('订单信息不完整');
    return false;
  }

  if (!reasonType.value?.trim()) {
    message.warning('请选择退款原因');
    return false;
  }

  if (refundType.value === 2) {
    const itemList = buildPartialRefundItemList();
    if (itemList.length === 0) {
      message.warning('请至少选择一个退款商品');
      return false;
    }

    const amount = refundAmount.value;
    if (amount === undefined || amount === null || Number(amount) <= 0) {
      message.warning('请输入有效的退款金额');
      return false;
    }
  } else {
    const itemList = buildFullRefundItemList();
    if (itemList.length === 0) {
      message.warning('订单商品明细不存在');
      return false;
    }
  }

  const proofPics = mediaUploadRef.value?.getOssPaths() ?? [];
  if (proofPics.length > REVIEW_FILE_MAX_COUNT) {
    message.warning(`最多上传 ${REVIEW_FILE_MAX_COUNT} 个附件`);
    return false;
  }

  return true;
}

function buildPayload(): OrderRefundApplyApi.BackRefundItemParams {
  const payload: OrderRefundApplyApi.BackRefundItemParams = {
    orderId: orderId.value,
    reasonType: reasonType.value?.trim() ?? '',
    refundType: refundType.value,
    orderRefundItemList:
      refundType.value === 1
        ? buildFullRefundItemList()
        : buildPartialRefundItemList(),
  };

  const note = handleNote.value.trim();
  if (note) {
    payload.handleNote = note;
  }

  const proofPics = mediaUploadRef.value?.getOssPaths() ?? [];
  if (proofPics.length > 0) {
    payload.handleProofPics = proofPics;
  }

  if (refundType.value === 2) {
    payload.refundAmount = Number(refundAmount.value);
  }

  return payload;
}

async function doSubmit() {
  submitting.value = true;
  try {
    await backRefundItemApi(buildPayload());
    message.success('手动退款提交成功');
    drawerOpen.value = false;
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}

function handleSubmit() {
  if (!validateSubmit()) {
    return;
  }

  Modal.confirm({
    title: '确认手动退款',
    content: '一旦提交会给用户退款且无法撤销，请确认操作',
    okText: '确认退款',
    cancelText: '取消',
    okButtonProps: { danger: true },
    async onOk() {
      await doSubmit();
    },
  });
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      void loadDrawerData();
      return;
    }
    resetForm();
  },
);

watch(refundType, (value) => {
  if (value === 1) {
    refundAmount.value = undefined;
    Object.keys(selectedItems).forEach((key) => {
      delete selectedItems[key];
    });
  }
});
</script>

<template>
  <Drawer
    v-model:open="drawerOpen"
    :destroy-on-close="true"
    title="手动退款"
    width="640"
  >
    <Spin :spinning="loading">
      <div class="flex flex-col gap-5">
        <section class="text-sm">
          <div>
            <span class="text-muted-foreground">订单：</span>
            <span class="text-foreground">{{ orderLabel }}</span>
          </div>
          <div class="mt-1">
            <span class="text-muted-foreground">订单金额：</span>
            <span class="text-foreground">
              {{ formatMoneyAmount(order?.total, currency) }}
            </span>
          </div>
        </section>

        <section class="rounded-lg border border-border/60 p-4">
          <div class="flex flex-col gap-4">
            <div>
              <div class="mb-2 text-sm text-muted-foreground">退款类型</div>
              <Radio.Group v-model:value="refundType">
                <Radio
                  v-for="option in REFUND_TYPE_OPTIONS"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </Radio>
              </Radio.Group>
            </div>
          </div>
        </section>

        <section
          v-if="showPartialItemSelection && orderItems.length > 0"
          class="rounded-lg border border-border/60 p-4"
        >
          <div class="mb-3 text-sm font-medium text-foreground">
            退款商品 <span class="text-destructive">*</span>
          </div>
          <div class="flex flex-col gap-3">
            <div
              v-for="(item, index) in orderItems"
              :key="getOrderItemId(item) || `item-${index}`"
              class="flex gap-3 rounded-md bg-muted/30 p-3"
            >
              <Checkbox
                class="mt-1 shrink-0"
                :checked="isItemSelected(getOrderItemId(item))"
                @change="
                  (event) => handleItemCheckChange(item, event.target.checked)
                "
              />
              <div
                class="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-border bg-muted"
              >
                <Image
                  v-if="item.skuImage"
                  :height="64"
                  :preview="true"
                  :src="item.skuImage"
                  :width="64"
                  class="!h-16 !w-16 object-cover"
                />
              </div>
              <div class="min-w-0 flex-1 text-sm">
                <div class="font-medium text-foreground">
                  {{ item.productName || '—' }}
                </div>
                <div
                  v-if="formatSpecData(item.specData)"
                  class="mt-0.5 text-muted-foreground"
                >
                  {{ formatSpecData(item.specData) }}
                </div>
                <div class="mt-1 text-muted-foreground">
                  购买数量 {{ item.quantity }} · 单价
                  {{ formatMoneyAmount(item.productPrice, currency) }} · 小计
                  {{ formatMoneyAmount(item.subtotalAmount, currency) }}
                </div>
                <div
                  v-if="isItemSelected(getOrderItemId(item))"
                  class="mt-2 flex items-center gap-2"
                >
                  <span class="text-muted-foreground">退款数量</span>
                  <InputNumber
                    :max="item.quantity"
                    :min="1"
                    :precision="0"
                    :value="getItemRefundCount(item)"
                    @change="
                      (value) => handleItemRefundCountChange(item, value)
                    "
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-lg border border-border/60 p-4">
          <div class="flex flex-col gap-4">
            <div>
              <div class="mb-2 text-sm text-muted-foreground">
                退款原因 <span class="text-destructive">*</span>
              </div>
              <Select
                v-model:value="reasonType"
                allow-clear
                class="w-full"
                :get-popup-container="getSelectPopupContainer"
                :options="reasonTypeOptions"
                placeholder="请选择退款原因"
              />
            </div>

            <div v-if="showRefundAmount">
              <div class="mb-2 text-sm text-muted-foreground">
                退款金额 <span class="text-destructive">*</span>
              </div>
              <InputNumber
                v-model:value="refundAmount"
                class="w-full"
                :min="0"
                :placeholder="`请输入退款金额${currency ? `（${currency}）` : ''}`"
                :precision="2"
              />
            </div>

            <div>
              <div class="mb-2 text-sm text-muted-foreground">处理备注</div>
              <Input.TextArea
                v-model:value="handleNote"
                :auto-size="{ minRows: 2, maxRows: 5 }"
                placeholder="选填"
              />
            </div>

            <div>
              <div class="mb-2 text-sm text-muted-foreground">处理凭证</div>
              <ProductReviewMediaUpload ref="mediaUploadRef" />
              <div class="mt-1 text-xs text-muted-foreground">
                最多 {{ REVIEW_FILE_MAX_COUNT }} 个，支持图片与视频
              </div>
            </div>
          </div>
        </section>

        <section
          v-if="!showPartialItemSelection && orderItems.length > 0"
          class="rounded-lg border border-border/60 p-4"
        >
          <div class="mb-3 text-sm font-medium text-foreground">退款商品</div>
          <div class="flex flex-col gap-3">
            <div
              v-for="(item, index) in orderItems"
              :key="getOrderItemId(item) || `item-${index}`"
              class="flex gap-3 rounded-md bg-muted/30 p-3"
            >
              <div
                class="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-border bg-muted"
              >
                <Image
                  v-if="item.skuImage"
                  :height="64"
                  :preview="true"
                  :src="item.skuImage"
                  :width="64"
                  class="!h-16 !w-16 object-cover"
                />
              </div>
              <div class="min-w-0 flex-1 text-sm">
                <div class="font-medium text-foreground">
                  {{ item.productName || '—' }}
                </div>
                <div
                  v-if="formatSpecData(item.specData)"
                  class="mt-0.5 text-muted-foreground"
                >
                  {{ formatSpecData(item.specData) }}
                </div>
                <div class="mt-1 text-muted-foreground">
                  数量 {{ item.quantity }} · 单价
                  {{ formatMoneyAmount(item.productPrice, currency) }} · 小计
                  {{ formatMoneyAmount(item.subtotalAmount, currency) }}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div
          v-if="!loading && orderItems.length === 0"
          class="py-4 text-center text-sm text-muted-foreground"
        >
          暂无商品明细
        </div>
      </div>
    </Spin>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button @click="drawerOpen = false">取消</Button>
        <Button
          :disabled="loading"
          :loading="submitting"
          danger
          type="primary"
          @click="handleSubmit"
        >
          提交退款
        </Button>
      </div>
    </template>
  </Drawer>
</template>
