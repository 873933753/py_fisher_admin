<script lang="ts" setup>
import { computed, watch } from 'vue';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import { BasicLayout, UserDropdown } from '@vben/layouts';
import { preferences, usePreferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { PROJECT_HEADER_AVATAR_SIZE } from '#/preferences';
import { useAuthStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';
import { hasAvatarUrl } from '#/views/mall/user/utils';

import HeaderUserAvatar from './components/HeaderUserAvatar.vue';

const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const { isDark } = usePreferences();

/** 暂时隐藏「个人中心」入口，恢复时在此配置 menus */
const menus = computed(() => []);

const headerAvatarUrl = computed(() => {
  const url = userStore.userInfo?.avatar;
  return hasAvatarUrl(url) ? (url?.trim() ?? '') : '';
});

const loginExpiredAvatar = computed(() => {
  return userStore.userInfo?.avatar ?? preferences.app.defaultAvatar;
});

const userDropdownDescription = computed(() => {
  const username = userStore.userInfo?.username?.trim();
  return username || undefined;
});

const headerAvatarEmail = computed(() => {
  return (
    userStore.userInfo?.username?.trim() ||
    userStore.userInfo?.realName?.trim() ||
    ''
  );
});

async function handleLogout() {
  await authStore.logout(false);
}

watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent,
    isDark: isDark.value,
  }),
  async ({ enable, content, isDark: isDarkValue }) => {
    if (enable) {
      const watermarkColor = isDarkValue
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 0, 0, 0.12)';

      await updateWatermark({
        advancedStyle: {
          colorStops: [
            {
              color: watermarkColor,
              offset: 0,
            },
            {
              color: watermarkColor,
              offset: 1,
            },
          ],
          type: 'linear',
        },
        content:
          content ||
          userStore.userInfo?.realName ||
          userStore.userInfo?.username ||
          '',
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar="headerAvatarUrl"
        :menus
        :text="userStore.userInfo?.realName"
        :description="userDropdownDescription"
        @logout="handleLogout"
      >
        <template #avatar>
          <HeaderUserAvatar
            :avatar="userStore.userInfo?.avatar"
            :email="headerAvatarEmail"
            dot
            email-avatar-variant="header"
            :size="PROJECT_HEADER_AVATAR_SIZE"
          />
        </template>
        <template #avatar-large>
          <HeaderUserAvatar
            :avatar="userStore.userInfo?.avatar"
            :email="headerAvatarEmail"
            dot
            dot-class="bottom-0 right-1 border-2 size-4 bg-green-500"
            :size="48"
          />
        </template>
      </UserDropdown>
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar="loginExpiredAvatar"
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
  </BasicLayout>
</template>

<style lang="scss" scoped>
:deep(header.bg-header) {
  color: #fff;
  background: linear-gradient(270deg, #e169ff, #7a73f4 47%, #3d50ff);
  border-bottom-color: rgb(255 255 255 / 16%);
}

:deep(header.bg-header .user-default-avatar--header) {
  background-color: #fff !important;
}

:deep(header.bg-header .user-default-avatar--header),
:deep(header.bg-header .user-default-avatar--header *) {
  color: hsl(var(--primary)) !important;
}

:deep(.bg-sidebar),
:deep(.bg-sidebar-deep) {
  --menu-background-color: transparent;
  --menu-item-background-color: transparent;
  --menu-item-color: rgb(255 255 255 / 96%);
  --menu-item-hover-color: rgb(255 255 255 / 98%);
  --menu-item-hover-background-color: rgb(255 255 255 / 18%);
  --menu-item-active-color: #3d50ff;
  --menu-item-active-background-color: #fff;

  background: linear-gradient(0deg, #e169ff, #7a73f4 47%, #3d50ff) !important;
  border-right: none !important;
}

:deep(.bg-sidebar .vben-menu),
:deep(.bg-sidebar .vben-menu__popup-container),
:deep(.bg-sidebar-deep .vben-menu),
:deep(.bg-sidebar-deep .vben-menu__popup-container),
:deep(.bg-sidebar .vben-normal-menu),
:deep(.bg-sidebar-deep .vben-normal-menu) {
  --menu-background-color: transparent !important;
  --menu-item-background-color: transparent !important;

  background: transparent !important;
}

:deep(header.bg-header *),
:deep(.bg-sidebar *),
:deep(.bg-sidebar-deep *) {
  color: rgb(255 255 255 / 96%);
}

:deep(header.bg-header svg),
:deep(.bg-sidebar svg),
:deep(.bg-sidebar-deep svg) {
  color: rgb(255 255 255 / 96%);
}

:deep(header.bg-header .text-muted-foreground),
:deep(.bg-sidebar .text-muted-foreground),
:deep(.bg-sidebar-deep .text-muted-foreground) {
  color: rgb(255 255 255 / 78%) !important;
}

:deep(header.bg-header .border-border),
:deep(.bg-sidebar .border-border),
:deep(.bg-sidebar-deep .border-border) {
  border-color: rgb(255 255 255 / 16%) !important;
}

:deep(header.bg-header [data-active='true']),
:deep(.bg-sidebar [data-active='true']),
:deep(.bg-sidebar-deep [data-active='true']) {
  color: #fff;
  background: rgb(255 255 255 / 16%);
}

:deep(header.bg-header [class*='hover:bg-accent']:hover),
:deep(.bg-sidebar [class*='hover:bg-accent']:hover),
:deep(.bg-sidebar-deep [class*='hover:bg-accent']:hover) {
  background: rgb(255 255 255 / 12%) !important;
}

:deep(header.bg-header .vben-menu.is-horizontal) {
  --menu-background-color: transparent !important;
  --menu-item-background-color: transparent !important;
  --menu-font-size: var(--font-size-base, 16px);
  --menu-item-radius: 0;
  --height-horizontal-height: 100%;
  --menu-item-height: 100%;

  height: 100%;
  background: transparent !important;
}

:deep(header.bg-header .vben-menu.is-horizontal > .vben-menu-item) {
  height: 100%;
}

:deep(header.bg-header .vben-menu.is-horizontal a[role='menuitem']) {
  height: 100%;
  color: rgb(255 255 255 / 96%) !important;
  border-radius: 0 !important;
}

:deep(header.bg-header .vben-menu.is-horizontal a[role='menuitem']:hover) {
  color: rgb(255 255 255 / 98%) !important;
  background: rgb(255 255 255 / 18%) !important;
}

:deep(header.bg-header .vben-menu.is-horizontal a[role='menuitem'].is-active) {
  position: relative;
  color: rgb(255 255 255 / 96%) !important;
  background: rgb(255 255 255 / 16%) !important;
  border-radius: 0 !important;
}

:deep(
  header.bg-header .vben-menu.is-horizontal a[role='menuitem'].is-active::after
) {
  position: absolute;
  bottom: 0;
  bottom: 8px;
  left: 55%;
  width: 40%;
  height: 4px;
  content: '';
  background: #fff;
  border-radius: 999px;
  transform: translateX(-50%);
}

:deep(
  header.bg-header .vben-menu.is-horizontal a[role='menuitem'].is-active *
) {
  color: rgb(255 255 255 / 96%) !important;
}

:deep(.bg-sidebar a[role='menuitem']),
:deep(.bg-sidebar-deep a[role='menuitem']) {
  color: rgb(255 255 255 / 96%) !important;
}

:deep(.bg-sidebar a[role='menuitem']:hover),
:deep(.bg-sidebar-deep a[role='menuitem']:hover) {
  color: rgb(255 255 255 / 98%) !important;
  background: rgb(255 255 255 / 18%) !important;
}

:deep(.bg-sidebar a[role='menuitem'].is-active),
:deep(.bg-sidebar-deep a[role='menuitem'].is-active) {
  color: #3d50ff !important;
  background: #fff !important;
}

:deep(.bg-sidebar a[role='menuitem'].is-active *),
:deep(.bg-sidebar-deep a[role='menuitem'].is-active *) {
  color: #3d50ff !important;
}

:deep(.bg-sidebar .vben-sub-menu > .vben-sub-menu-content),
:deep(.bg-sidebar-deep .vben-sub-menu > .vben-sub-menu-content) {
  color: rgb(255 255 255 / 96%) !important;
  background: transparent !important;
}

:deep(.bg-sidebar .vben-sub-menu > .vben-sub-menu-content *),
:deep(.bg-sidebar-deep .vben-sub-menu > .vben-sub-menu-content *) {
  color: rgb(255 255 255 / 96%) !important;
}

:deep(
  .bg-sidebar .vben-sub-menu:not(.is-active) > .vben-sub-menu-content:hover
),
:deep(
  .bg-sidebar-deep .vben-sub-menu:not(.is-active) > .vben-sub-menu-content:hover
) {
  color: rgb(255 255 255 / 98%) !important;
  background: rgb(255 255 255 / 18%) !important;
}

:deep(
  .bg-sidebar .vben-sub-menu:not(.is-active) > .vben-sub-menu-content:hover *
),
:deep(
  .bg-sidebar-deep
    .vben-sub-menu:not(.is-active)
    > .vben-sub-menu-content:hover
    *
) {
  color: rgb(255 255 255 / 98%) !important;
}

:deep(.bg-sidebar .vben-sub-menu.is-active > .vben-sub-menu-content:hover),
:deep(
  .bg-sidebar-deep .vben-sub-menu.is-active > .vben-sub-menu-content:hover
) {
  color: rgb(255 255 255 / 98%) !important;
  background: rgb(255 255 255 / 18%) !important;
}

:deep(.bg-sidebar .vben-sub-menu.is-active > .vben-sub-menu-content:hover *),
:deep(
  .bg-sidebar-deep .vben-sub-menu.is-active > .vben-sub-menu-content:hover *
) {
  color: rgb(255 255 255 / 98%) !important;
}

:deep(.bg-sidebar .vben-normal-menu__item),
:deep(.bg-sidebar-deep .vben-normal-menu__item) {
  color: rgb(255 255 255 / 96%) !important;
  background: transparent !important;
}

:deep(.bg-sidebar .vben-normal-menu__item:not(.is-active):hover),
:deep(.bg-sidebar-deep .vben-normal-menu__item:not(.is-active):hover) {
  color: rgb(255 255 255 / 98%) !important;
  background: rgb(255 255 255 / 18%) !important;
}

:deep(.bg-sidebar .vben-normal-menu__item:not(.is-active):hover *),
:deep(.bg-sidebar-deep .vben-normal-menu__item:not(.is-active):hover *) {
  color: rgb(255 255 255 / 98%) !important;
}

:deep(.bg-sidebar .vben-normal-menu__item.is-active),
:deep(.bg-sidebar-deep .vben-normal-menu__item.is-active) {
  color: #3d50ff !important;
  background: #fff !important;
}

:deep(.bg-sidebar .vben-normal-menu__item.is-active *),
:deep(.bg-sidebar-deep .vben-normal-menu__item.is-active *) {
  color: #3d50ff !important;
}

:deep(.bg-sidebar .vben-normal-menu__item.is-active:hover),
:deep(.bg-sidebar-deep .vben-normal-menu__item.is-active:hover) {
  color: rgb(255 255 255 / 98%) !important;
  background: rgb(255 255 255 / 18%) !important;
}

:deep(.bg-sidebar .vben-normal-menu__item.is-active:hover *),
:deep(.bg-sidebar-deep .vben-normal-menu__item.is-active:hover *) {
  color: rgb(255 255 255 / 98%) !important;
}

:deep(main.bg-background-deep) {
  background: #fff;
}
</style>
