<script lang="ts" setup>
import type { Key } from 'ant-design-vue/es/_util/type';
import type { DataNode } from 'ant-design-vue/es/tree';

import type { AdminRbacApi } from '#/api/core/admin-rbac';

import { computed } from 'vue';

import {
  Alert,
  Button,
  Checkbox,
  Empty,
  Modal,
  Spin,
  Tree,
} from 'ant-design-vue';

import { formatApiNodeTitle } from '../utils/role-access-tree';

const props = defineProps<{
  checkedApiIds: Set<number>;
  checkedMenuKeys: Key[];
  loading: boolean;
  readOnly: boolean;
  roleLabel: string;
  saving: boolean;
  selectedMenuApiLoading: boolean;
  selectedMenuApis: AdminRbacApi.MenuApiRule[];
  selectedMenuKeys: Key[];
  treeData: DataNode[];
}>();

const open = defineModel<boolean>('open', { default: false });
const expandedKeys = defineModel<Key[]>('expandedKeys', { required: true });

const emit = defineEmits<{
  apiCheck: [apiId: number, checked: boolean];
  apiCheckAll: [checked: boolean];
  close: [];
  menuCheck: [checked: Key[] | { checked: Key[]; halfChecked: Key[] }];
  menuSelect: [selectedKeys: Key[]];
  save: [];
}>();

const allApisChecked = computed(
  () =>
    props.selectedMenuApis.length > 0 &&
    props.selectedMenuApis.every((api) => props.checkedApiIds.has(api.id)),
);

const apisIndeterminate = computed(
  () =>
    props.selectedMenuApis.some((api) => props.checkedApiIds.has(api.id)) &&
    !allApisChecked.value,
);

function handleClose() {
  open.value = false;
  emit('close');
}
</script>

<template>
  <Modal
    v-model:open="open"
    :destroy-on-close="true"
    :footer="null"
    :mask-closable="!saving"
    title="授权配置"
    width="960px"
    @cancel="handleClose"
  >
    <div class="flex flex-col gap-4">
      <div class="text-sm text-muted-foreground">
        当前角色：{{ roleLabel || '—' }}
      </div>

      <Alert
        v-if="readOnly"
        show-icon
        type="info"
        message="超级管理员授权不可修改"
      />

      <Alert
        v-else
        show-icon
        type="warning"
        message="左侧勾选菜单控制侧栏可见；右侧勾选 API 控制接口调用权限。有侧栏入口但未勾 API 时，调接口仍可能 403。"
      />

      <Spin :spinning="loading">
        <div class="flex min-h-[420px] gap-4">
          <div
            class="w-[280px] shrink-0 overflow-auto rounded border border-border p-3"
          >
            <Tree
              v-if="treeData.length > 0"
              :checked-keys="checkedMenuKeys"
              v-model:expanded-keys="expandedKeys"
              :selected-keys="selectedMenuKeys"
              checkable
              check-strictly
              class="role-access-menu-tree"
              :tree-data="treeData"
              block-node
              show-line
              @check="(checked) => emit('menuCheck', checked)"
              @select="(keys) => emit('menuSelect', keys)"
            />
            <div
              v-else-if="!loading"
              class="py-8 text-center text-sm text-muted-foreground"
            >
              暂无菜单数据
            </div>
          </div>

          <div
            class="min-w-0 flex-1 overflow-auto rounded border border-border p-4"
          >
            <Spin :spinning="selectedMenuApiLoading">
              <template v-if="selectedMenuKeys.length === 0">
                <Empty description="请在左侧选择菜单" />
              </template>
              <template v-else-if="selectedMenuApis.length === 0">
                <Empty description="该菜单暂无接口" />
              </template>
              <div v-else class="flex w-full flex-col gap-3">
                <div
                  class="flex items-center gap-4 border-b border-border pb-3"
                >
                  <Checkbox
                    :checked="allApisChecked"
                    :disabled="readOnly"
                    :indeterminate="apisIndeterminate"
                    @change="
                      (event) =>
                        emit('apiCheckAll', event.target.checked === true)
                    "
                  >
                    全选
                  </Checkbox>
                  <Button
                    :disabled="readOnly"
                    size="small"
                    type="link"
                    @click="emit('apiCheckAll', false)"
                  >
                    取消
                  </Button>
                </div>
                <Checkbox
                  v-for="api in selectedMenuApis"
                  :key="api.id"
                  :checked="checkedApiIds.has(api.id)"
                  class="!ml-0"
                  :disabled="readOnly"
                  @change="
                    (event) =>
                      emit('apiCheck', api.id, event.target.checked === true)
                  "
                >
                  {{ formatApiNodeTitle(api) }}
                </Checkbox>
              </div>
            </Spin>
          </div>
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
  </Modal>
</template>
