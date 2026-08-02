<script lang="ts" setup>
import type { Key } from 'ant-design-vue/es/_util/type';
import type { DataNode } from 'ant-design-vue/es/tree';

import { Alert, Button, Drawer, Spin, Tree } from 'ant-design-vue';

import type { MenuCheckedKeyState } from '../utils/role-menu-tree';

defineProps<{
  loading: boolean;
  readOnly: boolean;
  roleLabel: string;
  saving: boolean;
  treeData: DataNode[];
}>();

const open = defineModel<boolean>('open', { default: false });
const checkedKeys = defineModel<MenuCheckedKeyState>('checkedKeys', {
  required: true,
});
const expandedKeys = defineModel<Key[]>('expandedKeys', { required: true });

const emit = defineEmits<{
  check: [checked: Key[] | { checked: Key[]; halfChecked: Key[] }];
  close: [];
  save: [];
}>();

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
    title="菜单配置"
    width="520"
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
        message="超级管理员菜单不可修改"
      />

      <Alert
        v-else
        show-icon
        type="warning"
        message="勾选结果将全量覆盖该角色已有菜单，不会自动补全父级目录。"
      />

      <Spin :spinning="loading" class="min-h-0 flex-1">
        <Tree
          v-if="treeData.length > 0"
          :checked-keys="checkedKeys"
          v-model:expanded-keys="expandedKeys"
          checkable
          check-strictly
          class="overflow-auto"
          :tree-data="treeData"
          block-node
          show-line
          @check="(checked) => emit('check', checked)"
        />
        <div
          v-else-if="!loading"
          class="py-8 text-center text-sm text-muted-foreground"
        >
          暂无菜单数据
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
