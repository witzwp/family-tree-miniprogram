// pages/search/index.js
const { debounce } = require('../../utils/util')

const RECENT_SEARCHES_KEY = 'recentSearches'
const MAX_RECENT_SEARCHES = 10
const MAX_SUGGESTIONS = 8

const app = getApp()

Page({
  data: {
    keyword: '',
    results: [],
    hasSearched: false,
    recentMembers: [],
    recentSearches: [],
    suggestions: [],
    showSuggestions: false,
    isSearching: false,
    generationIndex: 0,
    generationOptions: ['全部辈分', '第1代', '第2代', '第3代', '第4代', '第5代'],
    genderIndex: 0,
    genderOptions: ['全部性别', '男', '女'],
    filters: {},
    currentFamilyId: null,
  },

  onLoad() {
    this.setData({
      currentFamilyId: app.globalData.currentFamilyId,
    })
    this.loadRecentMembers()
    this.loadRecentSearches()
    this.debouncedFetchSuggestions = debounce(
      this.fetchSuggestions.bind(this),
      300,
    )
  },

  onShow() {
    const familyId = app.globalData.currentFamilyId
    if (familyId !== this.data.currentFamilyId) {
      this.setData({
        currentFamilyId: familyId,
        keyword: '',
        results: [],
        suggestions: [],
        showSuggestions: false,
        hasSearched: false,
      })
      this.loadRecentMembers()
    }
  },

  /**
   * Builds search data payload with familyId.
   * @param {!Object} extra - Extra search parameters.
   * @return {!Object} Search payload.
   */
  buildSearchData(extra) {
    return {
      familyId: app.globalData.currentFamilyId,
      ...extra,
    }
  },

  // 加载最近更新的成员
  loadRecentMembers() {
    const familyId = app.globalData.currentFamilyId
    if (!familyId) {
      this.setData({ recentMembers: [] })
      return
    }

    wx.cloud.callFunction({
      name: 'member',
      data: {
        action: 'search',
        data: this.buildSearchData({ limit: 10 }),
      },
    }).then((res) => {
      if (res.result.code === 0) {
        this.setData({
          recentMembers: res.result.data.slice(0, 8),
        })
      }
    })
  },

  // 加载最近搜索记录
  loadRecentSearches() {
    try {
      const recentSearches = wx.getStorageSync(RECENT_SEARCHES_KEY) || []
      this.setData({ recentSearches })
    } catch (e) {
      console.error('加载最近搜索失败:', e)
    }
  },

  // 保存搜索记录
  saveRecentSearch(keyword) {
    if (!keyword || !keyword.trim()) {
      return
    }
    const trimmed = keyword.trim()
    try {
      let recentSearches = wx.getStorageSync(RECENT_SEARCHES_KEY) || []
      recentSearches = recentSearches.filter((item) => item !== trimmed)
      recentSearches.unshift(trimmed)
      if (recentSearches.length > MAX_RECENT_SEARCHES) {
        recentSearches = recentSearches.slice(0, MAX_RECENT_SEARCHES)
      }
      wx.setStorageSync(RECENT_SEARCHES_KEY, recentSearches)
      this.setData({ recentSearches })
    } catch (e) {
      console.error('保存最近搜索失败:', e)
    }
  },

  // 删除单条搜索记录
  removeRecentSearch(e) {
    const { keyword: itemKeyword } = e.currentTarget.dataset
    try {
      let recentSearches = wx.getStorageSync(RECENT_SEARCHES_KEY) || []
      recentSearches = recentSearches.filter((item) => item !== itemKeyword)
      wx.setStorageSync(RECENT_SEARCHES_KEY, recentSearches)
      this.setData({ recentSearches })
    } catch (err) {
      console.error('删除搜索记录失败:', err)
    }
  },

  // 清空所有搜索记录
  clearAllRecentSearches() {
    try {
      wx.removeStorageSync(RECENT_SEARCHES_KEY)
      this.setData({ recentSearches: [] })
    } catch (e) {
      console.error('清空搜索记录失败:', e)
    }
  },

  // 输入关键词
  onInput(e) {
    const keyword = e.detail.value
    this.setData({
      keyword,
      showSuggestions: keyword.length > 0,
      hasSearched: false,
    })
    if (keyword.length > 0) {
      this.debouncedFetchSuggestions(keyword)
    } else {
      this.setData({ suggestions: [], showSuggestions: false })
    }
  },

  // 获取搜索建议
  fetchSuggestions(keyword) {
    if (!keyword || keyword.trim().length === 0) {
      this.setData({ suggestions: [], showSuggestions: false })
      return
    }
    const familyId = app.globalData.currentFamilyId
    if (!familyId) {
      this.setData({ suggestions: [], showSuggestions: false })
      return
    }

    wx.cloud.callFunction({
      name: 'member',
      data: {
        action: 'search',
        data: this.buildSearchData({
          keyword: keyword.trim(),
          limit: MAX_SUGGESTIONS,
          fuzzy: true,
        }),
      },
    }).then((res) => {
      if (res.result.code === 0) {
        const suggestions = res.result.data.map((item) => ({
          ...item,
          highlightedName: this.highlightMatch(item.name, keyword.trim()),
        }))
        this.setData({
          suggestions,
          showSuggestions: suggestions.length > 0,
        })
      }
    }).catch((err) => {
      console.error('获取建议失败:', err)
    })
  },

  // 高亮匹配文本
  highlightMatch(text, keyword) {
    if (!text || !keyword) {
      return text
    }
    const regex = new RegExp(`(${this.escapeRegExp(keyword)})`, 'gi')
    return text.replace(regex, '{{$1}}')
  },

  // 转义正则特殊字符
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  },

  // 选择建议
  onSelectSuggestion(e) {
    const { id, name } = e.currentTarget.dataset
    this.setData({
      keyword: name,
      suggestions: [],
      showSuggestions: false,
    })
    this.saveRecentSearch(name)
    wx.navigateTo({
      url: `/pages/member/detail?id=${id}`,
    })
  },

  // 点击最近搜索
  onRecentSearchTap(e) {
    const { keyword: recentKeyword } = e.currentTarget.dataset
    this.setData({ keyword: recentKeyword })
    this.onSearch()
  },

  // 清空搜索
  clearSearch() {
    this.setData({
      keyword: '',
      results: [],
      suggestions: [],
      showSuggestions: false,
      hasSearched: false,
    })
  },

  // 执行搜索
  onSearch() {
    const { keyword, filters } = this.data
    if (!keyword || !keyword.trim()) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' })
      return
    }
    const familyId = app.globalData.currentFamilyId
    if (!familyId) {
      wx.showToast({ title: '请先选择家族', icon: 'none' })
      return
    }

    this.setData({
      isSearching: true,
      showSuggestions: false,
      suggestions: [],
    })
    this.saveRecentSearch(keyword)
    wx.cloud.callFunction({
      name: 'member',
      data: {
        action: 'search',
        data: this.buildSearchData({
          keyword: keyword.trim(),
          filters,
          limit: 20,
          fuzzy: true,
        }),
      },
    }).then((res) => {
      if (res.result.code === 0) {
        const results = res.result.data.map((item) => ({
          ...item,
          highlightedName: this.highlightMatch(item.name, keyword.trim()),
        }))
        this.setData({
          results,
          hasSearched: true,
        })
      }
    }).catch((err) => {
      console.error('搜索失败:', err)
      wx.showToast({ title: '搜索失败', icon: 'none' })
    }).finally(() => {
      this.setData({ isSearching: false })
    })
  },

  // 辈分筛选
  onGenerationChange(e) {
    const index = parseInt(e.detail.value, 10)
    const generation = index === 0 ? null : index
    this.setData({
      generationIndex: index,
      'filters.generation': generation,
    })
    if (this.data.keyword || this.data.hasSearched) {
      this.onSearch()
    }
  },

  // 性别筛选
  onGenderChange(e) {
    const index = parseInt(e.detail.value, 10)
    const genderMap = { 0: null, 1: 'male', 2: 'female' }
    this.setData({
      genderIndex: index,
      'filters.gender': genderMap[index],
    })
    if (this.data.keyword || this.data.hasSearched) {
      this.onSearch()
    }
  },

  // 跳转到详情
  goToDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/member/detail?id=${id}`,
    })
  },
})
