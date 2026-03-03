// pages/search/index.js
Page({
  data: {
    keyword: '',
    results: [],
    hasSearched: false,
    recentMembers: [],
    generationIndex: 0,
    generationOptions: ['全部辈分', '第1代', '第2代', '第3代', '第4代', '第5代'],
    genderIndex: 0,
    genderOptions: ['全部性别', '男', '女'],
    filters: {}
  },

  onLoad() {
    this.loadRecentMembers()
  },

  // 加载最近更新的成员
  loadRecentMembers() {
    wx.cloud.callFunction({
      name: 'member',
      data: {
        action: 'search',
        data: { limit: 10 }
      }
    }).then(res => {
      if (res.result.code === 0) {
        this.setData({ recentMembers: res.result.data.slice(0, 8) })
      }
    })
  },

  // 输入关键词
  onInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  // 清空搜索
  clearSearch() {
    this.setData({
      keyword: '',
      results: [],
      hasSearched: false
    })
  },

  // 执行搜索
  onSearch() {
    const { keyword, filters } = this.data

    wx.cloud.callFunction({
      name: 'member',
      data: {
        action: 'search',
        data: { keyword, filters }
      }
    }).then(res => {
      if (res.result.code === 0) {
        this.setData({
          results: res.result.data,
          hasSearched: true
        })
      }
    }).catch(err => {
      console.error('搜索失败:', err)
      wx.showToast({ title: '搜索失败', icon: 'none' })
    })
  },

  // 辈分筛选
  onGenerationChange(e) {
    const index = parseInt(e.detail.value)
    const generation = index === 0 ? null : index
    
    this.setData({
      generationIndex: index,
      'filters.generation': generation
    })
    
    if (this.data.keyword || this.data.hasSearched) {
      this.onSearch()
    }
  },

  // 性别筛选
  onGenderChange(e) {
    const index = parseInt(e.detail.value)
    const genderMap = { 0: null, 1: 'male', 2: 'female' }
    
    this.setData({
      genderIndex: index,
      'filters.gender': genderMap[index]
    })
    
    if (this.data.keyword || this.data.hasSearched) {
      this.onSearch()
    }
  },

  // 跳转到详情
  goToDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/member/detail?id=${id}`
    })
  }
})
