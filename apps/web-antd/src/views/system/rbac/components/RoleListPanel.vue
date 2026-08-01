<script lang="ts" setup>
import type { AdminRbacApi } from '#/api/core/admin-rbac';

import { formatRoleLabel } from '../constants';

defineProps<{
  loading: boolean;
  roles: AdminRbacApi.RoleItem[];
  selectedRoleCode: string;
}>();

const emit = defineEmits<{
  select: [roleCode: string];
}>();
</script>

<template>
  <section
    class="flex h-full flex-col rounded-lg border border-border bg-background shadow-sm"
  >
    <div class="border-b border-border px-4 py-3 text-sm font-medium">角色列表</div>
    <div class="min-h-0 flex-1 overflow-y-auto p-2">
      <div v-if="loading" class="px-3 py-6 text-center text-sm text-muted-foreground">
        加载中...
      </div>
      <button
        v-for="role in roles"
        :key="role.code"
        class="mb-1 flex w-full flex-col rounded-md px-3 py-2 text-left transition-colors"
        :class="
          selectedRoleCode === role.code
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-muted text-foreground'
        "
        type="button"
        @click="emit('select', role.code)"
      >
        <span class="text-sm font-medium">{{ formatRoleLabel(role.name) }}</span>
        <span class="text-xs text-muted-foreground">{{ role.code }}</span>
      </button>
      <div
        v-if="!loading && roles.length === 0"
        class="px-3 py-6 text-center text-sm text-muted-foreground"
      >
        暂无角色
      </div>
    </div>
  </section>
</template>
