<script lang="ts" setup>
import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Input } from 'ant-design-vue';

import { EMAILS_MAX } from '../constants';

const emails = defineModel<string[]>('modelValue', { required: true });

const canAddRow = computed(() => emails.value.length < EMAILS_MAX);
const canRemoveRow = computed(() => emails.value.length > 1);

function ensureAtLeastOneRow(list: string[]) {
  return list.length > 0 ? list : [''];
}

function removeRow(index: number) {
  if (!canRemoveRow.value) return;
  const next = [...emails.value];
  next.splice(index, 1);
  emails.value = ensureAtLeastOneRow(next);
}

function insertRowAfter(index: number) {
  if (!canAddRow.value) return;
  const next = [...emails.value];
  next.splice(index + 1, 0, '');
  emails.value = next;
}
</script>

<template>
  <div class="about-us-email-list">
    <p class="mb-2 text-xs text-slate-500">最多 {{ EMAILS_MAX }} 个，选填；</p>

    <div v-for="(_, index) in emails" :key="index" class="about-us-email-row">
      <Input
        v-model:value="emails[index]"
        allow-clear
        class="about-us-email-input"
        placeholder="请输入邮箱"
      />
      <div class="about-us-email-actions">
        <Button
          danger
          size="small"
          type="text"
          title="删除本行"
          :disabled="!canRemoveRow"
          @click="removeRow(index)"
        >
          <IconifyIcon class="size-[18px]" icon="mdi:minus-circle-outline" />
        </Button>
        <Button
          size="small"
          type="text"
          title="在下方新增一行"
          :disabled="!canAddRow"
          @click="insertRowAfter(index)"
        >
          <IconifyIcon class="size-[18px]" icon="mdi:plus-circle-outline" />
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-us-email-list {
  width: 100%;
}

.about-us-email-row {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-bottom: 8px;
}

.about-us-email-row:last-child {
  margin-bottom: 0;
}

.about-us-email-input {
  flex: 1 1 auto;
  min-width: 0;
}

.about-us-email-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
}
</style>
