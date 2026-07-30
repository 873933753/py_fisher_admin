<script lang="ts" setup>
defineOptions({ name: 'MallListFilterField' });

defineProps<{
  label: string;
}>();
</script>

<template>
  <div class="flex min-w-0 items-center gap-2">
    <span class="shrink-0 whitespace-nowrap text-sm text-foreground">
      {{ label }}
    </span>
    <slot></slot>
  </div>
</template>
