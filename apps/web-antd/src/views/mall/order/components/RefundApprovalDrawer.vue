<script lang="ts" setup>
import type { OrderApi } from '#/api/core/order';
import type { OrderRefundApplyApi } from '#/api/core/orderRefundApply';

import { computed, ref, watch } from 'vue';

import {
  Button,
  Drawer,
  Image,
  Input,
  InputNumber,
  message,
  Radio,
  Spin,
} from 'ant-design-vue';

import {
  findReasonTypeApi,
  refundDetailsApi,
  reviewRefundApi,
} from '#/api/core/orderRefundApply';
import ProductReviewMediaUpload from '#/views/mall/product-review/components/ProductReviewMediaUpload.vue';
import {
  isVideoReviewFile,
  REVIEW_FILE_MAX_COUNT,
} from '#/views/mall/product-review/constants';

import {
  formatMoneyAmount,
  formatRefundTypeLabel,
  formatSpecData,
} from '../constants';

const props = defineProps<{
  open: boolean;
  order: null | OrderApi.OrderRecord;
}>();

const emit = defineEmits<{
  submitted: [];
  'update:open': [value: boolean];
}>();

const REVIEW_STATUS_OPTIONS = [
  { value: 0, label: '待审核' },
  { value: 1, label: '审核通过' },
  { value: 2, label: '审核拒绝' },
  { value: 3, label: '客户取消' },
] as const;

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
const details = ref<null | OrderRefundApplyApi.RefundDetailsResult>(null);

const reviewStatus = ref<number>(0);
const refundType = ref<1 | 2>(1);
const refundAmount = ref<number | undefined>(undefined);
const handleNote = ref('');
const mediaUploadRef = ref<InstanceType<
  typeof ProductReviewMediaUpload
> | null>(null);

const orderId = computed(() => props.order?.orderId?.trim() ?? '');
const orderRefundApplyId = computed(() => {
  const value = props.order?.orderRefundApplyId;
  if (value === undefined || value === null || value === '') {
    return '';
  }
  return String(value);
});

const orderLabel = computed(
  () => props.order?.orderNo?.trim() || orderId.value || '—',
);

const currency = computed(() => props.order?.currency);

const orderRefundApply = computed(
  () => details.value?.orderRefundApply ?? null,
);

const refundDetailsList = computed(
  () => details.value?.refundDetailsList ?? [],
);

const myOrderRefund = computed(() => details.value?.myOrderRefund ?? null);

const showRefundFields = computed(() => reviewStatus.value === 1);

const showRefundAmount = computed(
  () => showRefundFields.value && refundType.value === 2,
);

function normalizeMediaList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function getReasonTypeLabel(reasonType?: string): string {
  const key = reasonType?.trim();
  if (!key) {
    return '—';
  }
  return reasonTypeMap.value[key] || key;
}

function resetForm() {
  reviewStatus.value = 0;
  refundType.value = 1;
  refundAmount.value = undefined;
  handleNote.value = '';
  mediaUploadRef.value?.resetSlots();
}

function applyDetailsToForm(data: OrderRefundApplyApi.RefundDetailsResult) {
  const apply = data.orderRefundApply;
  reviewStatus.value =
    typeof apply.reviewStatus === 'number' ? apply.reviewStatus : 0;
  handleNote.value = apply.handleNote?.trim() ?? '';
  refundType.value = 1;
  refundAmount.value = undefined;
  mediaUploadRef.value?.resetSlots();
}

async function loadDrawerData() {
  const currentApplyId = orderRefundApplyId.value;
  if (!currentApplyId) {
    message.warning('订单退款申请 ID 不存在');
    drawerOpen.value = false;
    return;
  }

  loading.value = true;
  details.value = null;
  resetForm();

  try {
    const [reasonTypes, refundDetails] = await Promise.all([
      findReasonTypeApi(),
      refundDetailsApi({ orderRefundApplyId: currentApplyId }),
    ]);
    reasonTypeMap.value = reasonTypes ?? {};
    details.value = refundDetails;
    applyDetailsToForm(refundDetails);
  } catch {
    details.value = null;
    drawerOpen.value = false;
  } finally {
    loading.value = false;
  }
}

