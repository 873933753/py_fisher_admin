<script lang="ts" setup>
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import type { BannerFormState, PickedProduct } from '../types';

import { computed, ref, watch } from 'vue';

import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Select,
  Table,
} from 'ant-design-vue';

import {
  FEED_TYPE_BANNER,
  isBannerLikeFeedType,
  isFloorFeedType,
  isQuickFeedType,
  JUMP_TYPE_CATEGORY,
  QUICK_ENTRY_MAX,
} from '../constants';
import {
  emptyBannerFileItem,
  normalizeBannerFileListForQuick,
  normalizeBannerOnIsScrollChange,
} from '../utils/bannerForm';
import { bannerListHasVideo, isBannerVideoItem } from '../utils/bannerMedia';
import BannerFileEditor from './BannerFileEditor.vue';
import ProductPickModal from './ProductPickModal.vue';

const props = defineProps<{
  feedTypeOptions: { label: string; value: string }[];
  jumpTypeOptions: { label: string; value: string }[];
  mode: 'add' | 'edit';
  submitForm: () => Promise<void>;
  submitting: boolean;
}>();

const open = defineModel<boolean>('open', { required: true });
const formState = defineModel<BannerFormState>('formState', { required: true });

const formRef = ref<FormInstance>();
const productPickOpen = ref(false);

const modalTitle = computed(() =>
  props.mode === 'add' ? '新增轮播配置' : '编辑轮播配置',
);

const showBannerSection = computed(() =>
  isBannerLikeFeedType(formState.value.feedType),
);

const showFloorSection = computed(() =>
  isFloorFeedType(formState.value.feedType),
);

const showIsScrollField = computed(
  () => formState.value.feedType === FEED_TYPE_BANNER,
);

const isQuickEntry = computed(() => isQuickFeedType(formState.value.feedType));

const bannerSectionLabel = computed(() =>
  isQuickEntry.value ? '快捷入口' : '轮播图',
);

const formRules = computed<Record<string, Rule[]>>(() => {
  const rules: Record<string, Rule[]> = {
    title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
    feedType: [{ required: true, message: '请选择类型', trigger: 'change' }],
    sortNum: [{ required: true, message: '请输入排序', trigger: 'change' }],
  };
  if (showIsScrollField.value) {
    rules.isScroll = [
      { required: true, message: '请选择是否轮播', trigger: 'change' },
    ];
  }
  return rules;
});

const pickedProductColumns = [
  { title: '商品 ID', dataIndex: 'id', key: 'id', ellipsis: true },
  {
    title: '商品名称',
    dataIndex: 'productName',
    key: 'productName',
    ellipsis: true,
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    align: 'center' as const,
  },
];

watch(
  () => formState.value.feedType,
  (feedType, prev) => {
    if (feedType === prev) return;
    if (
      isBannerLikeFeedType(feedType) &&
      formState.value.bannerFile.length === 0
    ) {
      formState.value.bannerFile = [emptyBannerFileItem()];
    }
    if (isQuickFeedType(feedType)) {
      formState.value.bannerFile = normalizeBannerFileListForQuick(
        formState.value.bannerFile,
      );
    }
  },
);

watch(
  () => formState.value.isScroll,
  (next, prev) => {
    if (formState.value.feedType !== FEED_TYPE_BANNER || next === prev) return;
    normalizeBannerOnIsScrollChange(formState.value, prev, next);
  },
);

