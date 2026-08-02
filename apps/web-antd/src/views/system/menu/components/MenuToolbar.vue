<script lang="ts" setup>
import { Button } from 'ant-design-vue';

defineProps<{
  canAddChild: boolean;
  canConfigApi: boolean;
  canEditOrDelete: boolean;
  configApiDisabledReason?: string;
  submitting: boolean;
}>();

const emit = defineEmits<{
  addChild: [];
  addTop: [];
  configApi: [];
  delete: [];
  edit: [];
}>();
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <Button :disabled="submitting" type="primary" @click="emit('addTop')">
      新增顶级
    </Button>
    <Button
      :disabled="!canAddChild || submitting"
      @click="emit('addChild')"
    >
      新增子菜单
    </Button>
    <Button
      :disabled="!canEditOrDelete || submitting"
      @click="emit('edit')"
    >
      编辑
    </Button>
    <Button
      danger
      :disabled="!canEditOrDelete || submitting"
      @click="emit('delete')"
    >
      删除
    </Button>
    <Button
      :disabled="!canConfigApi || submitting"
      :title="configApiDisabledReason"
      @click="emit('configApi')"
    >
      接口配置
    </Button>
  </div>
</template>