function validateSubmit(): boolean {
  if (!orderId.value || !orderRefundApplyId.value) {
    message.warning('订单信息不完整');
    return false;
  }

  if (showRefundAmount.value) {
    const amount = refundAmount.value;
    if (amount === undefined || amount === null || Number(amount) <= 0) {
      message.warning('请输入有效的退款金额');
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

async function handleSubmit() {
  if (!validateSubmit()) {
    return;
  }

  const payload: OrderRefundApplyApi.ReviewRefundParams = {
    orderId: orderId.value,
    orderRefundApplyId: orderRefundApplyId.value,
    reviewStatus: reviewStatus.value,
  };

  const note = handleNote.value.trim();
  if (note) {
    payload.handleNote = note;
  }

  const proofPics = mediaUploadRef.value?.getOssPaths() ?? [];
  if (proofPics.length > 0) {
    payload.handleProofPics = proofPics;
  }

  if (showRefundFields.value) {
    payload.refundType = refundType.value;
    if (refundType.value === 2) {
      payload.refundAmount = Number(refundAmount.value);
    }
  }

  submitting.value = true;
  try {
    await reviewRefundApi(payload);
    message.success('退款审批提交成功');
    drawerOpen.value = false;
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      void loadDrawerData();
      return;
    }
    details.value = null;
    resetForm();
  },
);

watch(refundType, (value) => {
  if (value === 1) {
    refundAmount.value = undefined;
  }
});
</script>

<template>
  <Drawer
    v-model:open="drawerOpen"
    :destroy-on-close="true"
    title="退款审批"
    width="640"
  >
    <Spin :spinning="loading">
      <div class="flex flex-col gap-5">
        <section class="text-sm">
          <div>
            <span class="text-muted-foreground">订单：</span>
            <span class="text-foreground">{{ orderLabel }}</span>
          </div>
        </section>

        <template v-if="orderRefundApply">
          <section class="rounded-lg border border-border/60 p-4">
            <div class="mb-3 text-sm font-medium text-foreground">
              买家申请信息
            </div>
            <dl class="grid grid-cols-1 gap-2 text-sm">
              <div class="flex gap-2">
                <dt class="shrink-0 text-muted-foreground">申请时间</dt>
                <dd>{{ orderRefundApply.createTime || '—' }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="shrink-0 text-muted-foreground">退款原因</dt>
                <dd>{{ getReasonTypeLabel(orderRefundApply.reasonType) }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="shrink-0 text-muted-foreground">买家备注</dt>
                <dd class="whitespace-pre-wrap break-words">
                  {{ orderRefundApply.description?.trim() || '—' }}
                </dd>
              </div>
            </dl>

            <div
              v-if="normalizeMediaList(orderRefundApply.proofPics).length > 0"
              class="mt-3"
            >
              <div class="mb-2 text-sm text-muted-foreground">买家凭证</div>
              <div class="flex flex-wrap gap-2">
                <template
                  v-for="(fileUrl, index) in normalizeMediaList(
                    orderRefundApply.proofPics,
                  )"
                  :key="`proof-${index}`"
                >
                  <video
                    v-if="isVideoReviewFile(fileUrl)"
                    class="h-20 w-20 shrink-0 rounded object-cover"
                    controls
                    preload="metadata"
                    :src="fileUrl"
                  ></video>
                  <div
                    v-else
                    class="relative h-20 w-20 shrink-0 overflow-hidden rounded border border-border bg-muted"
                  >
                    <Image
                      :height="80"
                      :preview="{ src: fileUrl }"
                      :src="fileUrl"
                      :width="80"
                      class="!h-20 !w-20 object-cover"
                    />
                  </div>
                </template>
              </div>
            </div>
          </section>

          <section
            v-if="refundDetailsList.length > 0"
            class="rounded-lg border border-border/60 p-4"
          >
            <div class="mb-3 text-sm font-medium text-foreground">退货明细</div>
            <div class="flex flex-col gap-3">
              <div
                v-for="(item, index) in refundDetailsList"
                :key="item.orderRefundItemId || item.myOrderItemId || index"
                class="flex gap-3 rounded-md bg-muted/30 p-3"
              >
                <div
                  v-if="item.skuImage"
                  class="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-border bg-muted"
                >
                  <Image
                    :height="64"
                    :preview="{ src: item.skuImage }"
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
                    v-if="formatSpecData(item.specData ?? null)"
                    class="mt-0.5 text-muted-foreground"
                  >
                    {{ formatSpecData(item.specData ?? null) }}
                  </div>
                  <div class="mt-1 text-muted-foreground">
                    数量 {{ item.quantity ?? '—' }} · 单价
                    {{ formatMoneyAmount(item.productPrice, currency) }} · 小计
                    {{ formatMoneyAmount(item.subtotalAmount, currency) }}
                  </div>
                  <!-- <div
                    v-if="item.returnDesc?.trim()"
                    class="mt-1 text-xs text-muted-foreground"
                  >
                    {{ item.returnDesc }}
                  </div> -->
                </div>
              </div>
            </div>
          </section>

          <section
            v-if="myOrderRefund"
            class="rounded-lg border border-border/60 p-4"
          >
            <div class="mb-3 text-sm font-medium text-foreground">退款记录</div>
            <dl class="grid grid-cols-1 gap-2 text-sm">
              <div class="flex gap-2">
                <dt class="shrink-0 text-muted-foreground">退款单号</dt>
                <dd>{{ myOrderRefund.refundNo || '—' }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="shrink-0 text-muted-foreground">退款金额</dt>
                <dd>
                  {{ formatMoneyAmount(myOrderRefund.refundAmount, currency) }}
                </dd>
              </div>
              <div class="flex gap-2">
                <dt class="shrink-0 text-muted-foreground">退款类型</dt>
                <dd>{{ formatRefundTypeLabel(myOrderRefund.refundType) }}</dd>
              </div>
            </dl>
          </section>

          <section class="rounded-lg border border-border/60 p-4">
            <div class="mb-3 text-sm font-medium text-foreground">商家审核</div>
            <div class="flex flex-col gap-4">
              <div>
                <div class="mb-2 text-sm text-muted-foreground">审核状态</div>
                <Radio.Group v-model:value="reviewStatus">
                  <Radio
                    v-for="option in REVIEW_STATUS_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </Radio>
                </Radio.Group>
              </div>

              <template v-if="showRefundFields">
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

                <div v-if="showRefundAmount">
                  <div class="mb-2 text-sm text-muted-foreground">退款金额</div>
                  <InputNumber
                    v-model:value="refundAmount"
                    class="w-full"
                    :min="0"
                    :placeholder="`请输入退款金额${currency ? `（${currency}）` : ''}`"
                    :precision="2"
                  />
                </div>
              </template>

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
        </template>

        <div
          v-else-if="!loading"
          class="py-8 text-center text-sm text-muted-foreground"
        >
          暂无退款详情
        </div>
      </div>
    </Spin>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button @click="drawerOpen = false">取消</Button>
        <Button
          :disabled="loading || !orderRefundApply"
          :loading="submitting"
          type="primary"
          @click="handleSubmit"
        >
          提交审核
        </Button>
      </div>
    </template>
  </Drawer>
</template>
