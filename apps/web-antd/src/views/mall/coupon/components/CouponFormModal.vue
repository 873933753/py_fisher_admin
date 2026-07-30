<script lang="ts" setup>
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import type { CouponFormState } from '../types';

import { computed, ref } from 'vue';

import { Form, Input, InputNumber, Modal, Switch } from 'ant-design-vue';

const props = defineProps<{
  mode: 'add' | 'edit';
  submitForm: () => Promise<void>;
  submitting: boolean;
}>();

const open = defineModel<boolean>('open', { required: true });
const formState = defineModel<CouponFormState>('formState', { required: true });

const formRef = ref<FormInstance>();

const modalTitle = computed(() =>
  props.mode === 'add' ? '新增优惠券' : '编辑优惠券',
);

const isDefaultChecked = computed({
  get: () => Number(formState.value.isDefault) === 1,
  set: (checked: boolean) => {
    formState.value.isDefault = checked ? 1 : 0;
  },
});

const formRules: Record<string, Rule[]> = {
  title: [{ required: true, message: '请输入券名称', trigger: 'blur' }],
  discountPercentage: [
    {
      required: true,
      message: '请输入折扣比例（%）',
      trigger: 'change',
    },
    {
      validator: async (_rule, value) => {
        if (value === undefined || value === null || value === '') {
          return;
        }
        const num = Number(value);
        if (Number.isNaN(num) || num <= 0) {
          throw new Error('请输入大于 0 的数值');
        }
        if (num > 100) {
          throw new Error('折扣比例不能超过 100%');
        }
      },
      trigger: 'change',
    },
  ],
};

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
      :colon="false"
      label-align="right"
      :label-col="{ style: { width: '130px' } }"
      :model="formState"
      :rules="formRules"
    >
      <Form.Item label="券名称" name="title">
        <Input
          v-model:value="formState.title"
          allow-clear
          placeholder="如：10% 优惠券"
        />
      </Form.Item>
      <Form.Item label="折扣比例（%）" name="discountPercentage">
        <InputNumber
          v-model:value="formState.discountPercentage"
          class="w-full"
          :max="100"
          :min="0.01"
          placeholder="如 10 表示减免 10%"
          :precision="2"
          :step="1"
        />
      </Form.Item>
      <Form.Item label="设为默认券">
        <Switch v-model:checked="isDefaultChecked" />
      </Form.Item>
    </Form>
  </Modal>
</template>
