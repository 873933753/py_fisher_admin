<script lang="ts" setup>
import { ref, watch } from 'vue'

import { IconifyIcon } from '@vben/icons'

import { Button, Input, Table } from 'ant-design-vue'

const props = defineProps<{
  modelValue: Record<string, string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>]
}>()

const rows = ref<Array<{ key: string; value: string }>>([])

function recordToRows(rec: Record<string, string>) {
  return Object.entries(rec).map(([key, value]) => ({ key, value }))
}

function ensureEditableRows(list: Array<{ key: string; value: string }>) {
  return list.length > 0 ? list : [{ key: '', value: '' }]
}

watch(
  () => props.modelValue,
  (m) => {
    rows.value = ensureEditableRows(recordToRows(m))
  },
  { immediate: true, deep: true },
)

function syncToRecord() {
  const next: Record<string, string> = {}
  for (const r of rows.value) {
    const k = r.key.trim()
    if (k) next[k] = r.value
  }
  emit('update:modelValue', next)
}

function removeRow(index: number) {
  rows.value.splice(index, 1)
  if (rows.value.length === 0) rows.value.push({ key: '', value: '' })
  syncToRecord()
}

function insertRowAfter(index: number) {
  rows.value.splice(index + 1, 0, { key: '', value: '' })
}

function onFieldBlur() {
  syncToRecord()
}
</script>

<template>
  <div class="product-param-table">
    <Table
      :columns="[
        { title: '属性名', key: 'key', width: '38%' },
        { title: '属性值', key: 'value' },
        { title: '操作', key: 'action', width: 112 },
      ]"
      :data-source="rows.map((r, i) => ({ ...r, _idx: i }))"
      :pagination="false"
      row-key="_idx"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'key'">
          <Input
            v-model:value="rows[record._idx]!.key"
            allow-clear
            placeholder="如 Colour"
            @blur="onFieldBlur"
          />
        </template>
        <template v-else-if="column.key === 'value'">
          <Input
            v-model:value="rows[record._idx]!.value"
            allow-clear
            placeholder="属性值"
            @blur="onFieldBlur"
          />
        </template>
        <template v-else-if="column.key === 'action'">
          <div class="flex items-center gap-0.5">
            <Button
              danger
              size="small"
              type="text"
              title="删除本行"
              @click="removeRow(record._idx)"
            >
              <IconifyIcon class="size-[18px]" icon="mdi:minus-circle-outline" />
            </Button>
            <Button
              size="small"
              type="text"
              title="在下方新增一行"
              @click="insertRowAfter(record._idx)"
            >
              <IconifyIcon class="size-[18px]" icon="mdi:plus-circle-outline" />
            </Button>
          </div>
        </template>
      </template>
    </Table>
  </div>
</template>

<style scoped>
.product-param-table :deep(.ant-table-tbody > tr > td) {
  border-top: none !important;
  border-bottom: none !important;
}
</style>
