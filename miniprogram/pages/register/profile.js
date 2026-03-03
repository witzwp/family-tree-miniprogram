// pages/register/profile.js
Page({
  data: {
    avatarUrl: '',
    name: '',
    gender: '',
    birthDate: '',
    birthplace: '',
    currentLocation: '',
    phone: '',
    bio: '',
    canSubmit: false
  },

  onLoad() {
    this.checkFormValid()
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({ avatarUrl })
    this.checkFormValid()
  },

  // 姓名输入
  onNameInput(e) {
    this.setData({ name: e.detail.value })
    this.checkFormValid()
  },

  // 性别选择
  onGenderSelect(e) {
    const { gender } = e.currentTarget.dataset
    this.setData({ gender })
    this.checkFormValid()
  },

  // 出生日期
  onBirthDateChange(e) {
    this.setData({ birthDate: e.detail.value })
  },

  // 籍贯
  onBirthplaceInput(e) {
    this.setData({ birthplace: e.detail.value })
  },

  // 现居地
  onLocationInput(e) {
    this.setData({ currentLocation: e.detail.value })
  },

  // 电话
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  // 简介
  onBioInput(e) {
    this.setData({ bio: e.detail.value })
  },

  // 检查表单有效性
  checkFormValid() {
    const { name, gender } = this.data
    const canSubmit = name.trim() && gender
    this.setData({ canSubmit })
  },

  // 下一步
  nextStep() {
    if (!this.data.canSubmit) return

    // 保存到本地，进入关系登记页
    const profileData = {
      avatar: this.data.avatarUrl,
      name: this.data.name,
      gender: this.data.gender,
      birthDate: this.data.birthDate,
      birthplace: this.data.birthplace,
      currentLocation: this.data.currentLocation,
      phone: this.data.phone,
      bio: this.data.bio
    }

    wx.setStorageSync('profileData', profileData)

    wx.navigateTo({
      url: '/pages/register/relations'
    })
  }
})
