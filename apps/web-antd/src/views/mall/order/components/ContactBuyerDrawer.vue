<script lang="ts" setup>
import type { MailTicketApi } from '#/api/core/mailTicket';
import type { OrderApi } from '#/api/core/order';
import type { ProductFindPageApi } from '#/api/core/product';

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Image,
  Input,
  message,
  Modal,
  Spin,
} from 'ant-design-vue';

import {
  checkMailApi,
  consultSellerPageApi,
  deleteMailApi,
  sendMailApi,
} from '#/api/core/mailTicket';
import { uploadOssFileApi } from '#/api/core/oss';
import { UserDefaultAvatar } from '#/components/user-default-avatar';
import { isVideoReviewFile } from '#/views/mall/product-review/constants';
import { PRODUCT_MEDIA_VIDEO_MAX_BYTES } from '#/views/mall/product/utils/productMedia';
import { hasAvatarUrl } from '#/views/mall/user/utils';

import {
  getMailFiles,
  MAIL_BODY_MAX_LENGTH,
  MAIL_FILE_MAX_COUNT,
  MAIL_SENDER_TYPE,
} from '../constants';

const props = defineProps<{
  open: boolean;
  order?: null | OrderApi.OrderRecord;
  product?: null | ProductFindPageApi.ProductRecord;
}>();

const emit = defineEmits<{
  mailRead: [entityId: string];
  'update:open': [value: boolean];
}>();

const drawerOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const loading = ref(false);
const consultLoading = ref(false);
const sending = ref(false);
const uploadingMedia = ref(false);
const deletingId = ref('');
const messages = ref<MailTicketApi.MailRecord[]>([]);
const consultUsers = ref<MailTicketApi.ConsultSellerRecord[]>([]);
const selectedSessionId = ref('');
const bodyContent = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);
const messagesContainerRef = ref<HTMLElement | null>(null);
const messagesListRef = ref<HTMLElement | null>(null);
const shouldStickToBottom = ref(false);
const previewVisible = ref(false);
const previewImageUrl = ref('');

const CONSULT_USER_AVATAR_SIZE = 40;
const SCROLL_BOTTOM_THRESHOLD = 48;

let resizeObserver: null | ResizeObserver = null;

const MEDIA_ACCEPT =
  'image/*,.mp4,.webm,.mov,video/mp4,video/webm,video/quicktime';

const VIDEO_EXTENSIONS = new Set(['mov', 'mp4', 'webm']);

const composeBusy = computed(() => sending.value || uploadingMedia.value);

const isProductMode = computed(() => Boolean(props.product?.id?.trim()));

const entityId = computed(() => {
  if (isProductMode.value) {
    return props.product?.id?.trim() ?? '';
  }
  return props.order?.orderId?.trim() ?? '';
});

const drawerTitle = computed(() =>
  isProductMode.value ? '回复用户' : '联系买家',
);

const drawerWidth = computed(() => (isProductMode.value ? 880 : 560));

const canCompose = computed(() => {
  if (!isProductMode.value) {
    return true;
  }
  return Boolean(selectedSessionId.value.trim());
});

const buyerLabel = computed(() => {
  const buyer = props.order?.buyer?.trim();
  if (buyer) {
    return buyer;
  }
  const nickName = props.order?.nickName?.trim();
  if (nickName) {
    return nickName;
  }
  return '—';
});

const buyerContact = computed(() => props.order?.nickName?.trim() || '—');

const orderLabel = computed(
  () => props.order?.orderNo?.trim() || entityId.value || '—',
);

const productNameLabel = computed(
  () => props.product?.productName?.trim() || '—',
);

const productIdLabel = computed(() => entityId.value || '—');

const sortedMessages = computed(() =>
  [...messages.value].toSorted((left, right) => {
    const leftTime = left.createTime ?? left.lastMessageTime ?? '';
    const rightTime = right.createTime ?? right.lastMessageTime ?? '';
    return leftTime.localeCompare(rightTime);
  }),
);

function resetComposeForm() {
  bodyContent.value = '';
}

function resetProductSessionState() {
  consultUsers.value = [];
  selectedSessionId.value = '';
  messages.value = [];
}

