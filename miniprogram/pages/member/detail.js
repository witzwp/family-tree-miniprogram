// pages/member/detail.js
Page({
  data: {
    memberId: null,
    member: {},
    relations: {},
    siblings: [],
    isSelf: false,
    isFamilyMember: true
  },

  onLoad(options) {
    const { id } = options
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      wx.navigateBack()
      return
    }

    this.setData({ memberId: id })
    this.loadMemberDetail(id)
  },

  // 加载成员详情
  loadMemberDetail(id) {
    wx.showLoading({ title: '加载中...' })

    wx.cloud.callFunction({
      name: 'member',
      data: {
        action: 'get',
        data: { id }
      }
    }).then(res => {
      wx.hideLoading()

      if (res.result.code === 0) {
        const { data } = res.result
        this.setData({
          member: data,
          relations: data.relations || {}
        })

        // 检查是否是自己
        const app = getApp()
        this.setData({
          isSelf: app.globalData.memberInfo?._id === id
        })

        // 加载兄弟姐妹
        this.loadSiblings(data.fatherId, data.motherId, id)
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('加载失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  // 加载兄弟姐妹
  loadSiblings(fatherId, motherId, selfId) {
    if (!fatherId && !motherId) return

    const query = {}
    if (fatherId) query.fatherId = fatherId
    if (motherId) query.motherId = motherId

    wx.cloud.callFunction({
      name: 'member',
      data: {
        action: 'search',
        data: query
      }
    }).then(res => {
      if (res.result.code === 0) {
        const siblings = res.result.data.filter(m => m._id !== selfId)
        this.setData({ siblings })
      }
    })
  },

  // 编辑资料
  editProfile() {
    wx.navigateTo({
      url: `/pages/member/edit?id=${this.data.memberId}`
    })
  },

  // 复制手机号
  copyPhone() {
    wx.setClipboardData({
      data: this.data.member.phone,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  // 跳转到其他成员
  goToMember(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/member/detail?id=${id}`
    })
  }
})
