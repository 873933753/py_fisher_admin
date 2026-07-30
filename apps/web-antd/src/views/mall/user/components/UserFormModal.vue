<script lang="ts" setup>
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import type { AdminUserEditForm } from '../composables/useMallUserManage';

import { computed, ref } from 'vue';

import {
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Spin,
  Switch,
} from 'ant-design-vue';

import { MallSingleImageUpload } from '#/components/single-image-upload';

const props = defineProps<{
  detailLoading?: boolean;
  submitting: boolean;
  submitUpdate: () => Promise<void>;
}>();

const open = defineModel<boolean>('open', { required: true });
const formState = defineModel<AdminUserEditForm>('formState', {
  required: true,
});

const formRef = ref<FormInstance>();

const formRules = computed<Record<string, Rule[]>>(() => ({
  nickname: [
    { max: 24, message: '昵称最长24个字符', trigger: 'blur' },
  ],
  avatar: [
    { max: 255, message: '头像地址最长255个字符', trigger: 'blur' },
  ],
  beans: [
    {
      type: 'number',
      min: 0,
      message: '鱼豆数量不能小于0',
      trigger: 'change',
    },
  ],
  phone_number: [
    { max: 18, message: '手机号最长18个字符', trigger: 'blur' },
  ],
}));

async function handleModalOk() {
  try {
    await formRef.value?.validate();
  } catch {
    throw new Error('validation');
  }
  try {
    await props.submitUpdate();
  } catch {
    throw new Error('submit');
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    :confirm-loading="submitting"
    :destroy-on-close="true"
    ok-text="保存"
    title="编辑用户信息"
    :width="720"
    @ok="handleModalOk"
  >
    <Spin :spinning="detailLoading">
      <Form
        ref="formRef"
        :model="formState"
        :rules="formRules"
        class="mt-2"
        layout="horizontal"
        :label-col="{ style: { width: '108px', flex: '0 0 108px' } }"
        :wrapper-col="{ style: { flex: '1 1 auto', minWidth: 0 } }"
      >
        <Row :gutter="[16, 0]">
          <Col :span="24">
            <Form.Item label="邮箱">
              <Input :value="formState.email" disabled />
            </Form.Item>
          </Col>
          <Col :span="12" :xs="24">
            <Form.Item label="注册时间">
              <Input :value="formState.create_time || '—'" disabled />
            </Form.Item>
          </Col>
          <Col :span="12" :xs="24">
            <Form.Item label="状态" name="is_disabled">
              <Switch
                v-model:checked="formState.is_disabled"
                checked-children="已禁用"
                un-checked-children="正常"
              />
            </Form.Item>
          </Col>
          <Col :span="12" :xs="24">
            <Form.Item label="昵称" name="nickname">
              <Input
                v-model:value="formState.nickname"
                allow-clear
                :maxlength="24"
                placeholder="请输入昵称"
              />
            </Form.Item>
          </Col>
          <Col :span="12" :xs="24">
            <Form.Item label="手机号" name="phone_number">
              <Input
                v-model:value="formState.phone_number"
                allow-clear
                :maxlength="18"
                placeholder="请输入手机号"
              />
            </Form.Item>
          </Col>
          <Col :span="12" :xs="24">
            <Form.Item label="鱼豆" name="beans">
              <InputNumber
                v-model:value="formState.beans"
                class="w-full"
                :min="0"
                placeholder="请输入鱼豆数量"
              />
            </Form.Item>
          </Col>
          <Col :span="24">
            <Form.Item class="user-avatar-form-item" label="头像" name="avatar">
              <MallSingleImageUpload
                v-model="formState.avatar"
                upload-mode="admin-image"
                upload-prefix="avatars"
              />
            </Form.Item>
          </Col>
          <Col :span="12" :xs="24">
            <Form.Item label="送出计数">
              <Input :value="String(formState.send_counter)" disabled />
            </Form.Item>
          </Col>
          <Col :span="12" :xs="24">
            <Form.Item label="收到计数">
              <Input :value="String(formState.receive_counter)" disabled />
            </Form.Item>
          </Col>
          <Col :span="12" :xs="24">
            <Form.Item label="微信 OpenID">
              <Input
                :value="formState.wx_open_id || '—'"
                disabled
              />
            </Form.Item>
          </Col>
          <Col :span="12" :xs="24">
            <Form.Item label="微信昵称">
              <Input :value="formState.wx_name || '—'" disabled />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Spin>
  </Modal>
</template>

<style scoped>
.user-avatar-form-item :deep(.ant-form-item-control-input-content) {
  min-height: 104px;
}
</style>