function getConsultUserDisplayName(record: MailTicketApi.ConsultSellerRecord) {
  const email = record.email?.trim();
  if (email) {
    return email;
  }
  return '用户';
}

function hasUnreadConsultUser(record: MailTicketApi.ConsultSellerRecord) {
  return record.isReadAgent === 0;
}

function markConsultUserRead(sessionId: string) {
  const normalizedId = sessionId.trim();
  if (!normalizedId) {
    return;
  }
  consultUsers.value = consultUsers.value.map((item) =>
    item.sessionId?.trim() === normalizedId
      ? { ...item, isReadAgent: 1 as const }
      : item,
  );
}

function extensionFromPath(pathOrUrl: string): string {
  const raw = pathOrUrl.split(/[?#]/)[0] ?? pathOrUrl;
  const base = raw.split('/').pop() ?? raw;
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return '';
  return base.slice(dot + 1).toLowerCase();
}

function isVideoPath(pathOrUrl: string): boolean {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return false;
  return VIDEO_EXTENSIONS.has(extensionFromPath(trimmed));
}

function isVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) {
    const ext = extensionFromPath(file.name);
    return !ext || VIDEO_EXTENSIONS.has(ext);
  }
  return isVideoPath(file.name);
}

function validateMediaFile(file: File): boolean {
  const isVideo = isVideoFile(file);
  const isImage = file.type.startsWith('image/');

  if (isVideo) {
    if (!isVideoFile(file)) {
      message.error('仅支持 mp4、webm、mov 格式的视频');
      return false;
    }
    if (file.size > PRODUCT_MEDIA_VIDEO_MAX_BYTES) {
      message.error('视频超过 100MB 限制');
      return false;
    }
  } else if (!isImage) {
    message.error('仅支持图片或 mp4/webm/mov 视频');
    return false;
  }

  return true;
}

function openMediaPicker() {
  if (composeBusy.value || !canCompose.value) {
    return;
  }
  fileInputRef.value?.click();
}

function getSenderLabel(record: MailTicketApi.MailRecord): string {
  if (record.senderType === MAIL_SENDER_TYPE.CS) {
    return '客服';
  }
  const nickName = record.nickName?.trim();
  if (nickName) {
    return nickName;
  }
  return '买家';
}

function getSenderDisplay(record: MailTicketApi.MailRecord): string {
  if (record.senderType === MAIL_SENDER_TYPE.CS) {
    const email = record.email?.trim();
    if (email) {
      return `客服-${email}`;
    }
    return '客服';
  }

  if (isProductMode.value) {
    const email = record.email?.trim();
    if (email) {
      return `用户-${email}`;
    }
    return '用户';
  }

  const label = getSenderLabel(record);
  const email = record.email?.trim();
  if (!email) {
    return label;
  }
  if (label === email) {
    return email;
  }
  return `${label}-${email}`;
}

function getMessageTime(record: MailTicketApi.MailRecord): string {
  return record.createTime?.trim() || record.lastMessageTime?.trim() || '—';
}

function performScroll() {
  const container = messagesContainerRef.value;
  if (!container) {
    return;
  }
  container.scrollTop = container.scrollHeight;
}

async function scrollToBottom() {
  shouldStickToBottom.value = true;
  await nextTick();
  const scroll = () => performScroll();
  scroll();
  requestAnimationFrame(scroll);
  requestAnimationFrame(() => requestAnimationFrame(scroll));
}

function isNearBottom(): boolean {
  const el = messagesContainerRef.value;
  if (!el) {
    return true;
  }
  return (
    el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_BOTTOM_THRESHOLD
  );
}

function handleMessagesScroll() {
  if (!isNearBottom()) {
    shouldStickToBottom.value = false;
  }
}

function setupResizeObserver() {
  teardownResizeObserver();
  const contentEl = messagesListRef.value;
  if (!contentEl) {
    return;
  }
  resizeObserver = new ResizeObserver(() => {
    if (shouldStickToBottom.value) {
      performScroll();
    }
  });
  resizeObserver.observe(contentEl);
}

function teardownResizeObserver() {
  resizeObserver?.disconnect();
  resizeObserver = null;
}

