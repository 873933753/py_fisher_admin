<script lang="ts" setup>
import type { PermissionGroup } from '../composables/useSystemRbacManage';

import { Checkbox, Empty, Spin } from 'ant-design-vue';

import { formatPermissionGroupLabel } from '../constants';

defineProps<{
  loading: boolean;
  permissionGroups: PermissionGroup[];
  roleLabel: string;
  saving: boolean;
}>();

const checkedCodes = defineModel<string[]>('checkedCodes', { default: [] });

const emit = defineEmits<{
  save: [];
}>();

function isPermissionChecked(code: string) {
  return checkedCodes.value.includes(code);
}

function togglePermission(code: string, checked: boolean) {
  if (checked) {
    if (!checkedCodes.value.includes(code)) {
      checkedCodes.value = [...checkedCodes.value, code];
    }
    return;
  }

  checkedCodes.value = checkedCodes.value.filter((item) => item !== code);
}
</script>

<template>
  <section
    class="flex h-full flex-col rounded-lg border border-border bg-background shadow-sm"
  >
    <div
      class="flex items-center justify-between gap-3 border-b border-border px-4 py-3"
    >
      <div>
        <div class="text-sm font-medium">权限配置</div>
        <div v-if="roleLabel" class="text-xs text-muted-foreground">
          当前角色：{{ roleLabel }}
        </div>
      </div>
      <button
        class="inline-flex h-8 items-center rounded-md bg-primary px-4 text-sm text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="loading || saving || !roleLabel"
        type="button"
        @click="emit('save')"
      >
        {{ saving ? '保存中...' : '保存' }}
      </button>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto p-4">
      <Spin :spinning="loading">
        <Empty
          v-if="!loading && permissionGroups.length === 0"
          description="暂无权限数据"
        />
        <div v-else class="space-y-5">
          <section
            v-for="group in permissionGroups"
            :key="group.name"
            class="rounded-md border border-border/70 p-4"
          >
            <div class="mb-3 text-sm font-medium">
              {{ formatPermissionGroupLabel(group.name) }}
              <span class="ml-2 text-xs font-normal text-muted-foreground">
                {{ group.name }}
              </span>
            </div>
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Checkbox
                v-for="permission in group.items"
                :key="permission.code"
                :checked="isPermissionChecked(permission.code)"
                @change="(event) => togglePermission(permission.code, event.target.checked)"
              >
                <span>{{ permission.name }}</span>
                <span class="ml-1 text-xs text-muted-foreground">
                  ({{ permission.code }})
                </span>
              </Checkbox>
            </div>
          </section>
        </div>
      </Spin>
    </div>
  </section>
</template>
