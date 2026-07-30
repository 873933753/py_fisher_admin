<script lang="ts" setup>
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import type { CategoryCascaderOption } from '../../product/utils/categoryOptions';

import { computed, ref, watch } from 'vue';

import {
  Cascader,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
} from 'ant-design-vue';

import { MallSingleImageUpload } from '#/components/single-image-upload';

import {
  isValidPathAtDepth,
  limitCascaderOptionsDepth,
} from '../../product/utils/categoryOptions';
import { formatCategoryLevelZh } from '../constants';

const props = defineProps<{
  addFromTop: boolean;
  addTargetLevel: null | number;
  /** 父级须选到的层级深度：1=仅选一级，2=选到二级 */
  allowedParentLevel: null | number;
  categoryCascaderOptions: CategoryCascaderOption[];
  formRules: Record<string, Rule[]>;
  mode: 'add' | 'edit';
  parentLocked: boolean;
  resolveParentCategoryPath: (parentId: string) => string[] | undefined;
  showParentField: boolean;
  submitCategory: () => Promise<void>;
}>();

const formIconFileModel = defineModel<File | null>('formIconFile', {
  required: true,
});

const open = defineModel<boolean>('open', { required: true });
const formState = defineModel<{
  dictDesc: string;
  icon: string;
  name: string;
  parentId?: string;
  sort: number;
}>('formState', { required: true });

const formRef = ref<FormInstance>();

/** 按父级允许层级裁剪后的联动数据（新增二级仅一级，新增三级仅到二级） */
const parentCascaderOptions = computed(() => {
  const depth = props.allowedParentLevel;
  if (depth === null) return props.categoryCascaderOptions;
  return limitCascaderOptionsDepth(props.categoryCascaderOptions, depth);
});

/** Cascader 展示路径；parentId 仅在达到 allowedParentLevel 深度后写入 */
const parentCategoryPath = ref<string[]>([]);

function normalizeCascaderPath(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

function pathsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((segment, index) => segment === b[index]);
}

function syncParentPathFromForm() {
  const depth = props.allowedParentLevel;
  const pid = formState.value.parentId;
  if (!pid || depth === null) {
    if (parentCategoryPath.value.length > 0) {
      parentCategoryPath.value = [];
    }
    return;
  }
  const resolved = props.resolveParentCategoryPath(pid);
  if (!resolved?.length) return;
  const displayPath = resolved.slice(0, depth);
  if (!pathsEqual(parentCategoryPath.value, displayPath)) {
    parentCategoryPath.value = displayPath;
  }
}

watch(
  () => formState.value.parentId,
  () => {
    syncParentPathFromForm();
  },
);

watch(
  () => [props.categoryCascaderOptions, props.allowedParentLevel, open.value],
  () => {
    if (open.value) syncParentPathFromForm();
  },
);

watch(open, (isOpen) => {
  if (isOpen) syncParentPathFromForm();
});

function onParentCategoryChange(value: unknown) {
  if (props.parentLocked) return;

  const path = normalizeCascaderPath(value);
  const depth = props.allowedParentLevel;

  if (path.length === 0) {
    parentCategoryPath.value = [];
    formState.value.parentId = undefined;
    return;
  }

  if (depth === null) return;

  const clipped = path.slice(0, depth);
  parentCategoryPath.value = [...clipped];

  if (!isValidPathAtDepth(clipped, parentCascaderOptions.value, depth)) {
    return;
  }

  const parentId = clipped[clipped.length - 1] ?? '';
  if (formState.value.parentId !== parentId) {
    formState.value.parentId = parentId;
  }
}

const parentPlaceholder = computed(() => {
  const depth = props.allowedParentLevel;
  if (depth === 1) return '请选择一级分类';
  if (depth === 2) return '请选择一级 / 二级分类';
  if (props.mode === 'edit') return '不选则为顶级分类';
  return '请选择父级分类';
});

const modalTitle = computed(() => {
  if (props.mode === 'edit') return '编辑分类';
  if (props.addFromTop) return '新增一级分类';
  const lv = props.addTargetLevel;
  if (lv !== null && lv >= 2) {
    return `新增${formatCategoryLevelZh(lv)}级分类`;
  }
  return '新增一级分类';
});

async function handleModalOk() {
  try {
    await formRef.value?.validate();
  } catch {
    throw new Error('validation');
  }
  try {
    await props.submitCategory();
  } catch {
    throw new Error('submit');
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    wrap-class-name="category-form-modal-wrap"
    :destroy-on-close="true"
    :title="modalTitle"
    ok-text="保存"
    :width="600"
    @ok="handleModalOk"
  >
    <Form
      ref="formRef"
      :model="formState"
      :rules="formRules"
      class="category-form-modal-form mt-2"
      layout="horizontal"
      :label-col="{ style: { width: '96px', flex: '0 0 96px' } }"
      :wrapper-col="{ style: { flex: '1 1 auto', minWidth: 0 } }"
    >
      <Row :gutter="[16, 16]" class="category-form-modal-grid">
        <Col :span="12" :xs="24">
          <Form.Item label="分类名称" name="name">
            <Input
              v-model:value="formState.name"
              allow-clear
              placeholder="请输入分类名称"
            />
          </Form.Item>
        </Col>
        <Col :span="12" :xs="24">
          <Form.Item label="排序值" name="sort">
            <InputNumber
              v-model:value="formState.sort"
              :min="0"
              :precision="0"
              class="w-full"
            />
          </Form.Item>
        </Col>
        <Col v-if="showParentField" :span="24" :xs="24">
          <Form.Item
            class="category-form-modal-parent-row"
            label="父级分类"
            name="parentId"
          >
            <Cascader
              :value="parentCategoryPath"
              :allow-clear="mode === 'edit' && allowedParentLevel === null"
              :change-on-select="true"
              class="w-full"
              :disabled="parentLocked"
              expand-trigger="click"
              :options="parentCascaderOptions"
              :placeholder="parentPlaceholder"
              @change="onParentCategoryChange"
            />
          </Form.Item>
        </Col>
        <Col :span="12" :xs="24">
          <Form.Item class="category-icon-form-item" label="分类图标">
            <MallSingleImageUpload
              v-model="formState.icon"
              v-model:file="formIconFileModel"
              :preview-url="formState.icon"
              upload-mode="defer-file"
            />
          </Form.Item>
        </Col>
        <!-- <Col :span="24" :xs="24">
          <Form.Item label="分类备注" name="dictDesc">
            <Input.TextArea
              v-model:value="formState.dictDesc"
              allow-clear
              :auto-size="{ minRows: 2, maxRows: 4 }"
              placeholder="选填，用于补充说明"
            />
          </Form.Item>
        </Col> -->
      </Row>
      <p v-if="parentLocked" class="mt-2 text-xs text-slate-500">
        当前分类下已有子分类，不可修改父级（避免误移动整棵子树）。
      </p>
    </Form>
  </Modal>
</template>

<style>
.category-form-modal-wrap .ant-modal {
  width: min(100%, 600px) !important;
  max-width: 600px;
}
</style>

<style scoped>
.category-form-modal-form :deep(.ant-form-item) {
  margin-bottom: 0;
}

.category-form-modal-parent-row {
  margin-bottom: 16px;
}

.category-form-modal-grid :deep(.ant-form-item) {
  margin-bottom: 0;
}

.category-form-modal-grid :deep(.ant-form-item.category-form-modal-parent-row) {
  margin-bottom: 16px;
}

.category-icon-form-item :deep(.ant-form-item-control-input-content) {
  min-height: 104px;
}
</style>
