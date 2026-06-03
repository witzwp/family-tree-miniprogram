// pages/statistics/index.js

const app = getApp()

const CHART_COLORS = [
  '#8B4513',
  '#CD853F',
  '#DEB887',
  '#D2691E',
  '#A0522D',
  '#BC8F8F',
  '#F4A460',
  '#DAA520',
]

Page({
  data: {
    stats: null,
    loading: true,
    error: null,
    currentFamilyId: null,
  },

  onLoad() {
    this.setData({
      currentFamilyId: app.globalData.currentFamilyId,
    })
    this.loadStatistics()
  },

  onShow() {
    const familyId = app.globalData.currentFamilyId
    if (familyId !== this.data.currentFamilyId) {
      this.setData({ currentFamilyId: familyId })
      this.loadStatistics()
    }
  },

  onReady() {
    this.drawCharts()
  },

  /**
   * Fetches family statistics from cloud function.
   */
  loadStatistics() {
    const familyId = app.globalData.currentFamilyId
    if (!familyId) {
      this.setData({
        error: '请先选择家族',
        loading: false,
        stats: null,
      })
      return
    }

    this.setData({ loading: true, error: null })
    wx.cloud.callFunction({
      name: 'member',
      data: {
        action: 'getStats',
        data: { familyId },
      },
    }).then((res) => {
      if (res.result.code === 0) {
        this.setData({
          stats: res.result.data,
          loading: false,
        })
        this.drawCharts()
      } else {
        this.setData({
          error: res.result.message || '加载失败',
          loading: false,
        })
      }
    }).catch((err) => {
      console.error('loadStatistics error', err)
      this.setData({
        error: '网络错误，请重试',
        loading: false,
      })
    })
  },

  /**
   * Draws all canvas charts after data is loaded.
   */
  drawCharts() {
    const stats = this.data.stats
    if (!stats) return

    this.drawGenderPie(stats.genderCount, stats.totalCount)
    this.drawAgeBar(stats.ageDistribution)
    this.drawGenerationBar(stats.generationCount)
  },

  /**
   * Draws a pie chart for gender ratio.
   * @param {!Object} genderCount - Gender counts.
   * @param {number} totalCount - Total member count.
   */
  drawGenderPie(genderCount, totalCount) {
    const query = wx.createSelectorQuery().in(this)
    query.select('#genderChart').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0]) return
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = wx.getSystemInfoSync().pixelRatio
      const width = res[0].width
      const height = res[0].height
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)

      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) / 2 - 16

      const data = [
        { label: '男', value: genderCount.male || 0, color: '#8B4513' },
        { label: '女', value: genderCount.female || 0, color: '#CD853F' },
        { label: '未知', value: (genderCount.unknown || 0), color: '#DEB887' },
      ]

      let startAngle = -Math.PI / 2
      data.forEach((item) => {
        if (item.value <= 0) return
        const sliceAngle = (item.value / totalCount) * 2 * Math.PI
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
        ctx.closePath()
        ctx.fillStyle = item.color
        ctx.fill()

        // Draw label
        const midAngle = startAngle + sliceAngle / 2
        const labelRadius = radius * 0.65
        const labelX = centerX + Math.cos(midAngle) * labelRadius
        const labelY = centerY + Math.sin(midAngle) * labelRadius
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 12px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const percent = totalCount > 0
          ? Math.round((item.value / totalCount) * 100) + '%'
          : '0%'
        ctx.fillText(percent, labelX, labelY)

        startAngle += sliceAngle
      })

      // Draw legend
      const legendX = 8
      let legendY = 8
      data.forEach((item) => {
        if (item.value <= 0) return
        ctx.fillStyle = item.color
        ctx.fillRect(legendX, legendY, 10, 10)
        ctx.fillStyle = '#333333'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(`${item.label} ${item.value}`, legendX + 14, legendY)
        legendY += 16
      })
    })
  },

  /**
   * Draws a bar chart for age distribution.
   * @param {!Object} ageDistribution - Age group counts.
   */
  drawAgeBar(ageDistribution) {
    const query = wx.createSelectorQuery().in(this)
    query.select('#ageChart').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0]) return
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = wx.getSystemInfoSync().pixelRatio
      const width = res[0].width
      const height = res[0].height
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)

      const labels = ['0-18', '19-30', '31-45', '46-60', '61-80', '80+']
      const data = labels.map((k) => (ageDistribution && ageDistribution[k]) || 0)
      const maxValue = Math.max(...data, 1)

      const padding = { top: 20, right: 8, bottom: 24, left: 32 }
      const chartWidth = width - padding.left - padding.right
      const chartHeight = height - padding.top - padding.bottom
      const barWidth = chartWidth / data.length * 0.6
      const barSpacing = chartWidth / data.length

      // Draw axes
      ctx.strokeStyle = '#cccccc'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padding.left, padding.top)
      ctx.lineTo(padding.left, height - padding.bottom)
      ctx.lineTo(width - padding.right, height - padding.bottom)
      ctx.stroke()

      // Draw bars
      data.forEach((value, index) => {
        const barHeight = (value / maxValue) * chartHeight
        const x = padding.left + index * barSpacing + (barSpacing - barWidth) / 2
        const y = height - padding.bottom - barHeight

        ctx.fillStyle = CHART_COLORS[index % CHART_COLORS.length]
        ctx.fillRect(x, y, barWidth, barHeight)

        // Value label
        if (value > 0) {
          ctx.fillStyle = '#333333'
          ctx.font = '10px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(String(value), x + barWidth / 2, y - 4)
        }

        // X-axis label
        ctx.fillStyle = '#666666'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(labels[index], x + barWidth / 2, height - padding.bottom + 12)
      })

      // Y-axis label
      ctx.fillStyle = '#999999'
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(maxValue), padding.left - 4, padding.top)
      ctx.fillText('0', padding.left - 4, height - padding.bottom)
    })
  },

  /**
   * Draws a bar chart for generation distribution.
   * @param {!Object} generationCount - Generation counts.
   */
  drawGenerationBar(generationCount) {
    const query = wx.createSelectorQuery().in(this)
    query.select('#generationChart').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0]) return
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = wx.getSystemInfoSync().pixelRatio
      const width = res[0].width
      const height = res[0].height
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)

      const generations = Object.keys(generationCount || {})
        .map(Number)
        .sort((a, b) => a - b)
      const data = generations.map((g) => generationCount[g])
      const maxValue = Math.max(...data, 1)

      const padding = { top: 20, right: 8, bottom: 24, left: 32 }
      const chartWidth = width - padding.left - padding.right
      const chartHeight = height - padding.top - padding.bottom
      const barWidth = generations.length > 0
        ? chartWidth / generations.length * 0.6
        : 0
      const barSpacing = generations.length > 0 ? chartWidth / generations.length : 0

      // Draw axes
      ctx.strokeStyle = '#cccccc'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padding.left, padding.top)
      ctx.lineTo(padding.left, height - padding.bottom)
      ctx.lineTo(width - padding.right, height - padding.bottom)
      ctx.stroke()

      // Draw bars
      data.forEach((value, index) => {
        const barHeight = (value / maxValue) * chartHeight
        const x = padding.left + index * barSpacing + (barSpacing - barWidth) / 2
        const y = height - padding.bottom - barHeight

        ctx.fillStyle = CHART_COLORS[index % CHART_COLORS.length]
        ctx.fillRect(x, y, barWidth, barHeight)

        // Value label
        if (value > 0) {
          ctx.fillStyle = '#333333'
          ctx.font = '10px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(String(value), x + barWidth / 2, y - 4)
        }

        // X-axis label
        ctx.fillStyle = '#666666'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`第${generations[index]}代`, x + barWidth / 2,
          height - padding.bottom + 12)
      })

      // Y-axis label
      ctx.fillStyle = '#999999'
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(maxValue), padding.left - 4, padding.top)
      ctx.fillText('0', padding.left - 4, height - padding.bottom)
    })
  },

  /**
   * Handles pull-to-refresh to reload statistics.
   */
  onPullDownRefresh() {
    this.loadStatistics()
    wx.stopPullDownRefresh()
  },
})
