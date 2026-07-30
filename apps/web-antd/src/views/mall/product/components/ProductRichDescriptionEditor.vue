<script lang="ts" setup>
/**
 * 商品详情富文本（WangEditor）：基础样式、颜色、对齐、列表、图片。
 * 图片上传走 OSS 单图接口（/oss/uploadFile），插入可访问的完整预览地址。
 */
import type {
  IDomEditor,
  IEditorConfig,
  IToolbarConfig,
} from '@wangeditor/editor';

import { onBeforeUnmount, shallowRef } from 'vue';

import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import { message } from 'ant-design-vue';

import { uploadOssFileApi } from '#/api/core/oss';

import { resolveOssPreviewUrl } from '../utils/productMedia';

import '@wangeditor/editor/dist/css/style.css';

defineOptions({ name: 'ProductRichDescriptionEditor' });

const model = defineModel<string>({ default: '' });

const editorRef = shallowRef<IDomEditor | undefined>();

const toolbarConfig: Partial<IToolbarConfig> = {
  modalAppendToBody: true,
  toolbarKeys: [
    'bold',
    'italic',
    'underline',
    '|',
    'fontSize',
    '|',
    'color',
    'bgColor',
    '|',
    'bulletedList',
    'numberedList',
    '|',
    'justifyLeft',
    'justifyCenter',
    'justifyRight',
    'justifyJustify',
    '|',
    'uploadImage',
    '|',
    'undo',
    'redo',
    '|',
    'clearStyle',
  ],
};

const editorConfig: Partial<IEditorConfig> = {
  placeholder: '填写商品详情：支持图片、文字颜色与基础样式',
  /** 关闭选中文本时的悬浮工具栏，仅保留顶部工具栏操作 */
  hoverbarKeys: {
    text: {
      menuKeys: [],
    },
  },
  MENU_CONF: {
    /** 档位拉开差距，避免与正文 14px 接近时「看不出变化」 */
    fontSize: {
      fontSizeList: ['12px', '14px', '16px', '18px', '24px', '32px', '48px'],
    },
    uploadImage: {
      maxFileSize: 5 * 1024 * 1024,
      maxNumberOfFiles: 20,
      allowedFileTypes: ['image/*'],
      async customUpload(
        file: File,
        insertFn: (url: string, alt?: string, href?: string) => void,
      ) {
        if (!file.type.startsWith('image/')) {
          message.error('请选择图片文件');
          return;
        }
        try {
          const data = await uploadOssFileApi(file);
          const url = resolveOssPreviewUrl(data.fileUrl, data.ossPath);
          if (!url) {
            message.error('上传成功但未获取到图片地址');
            return;
          }
          insertFn(url, file.name, url);
        } catch {
          message.error(`上传失败：${file.name}`);
        }
      },
    },
  },
};

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor;
}

function handleCustomAlert(info: string, type: string) {
  if (type === 'success') {
    message.success(info);
  } else if (type === 'error') {
    message.error(info);
  } else {
    message.info(info);
  }
}

onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (!editor) return;
  editor.destroy();
  editorRef.value = undefined;
});
</script>

<template>
  <div
    class="product-rich-editor overflow-hidden rounded-lg border border-slate-200 bg-white"
  >
    <Toolbar
      class="border-b border-slate-200"
      :default-config="toolbarConfig"
      :editor="editorRef"
      mode="default"
    />
    <Editor
      v-model="model"
      class="text-left"
      :default-config="editorConfig"
      mode="default"
      style="height: 360px; overflow-y: hidden"
      @custom-alert="handleCustomAlert"
      @on-created="handleCreated"
    />
  </div>
</template>

<style scoped>
.product-rich-editor :deep(.w-e-text-container),
.product-rich-editor :deep(.w-e-scroll) {
  /* 满足 wangEditor 对编辑区高度 >= 300px 的检测，避免 modal 定位告警 */
  min-height: 300px;
}

.product-rich-editor :deep(.w-e-text-container) {
  /* 与 WangEditor 默认编辑区一致，避免仅继承父级字号导致与「默认」档位观感相同 */
  font-size: 16px;
  background-color: #fff;
}
</style>
