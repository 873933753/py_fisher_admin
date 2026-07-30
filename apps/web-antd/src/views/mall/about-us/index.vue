<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Card, Spin } from 'ant-design-vue';

import AboutUsForm from './components/AboutUsForm.vue';
import { useAboutUsManage } from './composables/useAboutUsManage';

defineOptions({ name: 'MallAboutUs' });

const aboutUsFormRef = ref<InstanceType<typeof AboutUsForm> | null>(null);

const { formState, handleSave, pageLoading, saving } =
  useAboutUsManage(aboutUsFormRef);
</script>

<template>
  <Page title="关于我们">
    <Spin :spinning="pageLoading">
      <Card v-if="!pageLoading" class="about-us-card" size="small">
        <AboutUsForm ref="aboutUsFormRef" v-model:form-state="formState" />
      </Card>
    </Spin>

    <div class="about-us-footer">
      <Button
        type="primary"
        :disabled="pageLoading"
        :loading="saving"
        @click="handleSave"
      >
        保存
      </Button>
    </div>
  </Page>
</template>

<style scoped>
.about-us-card {
  max-width: 960px;
}

.about-us-footer {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  padding-bottom: 10px;
  margin-top: 10px;
}
</style>
