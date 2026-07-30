<script lang="ts" setup>
/**
 * 商品基本信息：标题 / 副标题 / 分类（三级联动）/ 上架状态 / 是否热门 / 是否新品。
 */
import type { CategoryCascaderOption } from '../utils/categoryOptions';

import { ref, watch } from 'vue';

import { Cascader, Form, Input, Switch } from 'ant-design-vue';

import {
  useMallProductFormBiz,
  useMallProductFormMeta,
} from '../useMallProductFormContext';
import { isLeafPathInOptions } from '../utils/categoryOptions';

const props = defineProps<{
  categoryCascaderOptions: CategoryCascaderOption[];
  /** 用于将 meta.categoryId（叶子 id）还原为 Cascader 路径 */
  resolveCategoryPath: (leafId: string) => string[] | undefined;
}>();

const biz = useMallProductFormBiz();
const meta = useMallProductFormMeta();

/** 仅在选择叶子后写入，避免一二级展开时与 Cascader 内部状态冲突 */
const categoryPath = ref<string[]>([]);

function normalizeCascaderPath(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

function pathsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((segment, index) => segment === b[index]);
}

function syncPathFromMeta() {
  if (!meta.categoryId) {
    if (categoryPath.value.length > 0) {
      categoryPath.value = [];
    }
    return;
  }
  const resolved = props.resolveCategoryPath(meta.categoryId);
  if (!resolved?.length) return;
  if (!pathsEqual(categoryPath.value, resolved)) {
    categoryPath.value = [...resolved];
  }
}

watch(
  () => meta.categoryId,
  () => {
    syncPathFromMeta();
  },
  { immediate: true },
);

watch(
  () => props.categoryCascaderOptions,
  () => {
    syncPathFromMeta();
  },
);

function onCategoryChange(value: unknown) {
  const path = normalizeCascaderPath(value);

  if (path.length === 0) {
    categoryPath.value = [];
    meta.categoryId = '';
    return;
  }

  // 点击一、二级仅展开子菜单，不写入表单（change-on-select=false 时仍可能触发 change）
  if (!isLeafPathInOptions(path, props.categoryCascaderOptions)) {
    return;
  }

  categoryPath.value = [...path];
  const leafId = path[path.length - 1] ?? '';
  if (meta.categoryId !== leafId) {
    meta.categoryId = leafId;
  }
}
</script>

<template>
  <div class="product-form-module-shell">
    <h3
      class="product-form-module-title product-form-module-title--section-gap"
    >
      商品基本信息
    </h3>
    <Form
      layout="horizontal"
      class="basic-form !mb-0"
      :colon="false"
      :label-col="{ flex: '0 0 5.5rem' }"
      :wrapper-col="{ flex: '1 1 auto' }"
    >
      <Form.Item label="标题：" required>
        <Input v-model:value="meta.title" allow-clear placeholder="商品标题" />
      </Form.Item>
      <Form.Item label="副标题：">
        <Input
          v-model:value="biz.subtitle"
          allow-clear
          placeholder="副标题（可选）"
        />
      </Form.Item>
      <Form.Item label="分类：" required>
        <Cascader
          :value="categoryPath"
          allow-clear
          :change-on-select="false"
          class="w-full"
          expand-trigger="click"
          :options="categoryCascaderOptions"
          placeholder="请选择一级 / 二级 / 三级分类"
          @change="onCategoryChange"
        />
      </Form.Item>
      <!-- <Form.Item label="上架状态：">
        <Switch
          :checked="meta.status === 'on'"
          checked-children="上架"
          un-checked-children="下架"
          @update:checked="
            (c: boolean | number | string) =>
              (meta.status = c === true ? 'on' : 'off')
          "
        />
      </Form.Item> -->
      <div class="basic-form-switch-row">
        <Form.Item class="basic-form-switch-item" label="是否热门：">
          <Switch
            v-model:checked="meta.isHot"
            checked-children="是"
            un-checked-children="否"
          />
        </Form.Item>
        <Form.Item class="basic-form-switch-item" label="是否新品：">
          <Switch
            v-model:checked="meta.isNew"
            checked-children="是"
            un-checked-children="否"
          />
        </Form.Item>
      </div>
    </Form>
  </div>
</template>

<style scoped>
.basic-form :deep(.ant-form-item-control-input-content) {
  min-width: 0;
}

.basic-form :deep(.ant-form-item) {
  margin-bottom: 12px;
}

.basic-form :deep(.ant-form-item:last-child) {
  margin-bottom: 0;
}

.basic-form-switch-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0 16px;
  align-items: center;
}

.basic-form-switch-row :deep(.basic-form-switch-item) {
  flex: none;
  margin-bottom: 0;
}
</style>
