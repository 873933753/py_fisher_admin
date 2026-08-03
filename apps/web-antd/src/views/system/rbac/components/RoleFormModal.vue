<script lang="ts" setup>
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import type { SystemRoleFormState } from '../composables/useSystemRbacManage';

import { computed, ref } from 'vue';

import { Form, Input, Modal } from 'ant-design-vue';

import { formatRoleLabel } from '../constants';

const props = defineProps<{
  mode: 'add' | 'edit';
  submitForm: () => Promise<void>;
  submitting: boolean;
}>();

const open = defineModel<boolean>('open', { required: true });
const formState = defineModel<SystemRoleFormState>('formState', {
  required: true,
});

const formRef = ref<FormInstance>();

const modalTitle = computed(() =>
  props.mode === 'add' ? '新建角色' : '编辑角色',
);

const formRules = computed<Record<string, Rule[]>>(() => {
  const rules: Record<string, Rule[]> = {
    name: [
      { required: true, message: '请输入角色名称', trigger: 'blur' },
      { min: 1, max: 64, message: '角色名称长度为1-64个字符', trigger: 'blur' },
    ],
  };

  if (props.mode === 'add') {
    rules.code = [
      { required: true, message: '请输入角色码', trigger: 'blur' },
      { min: 1, max: 32, message: '角色码长度为1-32个字符', trigger: 'blur' },
    ];
  }

  return rules;
});

async function handleOk() {
  await formRef.value?.validate();
  await props.submitForm();
}

function handleCancel() {
  open.value = false;
}
</script>

<template>
  <Modal
    v-model:open="open"
    :confirm-loading="submitting"
    destroy-on-close
    :mask-closable="false"
    :title="modalTitle"
    width="520px"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <Form
      ref="formRef"
      :model="formState"
      :rules="formRules"
      layout="vertical"
      class="pt-2"
    >
      <Form.Item v-if="mode === 'edit'" label="角色码">
        <Input :value="formState.code" disabled />
      </Form.Item>
      <Form.Item v-else label="角色码" name="code">
        <Input
          v-model:value="formState.code"
          allow-clear
          :maxlength="32"
          placeholder="如 editor，将自动转为小写"
        />
      </Form.Item>
      <Form.Item label="角色名称" name="name">
        <Input
          v-model:value="formState.name"
          allow-clear
          :maxlength="64"
          placeholder="请输入角色名称"
        />
      </Form.Item>
      <div v-if="mode === 'edit'" class="text-xs text-muted-foreground">
        当前展示名：{{ formatRoleLabel(formState.name) }}
      </div>
    </Form>
  </Modal>
</template>
