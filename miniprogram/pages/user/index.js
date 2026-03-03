// pages/user/index.js
Page({
  data: {
    userInfo: {},
    memberInfo: null
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  // 加载用户信息
  loadUserInfo() {
    const app = getApp()
    this.setData({
      userInfo: app.globalData.userInfo || {},
      memberInfo: app.globalData.memberInfo || null
    })
  },

  // 去登记
  goToRegister() {
    wx.navigateTo({
      url: '/pages/welcome/index'
    })
  },

  // 我的资料
  goToMyProfile() {
    const { memberInfo } = this.data
    if (!memberInfo) {
      wx.showToast({ title: '请先完成登记', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/member/detail?id=${memberInfo._id}`
    })
  },

  // 我的家谱
  goToFamily() {
    wx.switchTab({
      url: '/pages/family/tree'
    })
  },

  // 添加成员
  goToAddMember() {
    wx.navigateTo({
      url: '/pages/member/add'
    })
  },

  // 邀请家族成员
  inviteFamily() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 显示统计
  showStats() {
    wx.cloud.callFunction({
      name: 'member',
      data: { action: 'getStats' }
    }).then(res => {
      if (res.result.code === 0) {
        const stats = res.result.data
        const content = `
家族总人数: ${stats.totalCount}人

辈分分布:
${Object.entries(stats.generationCount).map(([k, v]) => `第${k}代: ${v}人`).join('\n')}

性别分布:
男: ${stats.genderCount.male}人
女: ${stats.genderCount.female}人
        `.trim()

        wx.showModal({
          title: '家族统计',
          content,
          showCancel: false
        })
      }
    })
  },

  // 显示隐私政策
  showPrivacy() {
    wx.navigateTo({
      url: '/pages/user/privacy'
    })
  },

  // 显示关于
  showAbout() {
    wx.showModal({
      title: '关于家族树',
      content: '家族树是一款帮助记录和展示家族历史的微信小程序。\n\n版本: v1.0.0',
      showCancel: false
    })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需要重新登录',
      success: (res) => {
        if (res.confirm) {
          // 清除登录状态
          const app = getApp()
          app.setGlobalData('isLoggedIn', false)
          app.setGlobalData('isRegistered', false)
          app.setGlobalData('userInfo', null)
          app.setGlobalData('memberInfo', null)

          wx.redirectTo({
            url: '/pages/login/index'
          })
        }
      }
    })
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '加入我们的家族树，一起记录家族历史',
      path: '/pages/welcome/index',
      imageUrl: '/images/share-cover.png'
    }
  }
})