function handleMediaLoaded() {
  if (shouldStickToBottom.value) {
    performScroll();
  }
}

function openImagePreview(url: string) {
  previewImageUrl.value = url;
  previewVisible.value = true;
}

function onPreviewVisibleChange(visible: boolean) {
  previewVisible.value = visible;
  if (!visible) {
    previewImageUrl.value = '';
  }
}

function handleDrawerOpenChange(open: boolean) {
  if (open) {
    shouldStickToBottom.value = true;
    void nextTick(() => {
      setupResizeObserver();
      if (messages.value.length > 0) {
        void scrollToBottom();
      }
    });
    return;
  }
  teardownResizeObserver();
  shouldStickToBottom.value = false;
  previewVisible.value = false;
  previewImageUrl.value = '';
}

function getCheckMailParams(): MailTicketApi.CheckMailParams | null {
  const id = entityId.value;
  if (!id) {
    return null;
  }
  if (isProductMode.value) {
    const sessionId = selectedSessionId.value.trim();
    if (!sessionId) {
      return null;
    }
    return { productId: id, sessionId };
  }
  return { orderId: id };
}

async function fetchConsultUsers() {
  const productId = entityId.value;
  const productName = props.product?.productName?.trim() ?? '';
  if (!productId || !productName) {
    consultUsers.value = [];
    return;
  }

  consultLoading.value = true;
  try {
    const data = await consultSellerPageApi({ productId, productName });
    consultUsers.value = data.records ?? [];
  } finally {
    consultLoading.value = false;
  }
}

async function fetchMessages(options?: { syncReadState?: boolean }) {
  const checkParams = getCheckMailParams();
  if (!checkParams) {
    messages.value = [];
    return;
  }

  loading.value = true;
  try {
    messages.value = (await checkMailApi(checkParams)) ?? [];
    if (isProductMode.value) {
      markConsultUserRead(selectedSessionId.value);
    } else if (options?.syncReadState) {
      emit('mailRead', entityId.value);
    }
  } finally {
    loading.value = false;
    if (messages.value.length > 0) {
      shouldStickToBottom.value = true;
      await nextTick();
      setupResizeObserver();
      await scrollToBottom();
    }
  }
}

async function selectConsultUser(record: MailTicketApi.ConsultSellerRecord) {
  const sessionId = record.sessionId?.trim();
  if (!sessionId) {
    message.warning('会话 ID 不存在');
    return;
  }
  if (selectedSessionId.value === sessionId) {
    return;
  }
  selectedSessionId.value = sessionId;
  resetComposeForm();
  await fetchMessages();
}

function handleRefresh() {
  if (isProductMode.value) {
    void fetchConsultUsers();
    if (selectedSessionId.value.trim()) {
      void fetchMessages();
    }
    return;
  }
  void fetchMessages();
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetComposeForm();
      if (isProductMode.value) {
        resetProductSessionState();
        void fetchConsultUsers();
        return;
      }
      void fetchMessages({ syncReadState: true });
      return;
    }
    if (!isProductMode.value && entityId.value) {
      emit('mailRead', entityId.value);
    }
    resetProductSessionState();
    resetComposeForm();
    teardownResizeObserver();
    shouldStickToBottom.value = false;
  },
);

watch(
  () => sortedMessages.value.length,
  async (length) => {
    if (length > 0 && props.open) {
      await nextTick();
      setupResizeObserver();
    }
  },
);

onBeforeUnmount(() => {
  teardownResizeObserver();
});

