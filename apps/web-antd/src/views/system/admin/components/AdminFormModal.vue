<script lang="ts" setup>
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import type { SystemAdminFormState } from '../composables/useSystemAdminManage';

import { computed, ref } from 'vue';

import { Form, Input, Modal, Spin, Switch } from 'ant-design-vue';

import { ADMIN_PHONE_PATTERN, formatAdminRoleLabel } from '../constants';

const props = defineProps<{
  currentAdminId: number;
  detailLoading?: boolean;
  mode: 'add' | 'edit';
  submitForm: () => Promise<void>;
  submitting: boolean;
}>();

const open = defineModel<boolean>('open', { required: true });
const formState = defineModel<SystemAdminFormState>('formState', {
  required: true,
});

const formRef = ref<FormInstance>();

const modalTitle = computed(() =>
  props.mode === 'add' ? '新建后台账号' : '编辑后台账号',
);

const disableStatusSwitch = computed(
  () =>
    props.mode === 'edit' &&
    formState.value.id > 0 &&
    formState.value.id === props.currentAdminId,
);

const formRules = computed<Record<string, Rule[]>>(() => {
  const rules: Record<string, Rule[]> = {
    phone_number: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      {
        pattern: ADMIN_PHONE_PATTERN,
        message: '请输入11位中国大陆手机号',
        trigger: 'blur',
      },
    ],
  };

  if (props.mode === 'add') {
    rules.password = [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, max: 64, message: '密码长度为6-64位', trigger: 'blur' },
    ];
  } else {
    rules.password = [
      {
        validator: async (_rule, value) => {
          const text = String(value ?? '').trim();
          if (!text) {
            return;
          }
          if (text.length < 6 || text.length > 64) {
            throw new Error('密码长度为6-64位');
          }
        },
        trigger: 'blur',
      },
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
    <Spin :spinning="detailLoading">
      <Form
        ref="formRef"
        :model="formState"
        :rules="formRules"
        layout="vertical"
        class="pt-2"
      >
        <Form.Item label="手机号" name="phone_number">
          <Input
            v-model:value="formState.phone_number"
            allow-clear
            :maxlength="11"
            placeholder="请输入手机号"
          />
        </Form.Item>
        <Form.Item v-if="mode === 'edit'" label="角色">
          <Input :value="formatAdminRoleLabel(formState.role)" disabled />
        </Form.Item>
        <Form.Item
          :label="mode === 'add' ? '密码' : '新密码'"
          name="password"
        >
          <Input.Password
            v-model:value="formState.password"
            allow-clear
            :placeholder="mode === 'add' ? '请输入密码' : '留空则不修改密码'"
          />
        </Form.Item>
        <Form.Item v-if="mode === 'edit'" label="状态" name="is_disabled">
          <Switch
            v-model:checked="formState.is_disabled"
            checked-children="已禁用"
            :disabled="disableStatusSwitch"
            un-checked-children="启用"
          />
          <div
            v-if="disableStatusSwitch"
            class="mt-2 text-xs text-muted-foreground"
          >
            不能禁用当前登录账号
          </div>
        </Form.Item>
      </Form>
    </Spin>
  </Modal>
</template>
