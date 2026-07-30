<script lang="ts" setup>
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import type { CategoryNode } from '../types/category';

import { ref } from 'vue';

import { Button, Card, Empty, Form, Input, InputNumber } from 'ant-design-vue';

import { MallSingleImageUpload } from '#/components/single-image-upload';

const props = defineProps<{
  panelFormRules: Record<string, Rule[]>;
  selectedKey: number | string | undefined;
  selectedNode: CategoryNode | null;
}>();

const emit = defineEmits<{
  delete: [CategoryNode];
  save: [];
}>();

const panelIconFileModel = defineModel<File | null>('panelIconFile', {
  required: true,
});
const panelState = defineModel<{
  icon: string;
  name: string;
  sort: number;
}>('panelState', { required: true });

const formRef = ref<FormInstance>();

async function onSave() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  emit('save');
}
</script>

<template>
  <Card class="category-detail-panel" size="small" title="当前分类">
    <template v-if="props.selectedNode">
      <Form
        :key="String(props.selectedKey ?? '')"
        ref="formRef"
        class="category-detail-panel-form"
        :model="panelState"
        :rules="props.panelFormRules"
        layout="horizontal"
        :label-col="{ style: { width: '96px', flex: '0 0 96px' } }"
        :wrapper-col="{ style: { flex: '1 1 auto', minWidth: 0 } }"
      >
        <div
          class="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-500"
        >
          <span>分类 ID：{{ props.selectedNode.id }}</span>
          <span>级别：{{ props.selectedNode.level }}</span>
          <span>父级 ID：{{
              props.selectedNode.immediateParentId ?? '（顶级）'
            }}</span>
        </div>
        <div class="category-detail-form-grid mb-4">
          <Form.Item label="分类名称" name="name">
            <Input
              v-model:value="panelState.name"
              allow-clear
              placeholder="请输入分类名称"
            />
          </Form.Item>
          <Form.Item label="排序值" name="sort">
            <InputNumber
              v-model:value="panelState.sort"
              :min="0"
              :precision="0"
              class="w-full"
            />
          </Form.Item>
          <Form.Item class="category-icon-form-item" label="分类图标">
            <MallSingleImageUpload
              v-model="panelState.icon"
              v-model:file="panelIconFileModel"
              :preview-url="panelState.icon"
              upload-mode="defer-file"
            />
          </Form.Item>
        </div>
        <div class="category-detail-panel-actions">
          <Button type="primary" @click="onSave">保存</Button>
          <Button danger @click="emit('delete', props.selectedNode)">
            删除
          </Button>
        </div>
      </Form>
    </template>
    <Empty v-else description="暂无分类数据" />
  </Card>
</template>

<style scoped>
.category-detail-panel-form :deep(.ant-form-item) {
  margin-bottom: 0;
}

.category-detail-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
  align-items: start;
}

@media (max-width: 640px) {
  .category-detail-form-grid {
    grid-template-columns: 1fr;
  }
}

.category-detail-form-grid :deep(.ant-form-item) {
  margin-bottom: 0;
}

.category-detail-panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  width: 100%;
  margin-top: 4px;
  margin-bottom: 0;
}

.category-detail-panel :deep(.ant-input-affix-wrapper .ant-input:focus),
.category-detail-panel :deep(.ant-input-affix-wrapper-focused .ant-input) {
  border: none !important;
  box-shadow: none !important;
}

.category-detail-panel :deep(.ant-input-number .ant-input-number-input:focus) {
  border: none !important;
  box-shadow: none !important;
}

.category-icon-form-item :deep(.ant-form-item-control-input-content) {
  min-height: 104px;
}
</style>
