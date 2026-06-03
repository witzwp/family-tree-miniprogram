// pages/register/relations.js
const app = getApp()

Page({
  data: {
    profileData: null,
    father: null,
    mother: null,
    spouse: null,
    children: [],
    showSelector: false,
    selectorType: '',
    searchResults: [],
    allMembers: []
  },

  onLoad() {
    // 获取上一步填写的个人信息
    const profileData = wx.getStorageSync('profileData')
    if (!profileData) {
      wx.redirectTo({ url: '/pages/register/profile' })
      return
    }
    this.setData({ profileData })

    // 加载所有成员供选择
    this.loadAllMembers()
  },

  // 加载所有成员
  loadAllMembers() {
    const familyId = app.globalData.currentFamilyId
    if (!familyId) return

    wx.cloud.callFunction({
      name: 'member',
      data: {
        action: 'search',
        data: { familyId },
      },
    }).then(res => {
      if (res.result.code === 0) {
        this.setData({ allMembers: res.result.data })
      }
    })
  },

  // 选择关系
  selectRelation(e) {
    const { type } = e.currentTarget.dataset
    this.setData({
      showSelector: true,
      selectorType: type,
      searchResults: this.data.allMembers
    })
  },

  // 关闭选择器
  closeSelector() {
    this.setData({ showSelector: false })
  },

  // 搜索成员
  onSearchMember(e) {
    const keyword = e.detail.value.toLowerCase()
    const filtered = this.data.allMembers.filter(m =>
      m.name.toLowerCase().includes(keyword)
    )
    this.setData({ searchResults: filtered })
  },

  // 确认选择
  confirmSelection(e) {
    const { item } = e.currentTarget.dataset
    const { selectorType } = this.data

    if (selectorType === 'children') {
      const children = [...this.data.children, item]
      this.setData({ children, showSelector: false })
    } else {
      this.setData({
        [selectorType]: item,
        showSelector: false
      })
    }
  },

  // 移除关系
  removeRelation(e) {
    const { type, index } = e.currentTarget.dataset

    if (type === 'children') {
      const children = [...this.data.children]
      children.splice(index, 1)
      this.setData({ children })
    } else {
      this.setData({ [type]: null })
    }
  },

  // 添加新成员（简化版，跳转添加页）
  addNewMember() {
    wx.showToast({
      title: '请先完成您的登记，再添加其他成员',
      icon: 'none'
    })
  },

  // 跳过关系填写
  skipRelations() {
    this.completeRegister()
  },

  // 完成登记
  completeRegister() {
    const { profileData, father, mother, spouse, children } = this.data

    const memberData = {
      ...profileData,
      fatherId: father?._id || null,
      motherId: mother?._id || null,
      spouseId: spouse?._id || null,
      childrenIds: children.map(c => c._id)
    }

    wx.showLoading({ title: '保存中...' })

    // 创建成员
    wx.cloud.callFunction({
      name: 'member',
      data: {
        action: 'create',
        data: memberData
      }
    }).then(res => {
      wx.hideLoading()

      if (res.result.code === 0) {
        // 清理临时数据
        wx.removeStorageSync('profileData')

        wx.showToast({
          title: '登记成功！',
          icon: 'success'
        })

        // 更新全局状态
        app.setGlobalData('isRegistered', true)

        // 跳转到家谱页
        setTimeout(() => {
          wx.switchTab({ url: '/pages/family/tree' })
        }, 1500)
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('登记失败:', err)
      wx.showToast({ title: '登记失败，请重试', icon: 'none' })
    })
  }
})