async function sendMessage(options?: { mailFile?: string[] }) {
  const id = entityId.value;
  if (!id) {
    message.warning(isProductMode.value ? '商品 ID 不存在' : '订单 ID 不存在');
    return;
  }

  if (isProductMode.value && !selectedSessionId.value.trim()) {
    message.warning('请先选择左侧用户');
    return;
  }

  const trimmedBody = bodyContent.value.trim();
  const mailFile = options?.mailFile ?? [];

  if (!trimmedBody && mailFile.length === 0) {
    return;
  }
  if (trimmedBody.length > MAIL_BODY_MAX_LENGTH) {
    message.warning(`消息内容不能超过 ${MAIL_BODY_MAX_LENGTH} 字`);
    return;
  }
  if (mailFile.length > MAIL_FILE_MAX_COUNT) {
    message.warning(`最多上传 ${MAIL_FILE_MAX_COUNT} 个附件`);
    return;
  }

  sending.value = true;
  try {
    const payload = {
      bodyContent: trimmedBody,
      ...(mailFile.length > 0 ? { mailFile } : {}),
    };
    await (isProductMode.value
      ? sendMailApi({
          productId: id,
          sessionId: selectedSessionId.value.trim(),
          ...payload,
        })
      : sendMailApi({ orderId: id, ...payload }));
    message.success('消息发送成功');
    resetComposeForm();
    await fetchMessages();
    if (isProductMode.value) {
      await fetchConsultUsers();
    }
  } finally {
    sending.value = false;
  }
}

async function handleSend() {
  const trimmedBody = bodyContent.value.trim();
  if (!trimmedBody) {
    message.warning('请输入消息内容');
    return;
  }
  await sendMessage();
}

async function handleMediaFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || !validateMediaFile(file)) {
    return;
  }

  uploadingMedia.value = true;
  try {
    const data = await uploadOssFileApi(file);
    await sendMessage({ mailFile: [data.ossPath] });
  } catch {
    message.error('上传失败，请重试');
  } finally {
    uploadingMedia.value = false;
  }
}

function confirmDeleteMail(record: MailTicketApi.MailRecord) {
  const mailId = record.id?.trim();
  if (!mailId) {
    message.warning('消息 ID 不存在');
    return;
  }

  Modal.confirm({
    title: '删除消息',
    content: '确定删除这条消息吗？',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      deletingId.value = mailId;
      try {
        await deleteMailApi(mailId);
        message.success('消息已删除');
        await fetchMessages();
        if (isProductMode.value) {
          await fetchConsultUsers();
        }
      } finally {
        deletingId.value = '';
      }
    },
  });
}
</script>

