<script lang="ts" setup>
import type { PermissionGroup } from '../composables/useSystemRbacManage';

import { Alert, Button, Checkbox, Drawer, Empty, Spin } from 'ant-design-vue';

import { formatPermissionGroupLabel } from '../constants';

const props = defineProps<{
  loading: boolean;
  permissionGroups: PermissionGroup[];
  readOnly: boolean;
  roleLabel: string;
  saving: boolean;
}>();

const open = defineModel<boolean>('open', { default: false });
const checkedCodes = defineModel<string[]>('checkedCodes', { default: [] });

const emit = defineEmits<{
  close: [];
  save: [];
}>();

function isPermissionChecked(code: string) {
  return checkedCodes.value.includes(code);
}

function togglePermission(code: string, checked: boolean) {
  if (props.readOnly) {
    return;
  }
  if (checked) {
    if (!checkedCodes.value.includes(code)) {
      checkedCodes.value = [...checkedCodes.value, code];
    }
    return;
  }

  checkedCodes.value = checkedCodes.value.filter((item) => item !== code);
}

function handleClose() {
  open.value = false;
  emit('close');
}
</script>

<template>
  <Drawer
    v-model:open="open"
    :destroy-on-close="true"
    :mask-closable="!saving"
    title="权限配置"
    width="720"
    @close="emit('close')"
  >
    <div class="flex h-full flex-col gap-4">
      <div class="text-sm text-muted-foreground">
        当前角色：{{ roleLabel || '—' }}
      </div>

      <Alert
        v-if="readOnly"
        show-icon
        type="info"
        message="超级管理员权限不可修改"
      />

      <Spin :spinning="loading" class="min-h-0 flex-1 overflow-y-auto">
        <Empty
          v-if="!loading && permissionGroups.length === 0"
          description="暂无权限数据"
        />
        <div v-else class="space-y-5 pb-4">
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
            <div class="grid gap-3 md:grid-cols-2">
              <Checkbox
                v-for="permission in group.items"
                :key="permission.code"
                :checked="isPermissionChecked(permission.code)"
                :disabled="readOnly"
                @change="
                  (event) =>
                    togglePermission(permission.code, event.target.checked)
                "
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

      <div class="flex justify-end gap-2 border-t border-border pt-4">
        <Button :disabled="saving" @click="handleClose">取消</Button>
        <Button
          :disabled="loading || readOnly"
          :loading="saving"
          type="primary"
          @click="emit('save')"
        >
          保存
        </Button>
      </div>
    </div>
  </Drawer>
</template>
