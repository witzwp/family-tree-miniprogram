// 家族相关云函数
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

/**
 * Main entry for family cloud function.
 * @param {!Object} event - Cloud function event.
 * @param {!Object} context - Cloud function context.
 * @return {!Object} Response object.
 */
exports.main = async (event, context) => {
  const { action, data } = event
  const { OPENID } = cloud.getWXContext()

  try {
    switch (action) {
      case 'getFamilies':
        return await getFamilies(OPENID)
      case 'createFamily':
        return await createFamily(OPENID, data)
      case 'getFamilyDetail':
        return await getFamilyDetail(data.familyId)
      case 'joinFamily':
        return await joinFamily(OPENID, data.familyId)
      case 'leaveFamily':
        return await leaveFamily(OPENID, data.familyId)
      default:
        return { code: -1, message: '未知操作' }
    }
  } catch (error) {
    console.error(error)
    return { code: -1, message: error.message }
  }
}

/**
 * Gets all families the user belongs to.
 * @param {string} openid - User openid.
 * @return {!Object} List of families with member counts.
 */
async function getFamilies(openid) {
  const userRes = await db.collection('users').where({ _openid: openid }).get()
  if (userRes.data.length === 0) {
    return { code: -1, message: '用户未登录', data: [] }
  }
  const user = userRes.data[0]

  // Find family memberships for this user
  const memberRes = await db.collection('familyMembers')
    .where({ userId: user._id })
    .get()

  const familyIds = memberRes.data.map((m) => m.familyId)
  if (familyIds.length === 0) {
    return { code: 0, data: [] }
  }

  // Get family details
  const familiesRes = await db.collection('families')
    .where({ _id: _.in(familyIds) })
    .get()

  // Count members per family
  const families = await Promise.all(
    familiesRes.data.map(async (family) => {
      const countRes = await db.collection('members')
        .where({ familyId: family._id })
        .count()
      return {
        ...family,
        memberCount: countRes.total,
      }
    })
  )

  return { code: 0, data: families }
}

/**
 * Creates a new family and adds the creator as admin.
 * @param {string} openid - User openid.
 * @param {!Object} data - Family data.
 * @return {!Object} Created family result.
 */
async function createFamily(openid, data) {
  const userRes = await db.collection('users').where({ _openid: openid }).get()
  if (userRes.data.length === 0) {
    return { code: -1, message: '用户未登录' }
  }
  const user = userRes.data[0]

  const { name, description = '' } = data || {}
  if (!name || !name.trim()) {
    return { code: -1, message: '请输入家族名称' }
  }

  // Create family
  const familyRes = await db.collection('families').add({
    data: {
      name: name.trim(),
      description: description.trim(),
      createdBy: user._id,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate(),
    },
  })

  const familyId = familyRes._id

  // Add creator as admin member
  await db.collection('familyMembers').add({
    data: {
      familyId,
      userId: user._id,
      role: 'admin',
      joinedAt: db.serverDate(),
    },
  })

  return {
    code: 0,
    message: '创建成功',
    data: { familyId, name: name.trim() },
  }
}

/**
 * Gets family detail with creator info.
 * @param {string} familyId - Family ID.
 * @return {!Object} Family detail.
 */
async function getFamilyDetail(familyId) {
  if (!familyId) {
    return { code: -1, message: '家族ID不能为空' }
  }

  const familyRes = await db.collection('families').doc(familyId).get()
  if (!familyRes.data) {
    return { code: -1, message: '家族不存在' }
  }

  const family = familyRes.data

  // Get creator info
  let creatorName = ''
  if (family.createdBy) {
    const creatorRes = await db.collection('users').doc(family.createdBy).get()
    if (creatorRes.data) {
      creatorName = creatorRes.data.nickName || ''
    }
  }

  // Count members
  const countRes = await db.collection('members')
    .where({ familyId })
    .count()

  return {
    code: 0,
    data: {
      ...family,
      creatorName,
      memberCount: countRes.total,
    },
  }
}

/**
 * Joins a family by ID.
 * @param {string} openid - User openid.
 * @param {string} familyId - Family ID to join.
 * @return {!Object} Join result.
 */
async function joinFamily(openid, familyId) {
  if (!familyId) {
    return { code: -1, message: '家族ID不能为空' }
  }

  const userRes = await db.collection('users').where({ _openid: openid }).get()
  if (userRes.data.length === 0) {
    return { code: -1, message: '用户未登录' }
  }
  const user = userRes.data[0]

  // Check if already a member
  const existingRes = await db.collection('familyMembers')
    .where({ familyId, userId: user._id })
    .get()

  if (existingRes.data.length > 0) {
    return { code: -1, message: '您已经是该家族成员' }
  }

  await db.collection('familyMembers').add({
    data: {
      familyId,
      userId: user._id,
      role: 'member',
      joinedAt: db.serverDate(),
    },
  })

  return { code: 0, message: '加入成功' }
}

/**
 * Leaves a family.
 * @param {string} openid - User openid.
 * @param {string} familyId - Family ID to leave.
 * @return {!Object} Leave result.
 */
async function leaveFamily(openid, familyId) {
  if (!familyId) {
    return { code: -1, message: '家族ID不能为空' }
  }

  const userRes = await db.collection('users').where({ _openid: openid }).get()
  if (userRes.data.length === 0) {
    return { code: -1, message: '用户未登录' }
  }
  const user = userRes.data[0]

  const memberRes = await db.collection('familyMembers')
    .where({ familyId, userId: user._id })
    .get()

  if (memberRes.data.length === 0) {
    return { code: -1, message: '您不是该家族成员' }
  }

  await db.collection('familyMembers').doc(memberRes.data[0]._id).remove()
  return { code: 0, message: '已退出家族' }
}