function validateBannerFiles(): boolean {
  if (isQuickEntry.value) {
    if (formState.value.bannerFile.length === 0) {
      message.warning('请至少添加一条快捷入口');
      return false;
    }
    if (formState.value.bannerFile.length > QUICK_ENTRY_MAX) {
      message.warning(`快捷入口最多 ${QUICK_ENTRY_MAX} 个`);
      return false;
    }
    for (const item of formState.value.bannerFile) {
      if (item.jumpCategoryIds.length === 0) {
        message.warning('请为每条快捷入口选择跳转类目（须选到三级叶子分类）');
        return false;
      }
    }
    return true;
  }

  const isNoScroll = formState.value.isScroll === '0';
  const items = formState.value.bannerFile.filter((i) => i.filePath.trim());
  if (items.length === 0) {
    message.warning(
      isNoScroll ? '请至少上传一张轮播图或一个视频' : '请至少上传一张轮播图',
    );
    return false;
  }

  if (
    isNoScroll &&
    bannerListHasVideo(formState.value.bannerFile) &&
    formState.value.bannerFile.length > 1
  ) {
    message.warning('存在视频时只能保留一条轮播');
    return false;
  }

  if (!isNoScroll) {
    for (const item of items) {
      if (isBannerVideoItem(item)) {
        message.warning('轮播模式下不支持视频，请删除视频或改为不轮播');
        return false;
      }
    }
  }

  for (const item of items) {
    if (
      !isNoScroll &&
      item.jumpType === JUMP_TYPE_CATEGORY &&
      item.jumpCategoryIds.length === 0
    ) {
      message.warning('请选择跳转类目（须选到三级叶子分类）');
      return false;
    }
  }
  return true;
}

function validateFloorProducts(): boolean {
  if (formState.value.pickedProducts.length === 0) {
    message.warning('请选择商品');
    return false;
  }
  return true;
}

async function handleOk() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  if (showBannerSection.value && !validateBannerFiles()) return;
  if (showFloorSection.value && !validateFloorProducts()) return;
  await props.submitForm();
}

function handleProductPickConfirm(products: PickedProduct[]) {
  formState.value.pickedProducts = products;
  formState.value.productIds = products.map((p) => p.id).join(',');
}

function removePickedProduct(id: string) {
  formState.value.pickedProducts = formState.value.pickedProducts.filter(
    (p) => p.id !== id,
  );
  formState.value.productIds = formState.value.pickedProducts
    .map((p) => p.id)
    .join(',');
}
</script>

<template>
  <Modal
    v-model:open="open"
    :confirm-loading="submitting"
    :destroy-on-close="true"
    :mask-closable="false"
    :title="modalTitle"
    width="880px"
    @ok="handleOk"
  >
    <Form
      ref="formRef"
      :label-col="{ style: { width: '100px' } }"
      :model="formState"
      :rules="formRules"
      class="max-h-[70vh] overflow-y-auto pr-1"
    >
      <Form.Item label="标题" name="title">
        <Input
          v-model:value="formState.title"
          allow-clear
          placeholder="请输入标题"
        />
      </Form.Item>
      <Form.Item label="类型" name="feedType">
        <Select
          v-model:value="formState.feedType"
          :options="feedTypeOptions"
          placeholder="请选择类型"
        />
      </Form.Item>
      <Form.Item label="排序" name="sortNum">
        <InputNumber
          v-model:value="formState.sortNum"
          :min="0"
          class="w-full"
          placeholder="越小越靠前"
        />
      </Form.Item>

      <Form.Item v-if="showIsScrollField" label="是否轮播" name="isScroll">
        <Radio.Group v-model:value="formState.isScroll">
          <Radio value="1">是</Radio>
          <Radio value="0">否</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item v-if="showBannerSection" :label="bannerSectionLabel">
        <BannerFileEditor
          v-model:banner-file="formState.bannerFile"
          :feed-type="formState.feedType"
          :is-scroll="formState.isScroll"
          :jump-type-options="jumpTypeOptions"
        />
      </Form.Item>

      <template v-if="showFloorSection">
        <Form.Item label="商品">
          <div class="flex flex-col gap-2">
            <Button type="primary" @click="productPickOpen = true">
              选择商品
            </Button>
            <Table
              v-if="formState.pickedProducts.length > 0"
              :columns="pickedProductColumns"
              :data-source="formState.pickedProducts"
              :pagination="false"
              row-key="id"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <Button
                    danger
                    size="small"
                    type="link"
                    @click="removePickedProduct(record.id)"
                  >
                    移除
                  </Button>
                </template>
              </template>
            </Table>
          </div>
        </Form.Item>
      </template>
    </Form>

    <ProductPickModal
      v-model:open="productPickOpen"
      :selected="formState.pickedProducts"
      @confirm="handleProductPickConfirm"
    />
  </Modal>
</template>
