<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue/es/form';

import type { AdminRbacApi } from '#/api/core/admin-rbac';

import type { MenuFormState, PanelMode } from '../types';

import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Select,
  Spin,
} from 'ant-design-vue';

import {
  formatMenuTypeLabel,
  menuFormRules,
  MENU_TYPE_OPTIONS,
  panelTitleByMode,
} from '../constants';
import {
  MENU_ICON_OPTIONS,
  MENU_ICON_VALUES,
} from '../constants/menu-icons';
import type { MenuIconOption } from '../constants/menu-icons';
import { DEFAULT_MENU_ICON } from '#/router/route-meta';

const props = defineProps<{
  detail: AdminRbacApi.MenuItem | null;
  detailLoading: boolean;
  mode: PanelMode;
  submitting: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  submit: [];
}>();

const formState = defineModel<MenuFormState>('formState', { required: true });

const formRef = ref<FormInstance>();

const isEditing = computed(() => props.mode === 'add' || props.mode === 'edit');
const showMenuPageHint = computed(() => formState.value.menu_type === 'menu');

const iconOptions = computed<MenuIconOption[]>(() => {
  const current = formState.value.icon?.trim();
  const options = MENU_ICON_OPTIONS.map((option) => ({ ...option }));

  if (current && !MENU_ICON_VALUES.has(current)) {
    options.push({
      label: `${current}（历史）`,
      value: current,
    });
  }

  return options;
});

function displayValue(value: null | number | string | undefined) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  return String(value);
}

function resolveDisplayIcon(icon: null | string | undefined) {
  const trimmed = icon?.trim();
  return trimmed || DEFAULT_MENU_ICON;
}

async function handleSubmit() {
  if (!isEditing.value) {
    return;
  }
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  emit('submit');
}
</script>

<template>
  <Card class="menu-detail-panel" size="small" :title="panelTitleByMode(mode)">
    <Spin :spinning="detailLoading && mode === 'view'">
      <template v-if="mode === 'view'">
        <Form
          v-if="detail"
          :key="detail.id"
          class="menu-detail-panel-form"
          layout="horizontal"
          :label-col="{ style: { width: '96px', flex: '0 0 96px' } }"
          :wrapper-col="{ style: { flex: '1 1 auto', minWidth: 0 } }"
        >
          <Form.Item label="菜单 ID">
            <Input :value="displayValue(detail.id)" disabled />
          </Form.Item>
          <Form.Item label="父级 ID">
            <Input
              :value="
                detail.parent_id === null
                  ? '（顶级）'
                  : displayValue(detail.parent_id)
              "
              disabled
            />
          </Form.Item>
          <Form.Item label="标题">
            <Input :value="displayValue(detail.title)" disabled />
          </Form.Item>
          <Form.Item label="菜单类型">
            <Input
              :value="formatMenuTypeLabel(detail.menu_type)"
              disabled
            />
          </Form.Item>
          <Form.Item label="路由路径">
            <Input :value="displayValue(detail.path)" disabled />
          </Form.Item>
          <Form.Item label="前端组件">
            <Input :value="displayValue(detail.component)" disabled />
          </Form.Item>
          <Form.Item label="图标">
            <div class="flex items-center gap-2">
              <IconifyIcon
                :icon="resolveDisplayIcon(detail.icon)"
                class="size-5 shrink-0"
              />
              <span>{{ detail.icon?.trim() || '（默认）' }}</span>
            </div>
          </Form.Item>
          <Form.Item label="排序">
            <InputNumber class="w-full" :value="detail.sort" disabled />
          </Form.Item>
        </Form>
        <Empty v-else description="请在左侧选择菜单节点" />
      </template>

      <template v-else>
        <Form
          ref="formRef"
          class="menu-detail-panel-form"
          :model="formState"
          :rules="menuFormRules"
          layout="horizontal"
          :label-col="{ style: { width: '96px', flex: '0 0 96px' } }"
          :wrapper-col="{ style: { flex: '1 1 auto', minWidth: 0 } }"
        >
          <Form.Item label="父级 ID" name="parent_id">
            <InputNumber
              v-model:value="formState.parent_id"
              class="w-full"
              :min="1"
              :precision="0"
              placeholder="留空表示顶级菜单"
            />
          </Form.Item>
          <Form.Item label="标题" name="title">
            <Input
              v-model:value="formState.title"
              allow-clear
              :maxlength="64"
              placeholder="请输入菜单标题"
            />
          </Form.Item>
          <Form.Item label="菜单类型" name="menu_type">
            <Select
              v-model:value="formState.menu_type"
              :options="MENU_TYPE_OPTIONS"
            />
          </Form.Item>
          <Form.Item label="路由路径" name="path">
            <Input
              v-model:value="formState.path"
              allow-clear
              placeholder="请输入路由路径"
            />
            <div
              v-if="showMenuPageHint"
              class="mt-1 text-xs text-muted-foreground"
            >
              页面类型建议填写路由路径
            </div>
          </Form.Item>
          <Form.Item label="前端组件" name="component">
            <Input
              v-model:value="formState.component"
              allow-clear
              placeholder="请输入前端组件路径"
            />
            <div
              v-if="showMenuPageHint"
              class="mt-1 text-xs text-muted-foreground"
            >
              页面类型建议填写前端组件
            </div>
          </Form.Item>
          <Form.Item label="图标" name="icon">
            <Select
              v-model:value="formState.icon"
              allow-clear
              placeholder="请选择图标（留空使用默认）"
              :options="iconOptions"
              option-label-prop="label"
            >
              <template #option="{ value, label }">
                <div
                  v-if="value"
                  class="flex items-center gap-2"
                >
                  <IconifyIcon :icon="value" class="size-4 shrink-0" />
                  <span>{{ label }}</span>
                  <span class="text-xs text-muted-foreground">{{ value }}</span>
                </div>
                <span v-else>{{ label }}</span>
              </template>
            </Select>
          </Form.Item>
          <Form.Item label="排序" name="sort">
            <InputNumber
              v-model:value="formState.sort"
              class="w-full"
              :min="0"
              :precision="0"
            />
          </Form.Item>
        </Form>

        <div class="mt-4 flex justify-end gap-2">
          <Button
            :loading="submitting"
            type="primary"
            @click="handleSubmit"
          >
            {{ mode === 'add' ? '创建' : '更新' }}
          </Button>
          <Button :disabled="submitting" @click="emit('cancel')">取消</Button>
        </div>
      </template>
    </Spin>
  </Card>
</template>
