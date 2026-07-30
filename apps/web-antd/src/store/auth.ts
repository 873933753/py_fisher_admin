import type { Recordable, UserInfo } from '@vben/types'

import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { LOGIN_PATH } from '@vben/constants'
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores'

import { notification } from 'ant-design-vue'
import { defineStore } from 'pinia'

import { getAdminProfileApi, loginApi, mapAdminInfoToUserInfo } from '#/api'
import { $t } from '#/locales'
import { normalizeAppPath } from '#/router/path'

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore()
  const userStore = useUserStore()
  const router = useRouter()

  const loginLoading = ref(false)

  function normalizeUserInfo(userInfo: UserInfo) {
    return {
      ...userInfo,
      homePath: normalizeAppPath(userInfo.homePath),
    }
  }

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(params: Recordable<any>, onSuccess?: () => Promise<void> | void) {
    let userInfo: null | UserInfo = null
    try {
      loginLoading.value = true
      const { accessToken, userInfo: loginUserInfo } = await loginApi({
        password: params.password,
        phone_number: params.phone_number,
      })
      const normalizedUserInfo = normalizeUserInfo(loginUserInfo)

      if (accessToken) {
        accessStore.setAccessToken(accessToken)
        userStore.setUserInfo(normalizedUserInfo)

        userInfo = normalizedUserInfo
        accessStore.setAccessCodes([])

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false)
        } else {
          onSuccess ? await onSuccess?.() : await router.push(normalizeAppPath(userInfo.homePath))
        }

        if (userInfo?.realName) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            duration: 3,
            message: $t('authentication.loginSuccess'),
          })
        }
      }
    } finally {
      loginLoading.value = false
    }

    return {
      userInfo,
    }
  }

  async function logout(redirect: boolean = true) {
    resetAllStores()
    accessStore.setLoginExpired(false)

    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    })
  }

  async function fetchUserInfo() {
    const token = accessStore.accessToken
    if (!token) {
      throw new Error('User info is unavailable. Please login again.')
    }

    const profile = await getAdminProfileApi()
    const normalizedUserInfo = normalizeUserInfo(
      mapAdminInfoToUserInfo(profile, token),
    )
    userStore.setUserInfo(normalizedUserInfo)
    return normalizedUserInfo
  }

  function $reset() {
    loginLoading.value = false
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  }
})
