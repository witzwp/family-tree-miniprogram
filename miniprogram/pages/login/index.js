// pages/login/index.js
Page({
  data: {
    isLoading: false
  },

  onLoad() {
    // 检查是否已登录
    const app = getApp()
    if (app.globalData.isLoggedIn) {
      if (app.globalData.isRegistered) {
        wx.switchTab({ url: '/pages/family/tree' })
      } else {
        wx.redirectTo({ url: '/pages/welcome/index' })
      }
    }
  },

  onGetUserInfo(e) {
    if (e.detail.errMsg !== 'getUserInfo:ok') {
      wx.showToast({
        title: '需要授权才能使用',
        icon: 'none'
      })
      return
    }

    this.setData({ isLoading: true })

    const { avatarUrl, nickName } = e.detail.userInfo

    // 调用云函数登录
    wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'login',
        data: { avatarUrl, nickName }
      }
    }).then(res => {
      const { code, message } = res.result
      if (code === 0) {
        // 更新全局状态
        const app = getApp()
        app.setGlobalData('isLoggedIn', true)
        app.setGlobalData('userInfo', { avatarUrl, nickName })

        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })

        // 跳转到欢迎页或家谱页
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/welcome/index' })
        }, 1000)
      } else {
        wx.showToast({ title: message, icon: 'none' })
      }
    }).catch(err => {
      console.error('登录失败:', err)
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    }).finally(() => {
      this.setData({ isLoading: false })
    })
  },

  showPrivacy() {
    wx.navigateTo({
      url: '/pages/user/privacy'
    })
  },

  showTerms() {
    wx.navigateTo({
      url: '/pages/user/terms'
    })
  }
})