<template>
  <Drawer
    v-model:open="drawerOpen"
    :destroy-on-close="true"
    :title="drawerTitle"
    :width="drawerWidth"
    @after-open-change="handleDrawerOpenChange"
  >
    <template #extra>
      <Button
        :loading="isProductMode ? consultLoading || loading : loading"
        size="small"
        type="primary"
        @click="handleRefresh"
      >
        刷新
      </Button>
    </template>

    <div
      class="contact-buyer-drawer"
      :class="{ 'contact-buyer-drawer--product': isProductMode }"
    >
      <section class="contact-buyer-drawer__meta">
        <template v-if="isProductMode">
          <div class="text-sm">
            <span class="text-muted-foreground">商品名称：</span>
            <span class="font-medium text-foreground">{{
              productNameLabel
            }}</span>
          </div>
          <div class="mt-1 text-sm">
            <span class="text-muted-foreground">商品 ID：</span>
            <span class="text-foreground">{{ productIdLabel }}</span>
          </div>
        </template>
        <template v-else>
          <div class="text-sm">
            <span class="text-muted-foreground">买家：</span>
            <span class="font-medium text-foreground">{{ buyerLabel }}</span>
            <span class="ml-2 text-muted-foreground">{{ buyerContact }}</span>
          </div>
          <div class="mt-1 text-sm">
            <span class="text-muted-foreground">订单：</span>
            <span class="text-foreground">{{ orderLabel }}</span>
          </div>
        </template>
      </section>

      <div v-if="isProductMode" class="contact-buyer-drawer__product-body">
        <aside class="contact-buyer-drawer__users">
          <Spin :spinning="consultLoading">
            <div
              v-if="consultUsers.length > 0"
              class="contact-buyer-drawer__users-list"
            >
              <button
                v-for="record in consultUsers"
                :key="record.sessionId"
                type="button"
                class="contact-buyer-user-item"
                :class="{
                  'contact-buyer-user-item--active':
                    selectedSessionId === record.sessionId,
                }"
                @click="selectConsultUser(record)"
              >
                <Badge :dot="hasUnreadConsultUser(record)">
                  <Avatar
                    v-if="hasAvatarUrl(record.avatar)"
                    :size="CONSULT_USER_AVATAR_SIZE"
                    :src="record.avatar!.trim()"
                  />
                  <UserDefaultAvatar
                    v-else
                    :email="record.email"
                    :size="CONSULT_USER_AVATAR_SIZE"
                  />
                </Badge>
                <div class="contact-buyer-user-item__content">
                  <div class="contact-buyer-user-item__header">
                    <span class="contact-buyer-user-item__name">
                      {{ getConsultUserDisplayName(record) }}
                    </span>
                    <span class="contact-buyer-user-item__time">
                      {{ record.createTime || '—' }}
                    </span>
                  </div>
                  <div class="contact-buyer-user-item__preview">
                    {{ record.bodyContent?.trim() || '暂无消息' }}
                  </div>
                </div>
              </button>
            </div>
            <div
              v-else-if="!consultLoading"
              class="contact-buyer-drawer__users-empty"
            >
              暂无咨询用户
            </div>
          </Spin>
        </aside>

        <div class="contact-buyer-drawer__chat">
          <section
            ref="messagesContainerRef"
            class="contact-buyer-drawer__messages"
            @scroll="handleMessagesScroll"
          >
            <Spin :spinning="loading">
              <div
                v-if="sortedMessages.length > 0"
                ref="messagesListRef"
                class="flex flex-col gap-4 py-1"
              >
                <div
                  v-for="record in sortedMessages"
                  :key="record.id"
                  class="flex"
                  :class="
                    record.senderType === MAIL_SENDER_TYPE.CS
                      ? 'justify-end'
                      : 'justify-start'
                  "
                >
                  <div
                    class="contact-buyer-message"
                    :class="
                      record.senderType === MAIL_SENDER_TYPE.CS
                        ? 'contact-buyer-message--cs'
                        : 'contact-buyer-message--buyer'
                    "
                  >
                    <div class="contact-buyer-message__header">
                      <span class="font-medium">{{
                        getSenderDisplay(record)
                      }}</span>
                      <span class="text-xs text-muted-foreground">
                        {{ getMessageTime(record) }}
                      </span>
                      <button
                        type="button"
                        class="contact-buyer-message__delete"
                        title="删除消息"
                        :disabled="deletingId === record.id"
                        @click="confirmDeleteMail(record)"
                      >
                        <IconifyIcon class="size-4" icon="mdi:delete-outline" />
                      </button>
                    </div>

                    <div
                      v-if="record.bodyContent?.trim()"
                      class="whitespace-pre-wrap break-words text-sm"
                    >
                      {{ record.bodyContent }}
                    </div>

                    <div
                      v-if="getMailFiles(record).length > 0"
                      class="flex flex-wrap gap-2"
                    >
                      <template
                        v-for="(fileUrl, index) in getMailFiles(record)"
                        :key="`${record.id}-${index}`"
                      >
                        <video
                          v-if="isVideoReviewFile(fileUrl)"
                          class="contact-buyer-message__media"
                          controls
                          preload="metadata"
                          :src="fileUrl"
                          @loadeddata="handleMediaLoaded"
                          @loadedmetadata="handleMediaLoaded"
                        ></video>
                        <img
                          v-else
                          alt=""
                          class="contact-buyer-message__media contact-buyer-message__media--img"
                          :src="fileUrl"
                          @click="openImagePreview(fileUrl)"
                          @error="handleMediaLoaded"
                          @load="handleMediaLoaded"
                        />
                      </template>
                    </div>
                  </div>
                </div>
                <div class="contact-buyer-drawer__scroll-anchor"></div>
              </div>
              <div
                v-else-if="!loading"
                class="flex h-full items-center justify-center text-sm text-muted-foreground"
              >
                {{ selectedSessionId ? '暂无消息' : '请选择左侧用户查看会话' }}
              </div>
            </Spin>
          </section>

          <section class="contact-buyer-drawer__compose">
            <input
              ref="fileInputRef"
              type="file"
              class="contact-buyer-drawer__file-input"
              :accept="MEDIA_ACCEPT"
              @change="handleMediaFileChange"
            />
            <button
              type="button"
              class="contact-buyer-drawer__attach-btn"
              title="发送图片或视频"
              :disabled="composeBusy || !canCompose"
              @click="openMediaPicker"
            >
              <IconifyIcon
                v-if="!uploadingMedia"
                class="size-5"
                icon="mdi:image-outline"
              />
              <Spin v-else size="small" />
            </button>
            <Input
              v-model:value="bodyContent"
              class="contact-buyer-drawer__input"
              :disabled="composeBusy || !canCompose"
              :maxlength="MAIL_BODY_MAX_LENGTH"
              placeholder="发送消息"
              @press-enter="handleSend"
            />
            <Button
              :disabled="composeBusy || !canCompose"
              :loading="sending"
              type="primary"
              @click="handleSend"
            >
              发送
            </Button>
          </section>
        </div>
      </div>

      <template v-else>
        <section
          ref="messagesContainerRef"
          class="contact-buyer-drawer__messages"
          @scroll="handleMessagesScroll"
        >
          <Spin :spinning="loading">
            <div
              v-if="sortedMessages.length > 0"
              ref="messagesListRef"
              class="flex flex-col gap-4 py-1"
            >
              <div
                v-for="record in sortedMessages"
                :key="record.id"
                class="flex"
                :class="
                  record.senderType === MAIL_SENDER_TYPE.CS
                    ? 'justify-end'
                    : 'justify-start'
                "
              >
                <div
                  class="contact-buyer-message"
                  :class="
                    record.senderType === MAIL_SENDER_TYPE.CS
                      ? 'contact-buyer-message--cs'
                      : 'contact-buyer-message--buyer'
                  "
                >
                  <div class="contact-buyer-message__header">
                    <span class="font-medium">{{
                      getSenderDisplay(record)
                    }}</span>
                    <span class="text-xs text-muted-foreground">
                      {{ getMessageTime(record) }}
                    </span>
                    <button
                      type="button"
                      class="contact-buyer-message__delete"
                      title="删除消息"
                      :disabled="deletingId === record.id"
                      @click="confirmDeleteMail(record)"
                    >
                      <IconifyIcon class="size-4" icon="mdi:delete-outline" />
                    </button>
                  </div>

                  <div
                    v-if="record.bodyContent?.trim()"
                    class="whitespace-pre-wrap break-words text-sm"
                  >
                    {{ record.bodyContent }}
                  </div>

                  <div
                    v-if="getMailFiles(record).length > 0"
                    class="flex flex-wrap gap-2"
                  >
                    <template
                      v-for="(fileUrl, index) in getMailFiles(record)"
                      :key="`${record.id}-${index}`"
                    >
                      <video
                        v-if="isVideoReviewFile(fileUrl)"
                        class="contact-buyer-message__media"
                        controls
                        preload="metadata"
                        :src="fileUrl"
                        @loadeddata="handleMediaLoaded"
                        @loadedmetadata="handleMediaLoaded"
                      ></video>
                      <img
                        v-else
                        alt=""
                        class="contact-buyer-message__media contact-buyer-message__media--img"
                        :src="fileUrl"
                        @click="openImagePreview(fileUrl)"
                        @error="handleMediaLoaded"
                        @load="handleMediaLoaded"
                      />
                    </template>
                  </div>
                </div>
              </div>
              <div class="contact-buyer-drawer__scroll-anchor"></div>
            </div>
            <div
              v-else-if="!loading"
              class="flex h-full items-center justify-center text-sm text-muted-foreground"
            >
              暂无消息
            </div>
          </Spin>
        </section>

        <section class="contact-buyer-drawer__compose">
          <input
            ref="fileInputRef"
            type="file"
            class="contact-buyer-drawer__file-input"
            :accept="MEDIA_ACCEPT"
            @change="handleMediaFileChange"
          />
          <button
            type="button"
            class="contact-buyer-drawer__attach-btn"
            title="发送图片或视频"
            :disabled="composeBusy"
            @click="openMediaPicker"
          >
            <IconifyIcon
              v-if="!uploadingMedia"
              class="size-5"
              icon="mdi:image-outline"
            />
            <Spin v-else size="small" />
          </button>
          <Input
            v-model:value="bodyContent"
            class="contact-buyer-drawer__input"
            :disabled="composeBusy"
            :maxlength="MAIL_BODY_MAX_LENGTH"
            placeholder="发送消息"
            @press-enter="handleSend"
          />
          <Button
            :disabled="composeBusy"
            :loading="sending"
            type="primary"
            @click="handleSend"
          >
            发送
          </Button>
        </section>
      </template>
    </div>

    <Image
      v-if="previewImageUrl"
      class="contact-buyer-drawer__preview-image"
      :height="1"
      :preview="{
        visible: previewVisible,
        onVisibleChange: onPreviewVisibleChange,
      }"
      :src="previewImageUrl"
      :width="1"
    />
  </Drawer>
