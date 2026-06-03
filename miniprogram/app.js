App({
  globalData: {
    userInfo: null,
    memberInfo: null,
    familyInfo: null,
    currentFamilyId: null,
    isLoggedIn: false,
    isRegistered: false,
  },

  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'YOUR_CLOUD_ENV_ID', // 后续替换为实际环境ID
        traceUser: true,
      })
    }

    // 从本地存储加载当前家族
    const storedFamilyId = wx.getStorageSync('currentFamilyId')
    if (storedFamilyId) {
      this.globalData.currentFamilyId = storedFamilyId
    }

    // 检查登录状态
    this.checkLoginStatus()
  },

  // 检查登录和注册状态
  checkLoginStatus() {
    const that = this

    wx.cloud.callFunction({
      name: 'user',
      data: { action: 'checkStatus' },
    }).then((res) => {
      const { isLoggedIn, isRegistered, userInfo, memberInfo } = res.result
      that.globalData.isLoggedIn = isLoggedIn
      that.globalData.isRegistered = isRegistered
      that.globalData.userInfo = userInfo
      that.globalData.memberInfo = memberInfo

      // 根据状态决定跳转
      if (!isLoggedIn) {
        wx.redirectTo({ url: '/pages/login/index' })
      } else if (!isRegistered) {
        wx.redirectTo({ url: '/pages/welcome/index' })
      }
    }).catch((err) => {
      console.error('检查登录状态失败:', err)
    })
  },

  // 更新全局数据
  setGlobalData(key, value) {
    this.globalData[key] = value
  },

  /**
   * Switches the current active family.
   * @param {string} familyId - The family ID to switch to.
   */
  switchFamily(familyId) {
    this.globalData.currentFamilyId = familyId
    wx.setStorageSync('currentFamilyId', familyId)

    // Load family info
    wx.cloud.callFunction({
      name: 'family',
      data: {
        action: 'getFamilyDetail',
        data: { familyId },
      },
    }).then((res) => {
      if (res.result.code === 0) {
        this.globalData.familyInfo = res.result.data
      }
    }).catch((err) => {
      console.error('加载家族详情失败:', err)
    })
  },
})
