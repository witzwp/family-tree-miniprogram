// pages/member/edit.js
Page({
  data: {
    memberId: null,
    avatar: '',
    name: '',
    gender: '',
    birthDate: '',
    birthplace: '',
    currentLocation: '',
    phone: '',
    bio: ''
  },

  onLoad(options) {
    const { id } = options
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      wx.navigateBack()
      return
    }

    this.setData({ memberId: id })
    this.loadMemberData(id)
  },

  // 加载成员数据
  loadMemberData(id) {
    wx.cloud.callFunction({
      name: 'member',
      data: {
        action: 'get',
        data: { id }
      }
    }).then(res => {
      if (res.result.code === 0) {
        const member = res.result.data
        this.setData({
          avatar: member.avatar || '',
          name: member.name || '',
          gender: member.gender || '',
          birthDate: member.birthDate || '',
          birthplace: member.birthplace || '',
          currentLocation: member.currentLocation || '',
          phone: member.phone || '',
          bio: member.bio || ''
        })
      }
    })
  },

  onChooseAvatar(e) {
    this.setData({ avatar: e.detail.avatarUrl })
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onGenderSelect(e) {
    this.setData({ gender: e.currentTarget.dataset.gender })
  },

  onBirthDateChange(e) {
    this.setData({ birthDate: e.detail.value })
  },

  onBirthplaceInput(e) {
    this.setData({ birthplace: e.detail.value })
  },

  onLocationInput(e) {
    this.setData({ currentLocation: e.detail.value })
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  onBioInput(e) {
    this.setData({ bio: e.detail.value })
  },

  save() {
    const { memberId, name, gender } = this.data

    if (!name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }

    if (!gender) {
      wx.showToast({ title: '请选择性别', icon: 'none' })
      return
    }

    const updateData = {
      id: memberId,
      avatar: this.data.avatar,
      name: name.trim(),
      gender,
      birthDate: this.data.birthDate,
      birthplace: this.data.birthplace,
      currentLocation: this.data.currentLocation,
      phone: this.data.phone,
      bio: this.data.bio
    }

    wx.showLoading({ title: '保存中...' })

    wx.cloud.callFunction({
      name: 'member',
      data: {
        action: 'update',
        data: updateData
      }
    }).then(res => {
      wx.hideLoading()

      if (res.result.code === 0) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('保存失败:', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  },

  cancel() {
    wx.navigateBack()
  }
})
