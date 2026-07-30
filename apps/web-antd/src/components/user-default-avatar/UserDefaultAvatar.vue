<script lang="ts" setup>
import { computed } from 'vue';

import { formatEmailForAvatarLines } from '#/views/mall/user/utils';

const props = withDefaults(
  defineProps<{
    email?: null | string;
    size?: number;
    /** header：白底主题色字（顶部导航栏）；default：浅主题色底 */
    variant?: 'default' | 'header';
  }>(),
  {
    email: '',
    size: 48,
    variant: 'default',
  },
);

const emailLines = computed(() => {
  const { line1, line2 } = formatEmailForAvatarLines(props.email);
  return line2 ? [line1, line2] : [line1];
});

const fontSize = computed(() => {
  return Math.max(8, Math.round((props.size / 48) * 13));
});
</script>

<template>
  <div
    class="user-default-avatar"
    :class="`user-default-avatar--${variant}`"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      fontSize: `${fontSize}px`,
    }"
    :title="email?.trim() || undefined"
  >
    <span
      v-for="(line, index) in emailLines"
      :key="index"
      class="user-default-avatar__line"
    >
      {{ line }}
    </span>
  </div>
</template>

<style scoped>
.user-default-avatar {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 3px;
  overflow: hidden;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  border-radius: 50%;
}

.user-default-avatar--default {
  color: hsl(var(--primary));
  background-color: hsl(var(--primary) / 12%);
}

.user-default-avatar--header {
  color: hsl(var(--primary));
  background-color: #fff;
}

.user-default-avatar__line {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
