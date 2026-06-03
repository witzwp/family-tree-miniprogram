// pages/family/tree.js
Page({
  data: {
    viewMode: 'tree', // tree, mindmap, list
    treeData: null,
    generationList: [],
    stats: {},
    myGeneration: null
  },

  onLoad() {
    this.loadFamilyData()
  },

  onShow() {
    this.loadFamilyData()
  },

  // 加载家族数据
  loadFamilyData() {
    // 获取统计
    wx.cloud.callFunction({
      name: 'member',
      data: { action: 'getStats' }
    }).then(res => {
      if (res.result.code === 0) {
        const stats = res.result.data
        this.setData({
          stats: {
            totalCount: stats.totalCount,
            generationCount: Object.keys(stats.generationCount).length
          }
        })
      }
    })

    // 获取家谱树
    wx.cloud.callFunction({
      name: 'member',
      data: { action: 'getTree', data: { rootId: null, depth: 5 } }
    }).then(res => {
      if (res.result.code === 0) {
        this.setData({ treeData: res.result.data })
      }
    })

    // 获取列表数据
    this.loadMemberList()

    // 获取我的信息
    const app = getApp()
    if (app.globalData.memberInfo) {
      this.setData({ myGeneration: app.globalData.memberInfo.generation })
    }
  },

  // 加载成员列表
  loadMemberList() {
    wx.cloud.callFunction({
      name: 'member',
      data: { action: 'search', data: {} }
    }).then(res => {
      if (res.result.code === 0) {
        const members = res.result.data
        // 按辈分分组
        const generationMap = {}
        members.forEach(m => {
          const gen = m.generation || 1
          if (!generationMap[gen]) {
            generationMap[gen] = []
          }
          generationMap[gen].push(m)
        })

        const generationList = Object.keys(generationMap)
          .sort((a, b) => a - b)
          .map(gen => ({
            generation: gen,
            members: generationMap[gen]
          }))

        this.setData({ generationList })
      }
    })
  },

  // 切换视图
  switchView(e) {
    const { mode } = e.currentTarget.dataset
    this.setData({ viewMode: mode })
  },

  // 点击节点
  onNodeTap(e) {
    const { id } = e.detail
    wx.navigateTo({
      url: `/pages/member/detail?id=${id}`
    })
  },

  // 跳转到搜索
  goToSearch() {
    wx.navigateTo({
      url: '/pages/search/index'
    })
  },

  // 跳转到添加成员
  goToAddMember() {
    wx.navigateTo({
      url: '/pages/member/add'
    })
  },

  // 跳转到成员详情
  goToMemberDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/member/detail?id=${id}`
    })
  }
})
