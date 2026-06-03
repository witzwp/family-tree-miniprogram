// pages/member/detail.js
const app = getApp()

Page({
  data: {
    memberId: null,
    member: {},
    relations: {},
    siblings: [],
    isSelf: false,
    isFamilyMember: true,
    currentFamilyId: null,
  },

  onLoad(options) {
    const { id } = options
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      wx.navigateBack()
      return
    }

    this.setData({
      memberId: id,
      currentFamilyId: app.globalData.currentFamilyId,
    })
    this.loadMemberDetail(id)
  },

  onShow() {
    const familyId = app.globalData.currentFamilyId
    if (familyId !== this.data.currentFamilyId) {
      this.setData({ currentFamilyId: familyId })
      // If family changed, go back since member may not belong to new family
      wx.navigateBack()
    }
  },

  // 加载成员详情
  loadMemberDetail(id) {
    wx.showLoading({ title: '加载中...' })

    wx.cloud.callFunction({
      name: 'member',
      data: {
        action: 'get',
        data: { id },
      },
    }).then((res) => {
      wx.hideLoading()

      if (res.result.code === 0) {
        const { data } = res.result
        this.setData({
          member: data,
          relations: data.relations || {},
        })

        // 检查是否是自己
        this.setData({
          isSelf: app.globalData.memberInfo?._id === id,
        })

        // 加载兄弟姐妹
        this.loadSiblings(data.fatherId, data.motherId, id)
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
      }
    }).catch((err) => {
      wx.hideLoading()
      console.error('加载失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  // 加载兄弟姐妹
  loadSiblings(fatherId, motherId, selfId) {
    if (!fatherId && !motherId) return

    const familyId = app.globalData.currentFamilyId
    if (!familyId) return

    const query = { familyId }
    if (fatherId) query.fatherId = fatherId
    if (motherId) query.motherId = motherId

    wx.cloud.callFunction({
      name: 'member',
      data: {
        action: 'search',
        data: query,
      },
    }).then((res) => {
      if (res.result.code === 0) {
        const siblings = res.result.data.filter((m) => m._id !== selfId)
        this.setData({ siblings })
      }
    })
  },

  // 编辑资料
  editProfile() {
    wx.navigateTo({
      url: `/pages/member/edit?id=${this.data.memberId}`,
    })
  },

  // 复制手机号
  copyPhone() {
    wx.setClipboardData({
      data: this.data.member.phone,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      },
    })
  },

  // 跳转到其他成员
  goToMember(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/member/detail?id=${id}`,
    })
  },
})
