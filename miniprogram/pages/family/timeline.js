// pages/family/timeline.js

const app = getApp()

const YEAR_STEP = 10
const MIN_YEAR_RANGE = 80
const PIXELS_PER_YEAR = 12
const GENDER_COLORS = {
  male: '#3b82f6',
  female: '#ec4899',
  unknown: '#9ca3af',
}

Page({
  data: {
    members: [],
    timelineGroups: [],
    yearRange: { start: 0, end: 0 },
    axisYears: [],
    loading: true,
    error: null,
    currentFamilyId: null,
    scale: 1,
    containerWidth: 0,
  },

  onLoad() {
    this.setData({
      currentFamilyId: app.globalData.currentFamilyId,
    })
    this.loadTimelineData()
  },

  onShow() {
    const familyId = app.globalData.currentFamilyId
    if (familyId !== this.data.currentFamilyId) {
      this.setData({ currentFamilyId: familyId })
      this.loadTimelineData()
    }
  },

  /**
   * Loads all family members and builds timeline data.
   */
  loadTimelineData() {
    const familyId = app.globalData.currentFamilyId
    if (!familyId) {
      this.setData({
        error: '请先选择家族',
        loading: false,
        members: [],
        timelineGroups: [],
      })
      return
    }

    this.setData({ loading: true, error: null })

    wx.cloud.callFunction({
      name: 'member',
      data: {
        action: 'search',
        data: { familyId },
      },
    }).then((res) => {
      if (res.result.code === 0) {
        const members = this.processMembers(res.result.data || [])
        const yearRange = this.calculateYearRange(members)
        const axisYears = this.buildAxisYears(yearRange)
        const timelineGroups = this.buildTimelineGroups(members, yearRange)
        const containerWidth = this.calculateContainerWidth(yearRange)

        this.setData({
          members,
          yearRange,
          axisYears,
          timelineGroups,
          containerWidth,
          loading: false,
        })
      } else {
        this.setData({
          error: res.result.message || '加载失败',
          loading: false,
        })
      }
    }).catch((err) => {
      console.error('loadTimelineData error', err)
      this.setData({
        error: '网络错误，请重试',
        loading: false,
      })
    })
  },

  /**
   * Processes raw member data: parses dates, calculates ages, sorts by birth year.
   * @param {!Array<!Object>} rawMembers - Raw member objects from cloud.
   * @return {!Array<!Object>} Processed members with computed fields.
   */
  processMembers(rawMembers) {
    const currentYear = new Date().getFullYear()

    return rawMembers
      .map((m) => {
        const birthYear = this.parseYear(m.birthDate)
        const deathYear = this.parseYear(m.deathDate)
        const endYear = deathYear || currentYear
        const age = birthYear ? endYear - birthYear : null

        return {
          ...m,
          birthYear,
          deathYear,
          endYear,
          age,
          displayName: m.name || '未知',
          genderColor: GENDER_COLORS[m.gender] || GENDER_COLORS.unknown,
        }
      })
      .filter((m) => m.birthYear !== null)
      .sort((a, b) => a.birthYear - b.birthYear)
  },

  /**
   * Parses a date string to extract the year.
   * @param {string} dateStr - Date string in various formats.
   * @return {number|null} The year or null if unparseable.
   */
  parseYear(dateStr) {
    if (!dateStr) return null
    const match = String(dateStr).match(/(\d{4})/)
    return match ? parseInt(match[1], 10) : null
  },

  /**
   * Calculates the global year range covering all members.
   * @param {!Array<!Object>} members - Processed members.
   * @return {!Object} Object with start and end years.
   */
  calculateYearRange(members) {
    if (members.length === 0) {
      const currentYear = new Date().getFullYear()
      return { start: currentYear - MIN_YEAR_RANGE, end: currentYear }
    }

    const birthYears = members.map((m) => m.birthYear)
    const deathYears = members
      .map((m) => m.deathYear)
      .filter((y) => y !== null)

    let start = Math.min(...birthYears)
    let end = deathYears.length > 0
      ? Math.max(...deathYears)
      : new Date().getFullYear()

    const range = end - start
    if (range < MIN_YEAR_RANGE) {
      const padding = Math.ceil((MIN_YEAR_RANGE - range) / 2)
      start -= padding
      end += padding
    }

    start = Math.floor(start / YEAR_STEP) * YEAR_STEP
    end = Math.ceil((end + 1) / YEAR_STEP) * YEAR_STEP

    return { start, end }
  },

  /**
   * Builds the year markers for the timeline axis.
   * @param {!Object} yearRange - The year range.
   * @return {!Array<number>} Array of year numbers.
   */
  buildAxisYears(yearRange) {
    const years = []
    for (let y = yearRange.start; y <= yearRange.end; y += YEAR_STEP) {
      years.push(y)
    }
    return years
  },

  /**
   * Calculates the scrollable container width in pixels.
   * @param {!Object} yearRange - The year range.
   * @return {number} Width in rpx (approximated).
   */
  calculateContainerWidth(yearRange) {
    const yearCount = yearRange.end - yearRange.start
    return yearCount * PIXELS_PER_YEAR * 2
  },

  /**
   * Groups members by generation and computes bar positions.
   * @param {!Array<!Object>} members - Processed members.
   * @param {!Object} yearRange - The year range.
   * @return {!Array<!Object>} Timeline groups.
   */
  buildTimelineGroups(members, yearRange) {
    const generationMap = {}
    members.forEach((m) => {
      const gen = m.generation || 1
      if (!generationMap[gen]) {
        generationMap[gen] = []
      }
      generationMap[gen].push(m)
    })

    return Object.keys(generationMap)
      .map(Number)
      .sort((a, b) => a - b)
      .map((gen) => {
        const groupMembers = generationMap[gen].map((m) => ({
          ...m,
          barLeft: this.yearToPosition(m.birthYear, yearRange),
          barWidth: this.yearToPosition(m.endYear, yearRange)
            - this.yearToPosition(m.birthYear, yearRange),
        }))

        return {
          generation: gen,
          members: groupMembers,
          eraLabel: this.getEraLabel(gen),
        }
      })
  },

  /**
   * Converts a year to a horizontal position in the timeline.
   * @param {number} year - The year.
   * @param {!Object} yearRange - The year range.
   * @return {number} Position in rpx.
   */
  yearToPosition(year, yearRange) {
    const offset = year - yearRange.start
    return offset * PIXELS_PER_YEAR * 2
  },

  /**
   * Returns a descriptive label for a generation.
   * @param {number} generation - Generation number.
   * @return {string} Label string.
   */
  getEraLabel(generation) {
    if (generation <= 2) return '祖辈'
    if (generation <= 4) return '父辈'
    if (generation <= 6) return '同辈'
    return '晚辈'
  },

  /**
   * Handles tap on a member bar to navigate to detail page.
   * @param {!Object} e - Tap event.
   */
  onMemberTap(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    wx.navigateTo({
      url: `/pages/member/detail?id=${id}`,
    })
  },

  /**
   * Handles zoom in button.
   */
  onZoomIn() {
    const newScale = Math.min(this.data.scale + 0.2, 2.0)
    this.setData({ scale: newScale })
  },

  /**
   * Handles zoom out button.
   */
  onZoomOut() {
    const newScale = Math.max(this.data.scale - 0.2, 0.5)
    this.setData({ scale: newScale })
  },

  /**
   * Handles pull-to-refresh.
   */
  onPullDownRefresh() {
    this.loadTimelineData()
    wx.stopPullDownRefresh()
  },
})
