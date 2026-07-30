<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Input } from 'ant-design-vue';

const props = defineProps<{
  initialRemark?: null | string;
  orderId: string;
}>();

const sellerRemark = ref('');

watch(
  () => props.initialRemark,
  (value) => {
    sellerRemark.value = value?.trim() ?? '';
  },
  { immediate: true },
);

function getValue() {
  return sellerRemark.value.trim();
}

defineExpose({ getValue });
</script>

<template>
  <div class="flex flex-col gap-3 pt-1">
    <p class="m-0 text-sm text-muted-foreground">订单 ID：{{ orderId }}</p>
    <div class="flex flex-col gap-1">
      <label class="text-sm text-muted-foreground">商家备注</label>
      <Input.TextArea
        v-model:value="sellerRemark"
        :auto-size="{ minRows: 4, maxRows: 8 }"
        placeholder="请输入商家备注"
      />
    </div>
  </div>
</template>
