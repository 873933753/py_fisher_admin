<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { Button, Card, Spin } from 'ant-design-vue';

import ShopProductFormBody from '../components/ShopProductFormBody.vue';
import { useShopProductForm } from '../composables/useShopProductForm';

defineOptions({ name: 'ShopProductForm' });

const {
  formState,
  handleCancel,
  handleSubmit,
  mode,
  pageLoading,
  pageTitle,
  saving,
} = useShopProductForm();
</script>

<template>
  <Page :title="pageTitle">
    <Spin :spinning="pageLoading">
      <Card>
        <ShopProductFormBody v-model:form-state="formState" :mode="mode" />
        <div class="mt-6 flex gap-2">
          <Button :loading="saving" type="primary" @click="handleSubmit">
            保存
          </Button>
          <Button :disabled="saving" @click="handleCancel">取消</Button>
        </div>
      </Card>
    </Spin>
  </Page>
</template>
