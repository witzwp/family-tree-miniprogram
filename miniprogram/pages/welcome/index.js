// pages/welcome/index.js
Page({
  data: {},

  onLoad() {
    // 检查是否已登录
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({ url: '/pages/login/index' })
    }
  },

  startRegister() {
    wx.navigateTo({
      url: '/pages/register/profile'
    })
  }
})
