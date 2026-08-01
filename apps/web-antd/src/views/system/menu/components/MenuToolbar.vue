<script lang="ts" setup>
import { Button } from 'ant-design-vue';

defineProps<{
  canAddChild: boolean;
  canEditOrDelete: boolean;
  submitting: boolean;
}>();

const emit = defineEmits<{
  addChild: [];
  addTop: [];
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
  </div>
</template>
