// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

// 用户相关操作
exports.main = async (event, context) => {
  const { action, data } = event
  const { OPENID } = cloud.getWXContext()

  try {
    switch (action) {
      case 'checkStatus':
        return await checkUserStatus(OPENID)
      case 'login':
        return await userLogin(OPENID, data)
      case 'updateProfile':
        return await updateProfile(OPENID, data)
      default:
        return { code: -1, message: '未知操作' }
    }
  } catch (error) {
    console.error(error)
    return { code: -1, message: error.message }
  }
}

// 检查用户状态
async function checkUserStatus(openid) {
  const userRes = await db.collection('users').where({
    _openid: openid
  }).get()

  if (userRes.data.length === 0) {
    return {
      isLoggedIn: false,
      isRegistered: false
    }
  }

  const user = userRes.data[0]
  
  // 检查是否已登记成员信息
  const memberRes = await db.collection('members').where({
    userId: user._id
  }).get()

  return {
    isLoggedIn: true,
    isRegistered: memberRes.data.length > 0,
    userInfo: user,
    memberInfo: memberRes.data[0] || null
  }
}

// 用户登录
async function userLogin(openid, data) {
  const { avatarUrl, nickName } = data

  const userRes = await db.collection('users').where({
    _openid: openid
  }).get()

  if (userRes.data.length > 0) {
    // 更新用户信息
    await db.collection('users').doc(userRes.data[0]._id).update({
      data: {
        avatarUrl,
        nickName,
        lastLoginAt: db.serverDate()
      }
    })
    return { code: 0, message: '登录成功', userId: userRes.data[0]._id }
  } else {
    // 创建新用户
    const newUser = await db.collection('users').add({
      data: {
        _openid: openid,
        avatarUrl,
        nickName,
        createdAt: db.serverDate(),
        lastLoginAt: db.serverDate()
      }
    })
    return { code: 0, message: '注册成功', userId: newUser._id }
  }
}

// 更新用户资料
async function updateProfile(openid, data) {
  const userRes = await db.collection('users').where({
    _openid: openid
  }).get()

  if (userRes.data.length === 0) {
    return { code: -1, message: '用户不存在' }
  }

  await db.collection('users').doc(userRes.data[0]._id).update({
    data: {
      ...data,
      updatedAt: db.serverDate()
    }
  })

  return { code: 0, message: '更新成功' }
}
