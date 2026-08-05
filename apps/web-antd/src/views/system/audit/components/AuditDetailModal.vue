<script lang="ts" setup>
import type { AdminAuditApi } from '#/api/core/admin-audit';

import { computed } from 'vue';

import {
  Descriptions,
  DescriptionsItem,
  Modal,
  Spin,
  Tag,
} from 'ant-design-vue';

import {
  displayAuditText,
  formatAuditSummary,
  formatAuditUnixTime,
  getAuditSuccessLabel,
  getAuditSuccessTagColor,
} from '../constants';

const props = defineProps<{
  data: AdminAuditApi.Detail | null;
  loading: boolean;
}>();

const open = defineModel<boolean>('open', { required: true });

const emit = defineEmits<{
  close: [];
}>();

const summaryFields = computed(() => [
  {
    key: 'request_summary',
    label: '请求摘要',
    value: formatAuditSummary(props.data?.request_summary),
  },
  {
    key: 'before_summary',
    label: '变更前摘要',
    value: formatAuditSummary(props.data?.before_summary),
  },
  {
    key: 'after_summary',
    label: '变更后摘要',
    value: formatAuditSummary(props.data?.after_summary),
  },
]);

function handleCancel() {
  open.value = false;
  emit('close');
}
</script>

<template>
  <Modal
    v-model:open="open"
    destroy-on-close
    :footer="null"
    title="操作审计详情"
    width="800px"
    @cancel="handleCancel"
  >
    <Spin :spinning="loading">
      <template v-if="data">
        <Descriptions bordered :column="2" size="small">
          <DescriptionsItem label="ID">
            {{ data.id }}
          </DescriptionsItem>
          <DescriptionsItem label="是否成功">
            <Tag :color="getAuditSuccessTagColor(data.success)">
              {{ getAuditSuccessLabel(data.success) }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="操作人 ID">
            {{ displayAuditText(data.operator_id) }}
          </DescriptionsItem>
          <DescriptionsItem label="操作人">
            {{ displayAuditText(data.operator_name) }}
          </DescriptionsItem>
          <DescriptionsItem label="角色">
            {{ displayAuditText(data.operator_role) }}
          </DescriptionsItem>
          <DescriptionsItem label="模块">
            {{ displayAuditText(data.module) }}
          </DescriptionsItem>
          <DescriptionsItem label="动作">
            {{ displayAuditText(data.action) }}
          </DescriptionsItem>
          <DescriptionsItem label="方法">
            {{ displayAuditText(data.method) }}
          </DescriptionsItem>
          <DescriptionsItem :span="2" label="路径">
            {{ displayAuditText(data.path) }}
          </DescriptionsItem>
          <DescriptionsItem label="资源类型">
            {{ displayAuditText(data.resource_type) }}
          </DescriptionsItem>
          <DescriptionsItem label="资源 ID">
            {{ displayAuditText(data.resource_id) }}
          </DescriptionsItem>
          <DescriptionsItem label="IP">
            {{ displayAuditText(data.ip) }}
          </DescriptionsItem>
          <DescriptionsItem label="时间">
            {{ formatAuditUnixTime(data.create_time) }}
          </DescriptionsItem>
          <DescriptionsItem :span="2" label="失败摘要">
            {{ displayAuditText(data.error_message) }}
          </DescriptionsItem>
          <DescriptionsItem :span="2" label="User-Agent">
            {{ displayAuditText(data.user_agent) }}
          </DescriptionsItem>
        </Descriptions>

        <div
          v-for="field in summaryFields"
          :key="field.key"
          class="mt-4"
        >
          <div class="mb-2 text-sm font-medium text-foreground">
            {{ field.label }}
          </div>
          <pre
            class="max-h-56 overflow-auto rounded border border-border bg-muted/40 p-3 text-xs leading-5 text-foreground"
            >{{ field.value }}</pre
          >
        </div>
      </template>
      <div
        v-else-if="!loading"
        class="py-10 text-center text-muted-foreground"
      >
        暂无详情数据
      </div>
    </Spin>
  </Modal>
</template>
