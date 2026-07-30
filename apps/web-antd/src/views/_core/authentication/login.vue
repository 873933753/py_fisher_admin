<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const PHONE_NUMBER_PATTERN = /^1[3-9]\d{9}$/;

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        maxlength: 11,
        placeholder: $t('authentication.phoneNumberTip'),
      },
      fieldName: 'phone_number',
      label: $t('authentication.phoneNumber'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.phoneNumberTip') })
        .regex(PHONE_NUMBER_PATTERN, {
          message: $t('authentication.phoneNumberInvalid'),
        }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.passwordTip') })
        .min(6, { message: $t('authentication.passwordLengthTip') })
        .max(64, { message: $t('authentication.passwordMaxLengthTip') }),
    },
  ];
});
</script>

<template>
  <AuthenticationLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    :title="$t('authentication.welcomeBack')"
    :show-code-login="false"
    :show-forget-password="false"
    :show-qrcode-login="false"
    :show-register="false"
    :show-third-party-login="false"
    @submit="authStore.authLogin"
  />
</template>
