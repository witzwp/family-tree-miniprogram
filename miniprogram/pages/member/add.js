// pages/member/add.js
const app = getApp()

Page({
  data: {
    name: '',
    gender: '',
    birthDate: '',
    birthplace: '',
    bio: '',
    relationIndex: 0,
    relationOptions: ['请选择', '父亲', '母亲', '配偶', '子女', '兄弟姐妹', '其他'],
    relationMap: {
      1: 'father',
      2: 'mother',
      3: 'spouse',
      4: 'children',
      5: 'sibling',
      6: 'other'
    },
    canSubmit: false
  },

  onLoad() {
    this.checkFormValid()
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
    this.checkFormValid()
  },

  onGenderSelect(e) {
    this.setData({ gender: e.currentTarget.dataset.gender })
    this.checkFormValid()
  },

  onBirthDateChange(e) {
    this.setData({ birthDate: e.detail.value })
  },

  onBirthplaceInput(e) {
    this.setData({ birthplace: e.detail.value })
  },

  onRelationChange(e) {
    this.setData({ relationIndex: parseInt(e.detail.value) })
  },

  onBioInput(e) {
    this.setData({ bio: e.detail.value })
  },

  checkFormValid() {
    const { name, gender } = this.data
    const canSubmit = name.trim() && gender
    this.setData({ canSubmit })
  },

  addMember() {
    if (!this.data.canSubmit) return

    const familyId = app.globalData.currentFamilyId
    if (!familyId) {
      wx.showToast({ title: '请先选择家族', icon: 'none' })
      return
    }

    const { name, gender, birthDate, birthplace, bio, relationIndex } = this.data

    // 构建成员数据
    const memberData = {
      familyId,
      name: name.trim(),
      gender,
      birthDate,
      birthplace,
      bio,
      // 根据关系自动设置父母ID
      fatherId: null,
      motherId: null,
      spouseId: null
    }

    // 如果选择了关系，关联到当前用户
    if (relationIndex > 0) {
      const myId = app.globalData.memberInfo?._id

      if (myId) {
        const relationType = this.data.relationMap[relationIndex]

        switch (relationType) {
          case 'father':
            memberData.childrenIds = [myId]
            break
          case 'mother':
            memberData.childrenIds = [myId]
            break
          case 'spouse':
            memberData.spouseId = myId
            break
          case 'children':
            // 根据当前用户性别判断是父母哪一方
            const myGender = app.globalData.memberInfo?.gender
            if (myGender === 'male') {
              memberData.fatherId = myId
            } else {
              memberData.motherId = myId
            }
            break
        }
      }
    }

    wx.showLoading({ title: '添加中...' })

    wx.cloud.callFunction({
      name: 'member',
      data: {
        action: 'create',
        data: memberData
      }
    }).then(res => {
      wx.hideLoading()

      if (res.result.code === 0) {
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        })

        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('添加失败:', err)
      wx.showToast({ title: '添加失败', icon: 'none' })
    })
  },

  cancel() {
    wx.navigateBack()
  }
})
