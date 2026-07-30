<script lang="ts" setup>
defineOptions({ name: 'MallListSearchCard' });
</script>

<template>
  <section
    class="rounded-lg border border-border bg-background px-4 py-3 shadow-sm"
  >
    <div class="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
      <slot name="filters"></slot>
    </div>
    <div v-if="$slots.actions" class="mt-3 flex justify-end gap-2">
      <slot name="actions"></slot>
    </div>
  </section>
</template>
