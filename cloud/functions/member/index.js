// 成员相关云函数
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data } = event
  const { OPENID } = cloud.getWXContext()

  try {
    switch (action) {
      case 'create':
        return await createMember(OPENID, data)
      case 'get':
        return await getMember(data.id)
      case 'update':
        return await updateMember(OPENID, data)
      case 'delete':
        return await deleteMember(OPENID, data.id)
      case 'getTree':
        return await getFamilyTree(data.rootId, data.depth)
      case 'search':
        return await searchMembers(data.keyword, data.filters)
      case 'getStats':
        return await getFamilyStats()
      default:
        return { code: -1, message: '未知操作' }
    }
  } catch (error) {
    console.error(error)
    return { code: -1, message: error.message }
  }
}

// 创建成员
async function createMember(openid, data) {
  // 获取当前用户
  const userRes = await db.collection('users').where({ _openid: openid }).get()
  if (userRes.data.length === 0) {
    return { code: -1, message: '用户未登录' }
  }
  const user = userRes.data[0]

  // 计算辈分
  let generation = 1
  if (data.fatherId || data.motherId) {
    const parentId = data.fatherId || data.motherId
    const parentRes = await db.collection('members').doc(parentId).get()
    if (parentRes.data) {
      generation = (parentRes.data.generation || 1) + 1
    }
  }

  const memberData = {
    ...data,
    userId: user._id,
    generation,
    createdBy: user._id,
    createdAt: db.serverDate(),
    updatedAt: db.serverDate()
  }

  const res = await db.collection('members').add({ data: memberData })
  return { code: 0, message: '创建成功', data: { id: res._id } }
}

// 获取成员详情
async function getMember(id) {
  const res = await db.collection('members').doc(id).get()
  
  if (!res.data) {
    return { code: -1, message: '成员不存在' }
  }

  // 获取关联成员信息
  const member = res.data
  const relations = {}
  
  if (member.fatherId) {
    const father = await db.collection('members').doc(member.fatherId).get()
    relations.father = father.data
  }
  if (member.motherId) {
    const mother = await db.collection('members').doc(member.motherId).get()
    relations.mother = mother.data
  }
  if (member.spouseId) {
    const spouse = await db.collection('members').doc(member.spouseId).get()
    relations.spouse = spouse.data
  }

  // 获取子女
  const childrenRes = await db.collection('members').where(
    _.or([
      { fatherId: id },
      { motherId: id }
    ])
  ).get()
  relations.children = childrenRes.data

  return { 
    code: 0, 
    data: { ...member, relations }
  }
}

// 更新成员
async function updateMember(openid, data) {
  const { id, ...updateData } = data
  
  const userRes = await db.collection('users').where({ _openid: openid }).get()
  if (userRes.data.length === 0) {
    return { code: -1, message: '用户未登录' }
  }
  const user = userRes.data[0]

  // 重新计算辈分
  if (updateData.fatherId || updateData.motherId) {
    const parentId = updateData.fatherId || updateData.motherId
    const parentRes = await db.collection('members').doc(parentId).get()
    if (parentRes.data) {
      updateData.generation = (parentRes.data.generation || 1) + 1
    }
  }

  await db.collection('members').doc(id).update({
    data: {
      ...updateData,
      updatedBy: user._id,
      updatedAt: db.serverDate()
    }
  })

  return { code: 0, message: '更新成功' }
}

// 删除成员
async function deleteMember(openid, id) {
  // 检查是否有子女，有子女不能删除
  const childrenRes = await db.collection('members').where(
    _.or([
      { fatherId: id },
      { motherId: id }
    ])
  ).get()

  if (childrenRes.data.length > 0) {
    return { code: -1, message: '该成员有子女，无法删除' }
  }

  await db.collection('members').doc(id).remove()
  return { code: 0, message: '删除成功' }
}

// 获取家谱树
async function getFamilyTree(rootId, depth = 5) {
  const visited = new Set()
  const tree = await buildTree(rootId, 0, depth, visited)
  return { code: 0, data: tree }
}

// 递归构建树
async function buildTree(memberId, currentDepth, maxDepth, visited) {
  if (currentDepth >= maxDepth || visited.has(memberId)) {
    return null
  }
  
  visited.add(memberId)
  
  const memberRes = await db.collection('members').doc(memberId).get()
  if (!memberRes.data) return null

  const member = memberRes.data
  
  // 获取子女
  const childrenRes = await db.collection('members').where(
    _.or([
      { fatherId: memberId },
      { motherId: memberId }
    ])
  ).get()

  const children = []
  for (const child of childrenRes.data) {
    const childTree = await buildTree(child._id, currentDepth + 1, maxDepth, visited)
    if (childTree) children.push(childTree)
  }

  return {
    id: member._id,
    name: member.name,
    gender: member.gender,
    generation: member.generation,
    avatar: member.avatar,
    children: children
  }
}

// 搜索成员
async function searchMembers(keyword, filters = {}) {
  let query = db.collection('members')
  
  if (keyword) {
    query = query.where({
      name: db.RegExp({
        regexp: keyword,
        options: 'i'
      })
    })
  }

  if (filters.generation) {
    query = query.where({ generation: filters.generation })
  }

  const res = await query.limit(50).get()
  return { code: 0, data: res.data }
}

// 获取家族统计
async function getFamilyStats() {
  const membersRes = await db.collection('members').get()
  const members = membersRes.data

  const stats = {
    totalCount: members.length,
    generationCount: {},
    genderCount: { male: 0, female: 0 },
    locationCount: {}
  }

  members.forEach(m => {
    // 辈分统计
    stats.generationCount[m.generation] = (stats.generationCount[m.generation] || 0) + 1
    // 性别统计
    if (m.gender) stats.genderCount[m.gender]++
    // 地区统计
    if (m.currentLocation) {
      stats.locationCount[m.currentLocation] = (stats.locationCount[m.currentLocation] || 0) + 1
    }
  })

  return { code: 0, data: stats }
}
