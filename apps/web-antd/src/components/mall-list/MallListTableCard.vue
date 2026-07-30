<script lang="ts" setup>
defineOptions({ name: 'MallListTableCard' });
</script>

<template>
  <section
    class="rounded-lg border border-border bg-background px-4 py-3 shadow-sm"
  >
    <div
      v-if="$slots.header"
      class="mb-3 flex flex-wrap items-center justify-between gap-3"
    >
      <slot name="header"></slot>
    </div>
    <slot></slot>
  </section>
</template>
