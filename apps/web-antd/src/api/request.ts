/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

/**
 * 包装 Vben 鉴权拦截器，在每次 401 时动态读取 enableRefreshToken。
 * request.ts 会在 initPreferences 之前被静态 import，不能直接固化该配置值。
 */
function createAuthenticateResponseInterceptor(options: {
  client: RequestClient;
  doReAuthenticate: () => Promise<void>;
  doRefreshToken: () => Promise<string>;
  formatToken: (token: string) => null | string;
}) {
  return {
    rejected: async (error: unknown) => {
      const interceptor = authenticateResponseInterceptor({
        ...options,
        enableRefreshToken: preferences.app.enableRefreshToken,
      });
      return interceptor.rejected?.(error);
    },
  };
}

async function handleReAuthenticate() {
  const accessStore = useAccessStore();
  if (preferences.app.loginExpiredMode === 'modal') {
    accessStore.setLoginExpired(true);
    return;
  }
  const { useAuthStore } = await import('#/store');
  await useAuthStore().logout();
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

const defaultInterceptorOptions = {
  codeField: 'code',
  dataField: 'data',
  successCode: (code: number | string) =>
    code === 0 || code === 200 || code === '200',
} as const;

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
    defaultResponseInterceptor(defaultInterceptorOptions),
  );

  // 通用的错误处理（须在 authenticate 之前注册，rejected 链中后执行）
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      const httpStatus = error?.response?.status ?? error?.status;
      if (httpStatus === 401) {
        return;
      }

      const responseData = error?.response?.data ?? {};
      const errorMessage =
        responseData?.error ?? responseData?.message ?? responseData?.msg ?? '';
      message.error(errorMessage || msg);
    }),
  );

  // HTTP 401：静默刷新 token 并重试原请求
  client.addResponseInterceptor(
    createAuthenticateResponseInterceptor({
      client,
      formatToken: (token) => `Bearer ${token}`,
      doRefreshToken: async () => {
        const { useAuthStore } = await import('#/store');
        return useAuthStore().refreshAccessToken();
      },
      doReAuthenticate: handleReAuthenticate,
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({
  baseURL: apiURL,
  responseReturn: 'data',
});

baseRequestClient.addResponseInterceptor(
  defaultResponseInterceptor(defaultInterceptorOptions),
);
