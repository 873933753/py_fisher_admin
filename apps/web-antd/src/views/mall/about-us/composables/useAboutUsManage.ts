import type { Ref } from 'vue';

import type { AboutUsFormState } from '../types';

import { onMounted, ref } from 'vue';

import { message } from 'ant-design-vue';

import { findAboutUsInfoApi, saveOrUpdAboutUsApi } from '#/api/core/sysAboutUs';

import {
  emptyAboutUsForm,
  formToSaveBody,
  hasIncompleteWhatsappUploads,
  mapAboutUsInfoToForm,
} from '../utils/aboutUsMapper';

export function useAboutUsManage(
  formComponentRef: Ref<null | { validate: () => Promise<boolean> }>,
) {
  const pageLoading = ref(true);
  const saving = ref(false);
  const formState = ref<AboutUsFormState>(emptyAboutUsForm());

  async function loadInfo(silent = false) {
    if (!silent) pageLoading.value = true;
    try {
      const data = await findAboutUsInfoApi();
      formState.value = mapAboutUsInfoToForm(data ?? null);
    } catch {
      if (!silent) formState.value = emptyAboutUsForm();
    } finally {
      if (!silent) pageLoading.value = false;
    }
  }

  async function handleSave() {
    const valid = (await formComponentRef.value?.validate()) ?? false;
    if (!valid) return;

    if (hasIncompleteWhatsappUploads(formState.value)) {
      message.warning('请等待图片上传完成后再保存');
      return;
    }

    const hasErrorUpload = formState.value.whatsappFiles.some(
      (item) => item.uploadStatus === 'error',
    );
    if (hasErrorUpload) {
      message.warning('存在上传失败的图片，请重试或删除后再保存');
      return;
    }

    saving.value = true;
    try {
      await saveOrUpdAboutUsApi(formToSaveBody(formState.value));
      message.success('保存成功');
      await loadInfo(true);
    } catch {
      // 错误由 request 拦截器提示
    } finally {
      saving.value = false;
    }
  }

  onMounted(() => {
    void loadInfo();
  });

  return {
    formState,
    handleSave,
    loadInfo,
    pageLoading,
    saving,
  };
}
