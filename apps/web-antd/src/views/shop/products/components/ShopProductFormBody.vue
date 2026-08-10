<script lang="ts" setup>
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import type { ShopProductFormState } from '../types';

import { computed, ref } from 'vue';

import {
  Form,
  Input,
  InputNumber,
  Radio,
  RadioGroup,
} from 'ant-design-vue';

import MallSingleImageUpload from '#/components/single-image-upload/MallSingleImageUpload.vue';

import {
  SHOP_PRODUCT_DESCRIPTION_MAX,
  SHOP_PRODUCT_NAME_MAX,
  SHOP_PRODUCT_STATUS_OFF,
  SHOP_PRODUCT_STATUS_ON,
} from '../constants';

const props = defineProps<{
  mode: 'add' | 'edit';
}>();

const formState = defineModel<ShopProductFormState>('formState', {
  required: true,
});

const formRef = ref<FormInstance>();

const formRules = computed<Record<string, Rule[]>>(() => ({
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    {
      max: SHOP_PRODUCT_NAME_MAX,
      message: `商品名称不能超过 ${SHOP_PRODUCT_NAME_MAX} 个字符`,
      trigger: 'blur',
    },
  ],
  priceYuan: [
    { required: true, message: '请输入售价', trigger: 'change' },
    {
      type: 'number',
      min: 0.01,
      message: '售价必须大于 0',
      trigger: 'change',
    },
  ],
  stock: [
    { required: true, message: '请输入库存', trigger: 'change' },
    {
      type: 'number',
      min: 0,
      message: '库存不能小于 0',
      trigger: 'change',
    },
  ],
  cover_url: [{ required: true, message: '请上传商品主图', trigger: 'change' }],
}));

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
    :model="formState"
    :rules="formRules"
    class="shop-product-form-body"
    layout="vertical"
  >
    <Form.Item label="商品名称" name="name">
      <Input
        v-model:value="formState.name"
        allow-clear
        :maxlength="SHOP_PRODUCT_NAME_MAX"
        placeholder="请输入商品名称"
        show-count
      />
    </Form.Item>

    <Form.Item label="商品描述" name="description">
      <Input.TextArea
        v-model:value="formState.description"
        allow-clear
        :maxlength="SHOP_PRODUCT_DESCRIPTION_MAX"
        placeholder="请输入商品描述（选填）"
        :rows="4"
        show-count
      />
    </Form.Item>

    <Form.Item label="售价（元）" name="priceYuan">
      <InputNumber
        v-model:value="formState.priceYuan"
        :min="0.01"
        :precision="2"
        class="w-full max-w-xs"
        placeholder="请输入售价"
      />
    </Form.Item>

    <Form.Item label="库存" name="stock">
      <InputNumber
        v-model:value="formState.stock"
        :min="0"
        :precision="0"
        class="w-full max-w-xs"
        placeholder="请输入库存"
      />
    </Form.Item>

    <Form.Item label="商品主图" name="cover_url">
      <MallSingleImageUpload
        v-model="formState.cover_url"
        upload-mode="admin-image"
        upload-prefix="products"
      />
    </Form.Item>

    <Form.Item v-if="props.mode === 'edit'" label="商品状态" name="status">
      <RadioGroup v-model:value="formState.status">
        <Radio :value="SHOP_PRODUCT_STATUS_OFF">下架</Radio>
        <Radio :value="SHOP_PRODUCT_STATUS_ON">在售</Radio>
      </RadioGroup>
    </Form.Item>
  </Form>
</template>

<style scoped>
.shop-product-form-body {
  max-width: 640px;
}
</style>
