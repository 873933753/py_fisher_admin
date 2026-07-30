import type { Ref } from 'vue';

import type { MallProductFormMeta } from './injectionKeys';
import type { ProductBizPayload } from './types/product';

import { inject } from 'vue';

import {
  mallProductFormBizKey,
  mallProductFormMetaKey,
  mallProductFormOptionsKey,
} from './injectionKeys';

export function useMallProductFormBiz(): Ref<ProductBizPayload> {
  const injected = inject(mallProductFormBizKey);
  if (!injected) {
    throw new Error(
      'useMallProductFormBiz() must be used within MallProductForm',
    );
  }
  return injected;
}

export function useMallProductFormMeta(): MallProductFormMeta {
  const injected = inject(mallProductFormMetaKey);
  if (!injected) {
    throw new Error(
      'useMallProductFormMeta() must be used within MallProductForm',
    );
  }
  return injected;
}

export function useMallProductFormOptions() {
  const injected = inject(mallProductFormOptionsKey);
  if (!injected) {
    throw new Error(
      'useMallProductFormOptions() must be used within MallProductForm',
    );
  }
  return injected;
}
