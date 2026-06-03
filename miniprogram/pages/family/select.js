// pages/family/select.js

const app = getApp()

Page({
  data: {
    families: [],
    currentFamilyId: null,
    loading: true,
    showCreateModal: false,
    newFamilyName: '',
    newFamilyDesc: '',
  },

  onLoad() {
    this.setData({
      currentFamilyId: app.globalData.currentFamilyId,
    })
    this.loadFamilies()
  },

  onShow() {
    this.setData({
      currentFamilyId: app.globalData.currentFamilyId,
    })
  },

  /**
   * Loads all families the user belongs to.
   */
  loadFamilies() {
    this.setData({ loading: true })
    wx.cloud.callFunction({
      name: 'family',
      data: { action: 'getFamilies' },
    }).then((res) => {
      if (res.result.code === 0) {
        this.setData({
          families: res.result.data,
          loading: false,
        })
        // If no current family but families exist, auto-select first
        if (!app.globalData.currentFamilyId && res.result.data.length > 0) {
          this.switchFamily(res.result.data[0]._id)
        }
      } else {
        this.setData({ loading: false })
        wx.showToast({
          title: res.result.message || '加载失败',
          icon: 'none',
        })
      }
    }).catch((err) => {
      console.error('加载家族列表失败:', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none',
      })
    })
  },

  /**
   * Switches to the selected family.
   * @param {string} familyId - Family ID to switch to.
   */
  switchFamily(familyId) {
    if (!familyId) return
    app.switchFamily(familyId)
    this.setData({ currentFamilyId: familyId })
    wx.showToast({
      title: '切换成功',
      icon: 'success',
    })
    // Refresh previous page when going back
    const pages = getCurrentPages()
    if (pages.length >= 2) {
      const prevPage = pages[pages.length - 2]
      if (prevPage && typeof prevPage.loadFamilyData === 'function') {
        prevPage.loadFamilyData()
      }
    }
    setTimeout(() => {
      wx.navigateBack()
    }, 800)
  },

  /**
   * Handles tap on a family card.
   * @param {!Object} e - Tap event.
   */
  onFamilyTap(e) {
    const { id } = e.currentTarget.dataset
    if (id === this.data.currentFamilyId) {
      wx.navigateBack()
      return
    }
    this.switchFamily(id)
  },

  /**
   * Shows the create family modal.
   */
  showCreateModal() {
    this.setData({
      showCreateModal: true,
      newFamilyName: '',
      newFamilyDesc: '',
    })
  },

  /**
   * Hides the create family modal.
   */
  hideCreateModal() {
    this.setData({ showCreateModal: false })
  },

  /**
   * Handles family name input.
   * @param {!Object} e - Input event.
   */
  onNameInput(e) {
    this.setData({ newFamilyName: e.detail.value })
  },

  /**
   * Handles family description input.
   * @param {!Object} e - Input event.
   */
  onDescInput(e) {
    this.setData({ newFamilyDesc: e.detail.value })
  },

  /**
   * Creates a new family.
   */
  createFamily() {
    const { newFamilyName } = this.data
    if (!newFamilyName || !newFamilyName.trim()) {
      wx.showToast({
        title: '请输入家族名称',
        icon: 'none',
      })
      return
    }

    wx.showLoading({ title: '创建中...' })
    wx.cloud.callFunction({
      name: 'family',
      data: {
        action: 'createFamily',
        data: {
          name: newFamilyName.trim(),
          description: this.data.newFamilyDesc.trim(),
        },
      },
    }).then((res) => {
      wx.hideLoading()
      if (res.result.code === 0) {
        this.setData({ showCreateModal: false })
        wx.showToast({
          title: '创建成功',
          icon: 'success',
        })
        // Auto-switch to new family
        const familyId = res.result.data.familyId
        app.switchFamily(familyId)
        this.loadFamilies()
      } else {
        wx.showToast({
          title: res.result.message || '创建失败',
          icon: 'none',
        })
      }
    }).catch((err) => {
      wx.hideLoading()
      console.error('创建家族失败:', err)
      wx.showToast({
        title: '创建失败',
        icon: 'none',
      })
    })
  },

  /**
   * Pull down to refresh.
   */
  onPullDownRefresh() {
    this.loadFamilies()
    wx.stopPullDownRefresh()
  },
})
