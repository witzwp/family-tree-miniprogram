// pages/family/tree.js
const exportUtil = require('../../utils/export-util.js')

const app = getApp()

Page({
  data: {
    viewMode: 'tree', // tree, mindmap, list
    treeData: null,
    generationList: [],
    stats: {},
    myGeneration: null,
    isExporting: false,
    currentFamilyId: null,
    familyName: '',
    hasFamily: false,
  },

  onLoad() {
    this.setData({
      currentFamilyId: app.globalData.currentFamilyId,
    })
    this.loadFamilyData()
  },

  onShow() {
    const familyId = app.globalData.currentFamilyId
    if (familyId !== this.data.currentFamilyId) {
      this.setData({ currentFamilyId: familyId })
      this.loadFamilyData()
      return
    }
    this.loadFamilyData()
  },

  /**
   * Loads family data including stats, tree, and member list.
   */
  loadFamilyData() {
    const familyId = app.globalData.currentFamilyId
    if (!familyId) {
      this.setData({
        hasFamily: false,
        familyName: '',
        treeData: null,
        generationList: [],
        stats: {},
      })
      return
    }

    this.setData({
      hasFamily: true,
      currentFamilyId: familyId,
      familyName: app.globalData.familyInfo?.name || '',
    })

    // 获取统计
    wx.cloud.callFunction({
      name: 'member',
      data: {
        action: 'getStats',
        data: { familyId },
      },
    }).then((res) => {
      if (res.result.code === 0) {
        const stats = res.result.data
        this.setData({
          stats: {
            totalCount: stats.totalCount,
            generationCount: Object.keys(stats.generationCount).length,
          },
        })
      }
    })

    // 获取家谱树
    wx.cloud.callFunction({
      name: 'member',
      data: {
        action: 'getTree',
        data: { familyId, rootId: null, depth: 5 },
      },
    }).then((res) => {
      if (res.result.code === 0) {
        this.setData({ treeData: res.result.data })
      }
    })

    // 获取列表数据
    this.loadMemberList()

    // 获取我的信息
    if (app.globalData.memberInfo) {
      this.setData({ myGeneration: app.globalData.memberInfo.generation })
    }
  },

  /**
   * Loads member list grouped by generation.
   */
  loadMemberList() {
    const familyId = app.globalData.currentFamilyId
    if (!familyId) return

    wx.cloud.callFunction({
      name: 'member',
      data: {
        action: 'search',
        data: { familyId },
      },
    }).then((res) => {
      if (res.result.code === 0) {
        const members = res.result.data
        // 按辈分分组
        const generationMap = {}
        members.forEach((m) => {
          const gen = m.generation || 1
          if (!generationMap[gen]) {
            generationMap[gen] = []
          }
          generationMap[gen].push(m)
        })

        const generationList = Object.keys(generationMap)
          .sort((a, b) => a - b)
          .map((gen) => ({
            generation: gen,
            members: generationMap[gen],
          }))

        this.setData({ generationList })
      }
    })
  },

  // 切换视图
  switchView(e) {
    const { mode } = e.currentTarget.dataset
    if (mode === 'stats') {
      wx.navigateTo({
        url: '/pages/statistics/index',
      })
      return
    }
    if (mode === 'timeline') {
      wx.navigateTo({
        url: '/pages/family/timeline',
      })
      return
    }
    this.setData({ viewMode: mode })
  },

  // 点击节点
  onNodeTap(e) {
    const { id } = e.detail
    wx.navigateTo({
      url: `/pages/member/detail?id=${id}`,
    })
  },

  // 跳转到搜索
  goToSearch() {
    wx.navigateTo({
      url: '/pages/search/index',
    })
  },

  // 跳转到添加成员
  goToAddMember() {
    wx.navigateTo({
      url: '/pages/member/add',
    })
  },

  // 跳转到成员详情
  goToMemberDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/member/detail?id=${id}`,
    })
  },

  // 跳转到家族选择
  goToSelectFamily() {
    wx.navigateTo({
      url: '/pages/family/select',
    })
  },

  // 导出家谱图片
  async exportTreeImage() {
    if (this.data.isExporting) return
    if (!this.data.treeData) {
      wx.showToast({
        title: '暂无家谱数据',
        icon: 'none',
      })
      return
    }

    this.setData({ isExporting: true })

    try {
      const familyName = app.globalData.familyInfo?.name || ''
      const result = await exportUtil.exportFamilyTree(
        this.data.treeData,
        familyName,
      )
      if (!result.success) {
        console.error('Export failed:', result.error)
      }
    } catch (err) {
      console.error('Export error:', err)
      wx.showToast({
        title: '导出失败',
        icon: 'none',
      })
    } finally {
      this.setData({ isExporting: false })
    }
  },
})
