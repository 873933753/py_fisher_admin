<script lang="ts" setup>
import { computed } from 'vue';

import { VbenAvatar } from '@vben/common-ui';

import { UserDefaultAvatar } from '#/components/user-default-avatar';
import { hasAvatarUrl } from '#/views/mall/user/utils';

const props = withDefaults(
  defineProps<{
    avatar?: null | string;
    dot?: boolean;
    dotClass?: string;
    email?: null | string;
    emailAvatarVariant?: 'default' | 'header';
    size?: number;
  }>(),
  {
    avatar: '',
    dot: false,
    dotClass: '',
    email: '',
    emailAvatarVariant: 'default',
    size: 32,
  },
);

const showImageAvatar = computed(() => hasAvatarUrl(props.avatar));

const avatarSrc = computed(() => props.avatar?.trim() ?? '');

const dotSizeClass = computed(() => {
  if (props.size >= 48) {
    return 'size-4';
  }
  if (props.size >= 40) {
    return 'size-3.5';
  }
  return 'size-3';
});

const dotClassName = computed(() => {
  if (props.dotClass) {
    return props.dotClass;
  }
  return `border-background absolute right-0 bottom-0 ${dotSizeClass.value} rounded-full border-2 bg-green-500`;
});

const vbenAvatarDotClass = computed(() => {
  if (props.dotClass) {
    return props.dotClass;
  }
  return `border-background ${dotSizeClass.value} bg-green-500`;
});
</script>

<template>
  <div class="relative shrink-0">
    <VbenAvatar
      v-if="showImageAvatar"
      :alt="email || 'avatar'"
      :dot="dot"
      :dot-class="vbenAvatarDotClass"
      :size="size"
      :src="avatarSrc"
    />
    <template v-else>
      <UserDefaultAvatar
        :email="email"
        :size="size"
        :variant="emailAvatarVariant"
      />
      <span v-if="dot" :class="dotClassName"></span>
    </template>
  </div>
</template>