</template>

<style scoped>
.contact-buyer-drawer {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

.contact-buyer-drawer--product {
  gap: 12px;
}

.contact-buyer-drawer__meta {
  flex-shrink: 0;
  padding-bottom: 12px;
  border-bottom: 1px solid hsl(var(--border));
}

.contact-buyer-drawer__product-body {
  display: flex;
  flex: 1;
  gap: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.contact-buyer-drawer__users {
  flex-shrink: 0;
  width: 300px;
  overflow-y: auto;
  border-right: 1px solid hsl(var(--border));
}

.contact-buyer-drawer__users-list {
  display: flex;
  flex-direction: column;
}

.contact-buyer-drawer__users-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 16px;
  font-size: 14px;
  color: hsl(var(--muted-foreground));
}

.contact-buyer-user-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  width: 100%;
  padding: 12px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: none;
  border-bottom: 1px solid hsl(var(--border));
  transition: background-color 0.2s;
}

.contact-buyer-user-item:hover {
  background: hsl(var(--muted) / 30%);
}

.contact-buyer-user-item--active {
  background: #e6f4ff;
}

.contact-buyer-user-item__content {
  flex: 1;
  min-width: 0;
}

.contact-buyer-user-item__header {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.contact-buyer-user-item__name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.contact-buyer-user-item__time {
  flex-shrink: 0;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.contact-buyer-user-item__preview {
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
}

.contact-buyer-drawer__chat {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.contact-buyer-drawer__messages {
  flex: 1;
  min-height: 200px;
  overflow-y: auto;
}

.contact-buyer-drawer__compose {
  display: flex;
  flex-shrink: 0;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  padding: 12px;
  border-top: 1px solid hsl(var(--border));
}

.contact-buyer-drawer__file-input {
  display: none;
}

.contact-buyer-drawer__attach-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: rgb(0 0 0 / 65%);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
}

.contact-buyer-drawer__attach-btn:hover:not(:disabled) {
  color: rgb(0 0 0 / 88%);
  background: rgb(0 0 0 / 6%);
}

.contact-buyer-drawer__attach-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.contact-buyer-drawer__input {
  flex: 1;
  min-width: 0;
}

.contact-buyer-drawer__input :deep(.ant-input) {
  height: 36px;
  padding-right: 16px;
  padding-left: 16px;
  background: #f5f5f5;
  border: none;
  border-radius: 999px;
}

.contact-buyer-drawer__input :deep(.ant-input:focus) {
  background: #f0f0f0;
  box-shadow: none;
}

.contact-buyer-drawer__input :deep(.ant-input:disabled) {
  color: rgb(0 0 0 / 45%);
  background: #f5f5f5;
}

.contact-buyer-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 88%;
  padding: 12px;
  border-radius: 8px;
}

.contact-buyer-message--buyer {
  background: hsl(var(--muted) / 40%);
}

.contact-buyer-message--cs {
  background: #e6f4ff;
}

.contact-buyer-message__header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.contact-buyer-message__delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  margin-left: auto;
  color: rgb(0 0 0 / 45%);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
}

.contact-buyer-message__delete:hover:not(:disabled) {
  color: rgb(0 0 0 / 88%);
  background: rgb(0 0 0 / 6%);
}

.contact-buyer-message__delete:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.contact-buyer-drawer__scroll-anchor {
  flex-shrink: 0;
  width: 100%;
  height: 1px;
}

.contact-buyer-drawer__preview-image {
  position: fixed;
  width: 0 !important;
  height: 0 !important;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
}

.contact-buyer-message__media {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 4px;
}

.contact-buyer-message__media--img {
  cursor: pointer;
}
</style>
