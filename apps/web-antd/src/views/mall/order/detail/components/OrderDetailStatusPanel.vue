<script lang="ts" setup>
import type { StepProps } from 'ant-design-vue';

import { Steps } from 'ant-design-vue';

defineProps<{
  showTimeline: boolean;
  statusSubtitle: string;
  statusTitle: string;
  timelineItems: StepProps[];
}>();
</script>

<template>
  <section
    class="rounded-lg border border-border bg-background px-4 py-5 shadow-sm"
  >
    <h3 class="text-lg font-semibold text-foreground mb-4">
      {{ statusTitle }}
    </h3>
    <p
      v-if="statusSubtitle && !(showTimeline && timelineItems.length > 0)"
      class="mt-1 text-sm text-muted-foreground"
    >
      {{ statusSubtitle }}
    </p>
    <Steps
      v-if="showTimeline && timelineItems.length > 0"
      class="order-detail-steps mt-6"
      :items="timelineItems"
    />
  </section>
</template>

<style scoped>
.order-detail-steps :deep(.ant-steps-item-description) {
  max-width: 12rem;
}
</style>
