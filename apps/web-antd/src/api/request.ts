/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

const UNAUTHORIZED_BUSINESS_CODE = 401;

let handlingUnauthorized = false;

function isUnauthorizedError(error: any) {
  const responseData = error?.response?.data ?? error?.data ?? {};
  const businessCode = responseData?.code;
  const httpStatus = error?.response?.status ?? error?.status;

  return (
    businessCode === UNAUTHORIZED_BUSINESS_CODE ||
    businessCode === String(UNAUTHORIZED_BUSINESS_CODE) ||
    httpStatus === UNAUTHORIZED_BUSINESS_CODE
  );
}

async function handleUnauthorized() {
  if (handlingUnauthorized) {
    return;
  }
  handlingUnauthorized = true;
  try {
    const accessStore = useAccessStore();
    if (preferences.app.loginExpiredMode === 'modal') {
      accessStore.setLoginExpired(true);
      return;
    }
    const { useAuthStore } = await import('#/store');
    await useAuthStore().logout();
  } finally {
    handlingUnauthorized = false;
  }
}

function applyCommonHeaders<T extends { headers: Record<string, any> }>(
  config: T,
): T {
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;

  config.headers['Accept-Language'] = preferences.app.locale;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
}

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: (config) => {
      return applyCommonHeaders(config);
    },
  });

  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: (code) => code === 0 || code === 200 || code === '200',
    }),
  );

  // 业务 code 或 HTTP 401：登出 / 登录过期弹窗（须在 errorMessage 之后注册，rejected 链中优先执行）
  client.addResponseInterceptor({
    rejected: async (error) => {
      if (isUnauthorizedError(error)) {
        await handleUnauthorized();
      }
      throw error;
    },
  });

  // 通用的错误处理,如果没有进入上面的错误处理逻辑，就会进入这里
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      // 这里可以根据业务进行定制,你可以拿到 error 内的信息进行定制化处理，根据不同的 code 做不同的提示，而不是直接使用 message.error 提示 msg
      // 当前mock接口返回的错误字段是 error 或者 message
      const responseData = error?.response?.data ?? {};
      const errorMessage =
        responseData?.error ?? responseData?.message ?? responseData?.msg ?? '';
      // 如果没有错误信息，则会根据状态码进行提示
      message.error(errorMessage || msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });

baseRequestClient.addRequestInterceptor({
  fulfilled: (config) => {
    return applyCommonHeaders(config);
  },
});
