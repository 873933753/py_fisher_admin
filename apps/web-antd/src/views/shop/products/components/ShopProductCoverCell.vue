<script lang="ts" setup>
import { computed } from 'vue';

import { Image } from 'ant-design-vue';

const props = defineProps<{
  src?: string;
}>();

const previewUrl = computed(() => props.src?.trim() ?? '');
const hasPreview = computed(() => Boolean(previewUrl.value));
</script>

<template>
  <div v-if="hasPreview" class="shop-product-cover-cell">
    <Image
      :height="48"
      :src="previewUrl"
      :width="48"
      class="shop-product-cover-cell__img rounded object-cover"
    />
  </div>
  <span v-else class="text-muted-foreground">—</span>
</template>

<style scoped>
.shop-product-cover-cell {
  display: inline-flex;
  justify-content: center;
}

.shop-product-cover-cell__img {
  display: block;
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
}
</style>
