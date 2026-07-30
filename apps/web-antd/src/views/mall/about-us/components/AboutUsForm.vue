<script lang="ts" setup>
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import type { AboutUsFormState } from '../types';

import { ref } from 'vue';

import { Form, Input } from 'ant-design-vue';

import AboutUsEmailList from './AboutUsEmailList.vue';
import AboutUsWhatsappUpload from './AboutUsWhatsappUpload.vue';

const formState = defineModel<AboutUsFormState>('formState', {
  required: true,
});

const formRef = ref<FormInstance>();

const formRules: Record<string, Rule[]> = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入正文', trigger: 'blur' }],
  endPage: [{ required: true, message: '请输入页脚文案', trigger: 'blur' }],
};

async function validate(): Promise<boolean> {
  try {
    await formRef.value?.validate();
    return true;
  } catch {
    return false;
  }
}

defineExpose({ validate });
</script>

<template>
  <Form
    ref="formRef"
    class="about-us-form"
    :model="formState"
    :rules="formRules"
    layout="horizontal"
    :label-col="{ style: { width: '120px', flex: '0 0 120px' } }"
    :wrapper-col="{ style: { flex: '1 1 auto', minWidth: 0 } }"
  >
    <Form.Item label="标题" name="title">
      <Input
        v-model:value="formState.title"
        allow-clear
        placeholder="请输入标题"
      />
    </Form.Item>

    <Form.Item label="正文" name="content">
      <Input.TextArea
        v-model:value="formState.content"
        :rows="8"
        allow-clear
        placeholder="请输入正文介绍"
      />
    </Form.Item>

    <Form.Item label="页脚文案" name="endPage">
      <Input
        v-model:value="formState.endPage"
        allow-clear
        placeholder="例如 ©2006 - 2026 Classic Football Shirts"
      />
    </Form.Item>

    <Form.Item label="邮箱">
      <AboutUsEmailList v-model="formState.emails" />
    </Form.Item>

    <Form.Item label="WhatsApp 图片">
      <AboutUsWhatsappUpload v-model="formState.whatsappFiles" />
    </Form.Item>
  </Form>
</template>

<style scoped>
.about-us-form :deep(.ant-form-item) {
  margin-bottom: 20px;
}
</style>
