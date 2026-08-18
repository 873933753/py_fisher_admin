<script lang="ts" setup>
import { computed } from 'vue';

import { Form, Input, Modal } from 'ant-design-vue';

import {
  SHOP_REFUND_REJECT_REASON_MAX,
} from '../constants';

const open = defineModel<boolean>('open', { default: false });
const rejectReason = defineModel<string>('rejectReason', { default: '' });

const props = defineProps<{
  refundNo: string;
  submitting: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  submit: [];
}>();

const title = computed(() =>
  props.refundNo ? `拒绝退款（${props.refundNo}）` : '拒绝退款',
);
</script>

<template>
  <Modal
    :confirm-loading="submitting"
    :open="open"
    :title="title"
    ok-text="确认拒绝"
    ok-type="danger"
    @cancel="emit('cancel')"
    @ok="emit('submit')"
  >
    <Form layout="vertical">
      <Form.Item label="拒绝原因" required>
        <Input.TextArea
          v-model:value="rejectReason"
          :disabled="submitting"
          :maxlength="SHOP_REFUND_REJECT_REASON_MAX"
          :rows="4"
          placeholder="请输入拒绝原因"
          show-count
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
