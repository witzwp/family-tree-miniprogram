// 成员相关云函数
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

/**
 * Main entry for member cloud function.
 * @param {!Object} event - Cloud function event.
 * @param {!Object} context - Cloud function context.
 * @return {!Object} Response object.
 */
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
        return await getFamilyTree(data.familyId, data.rootId, data.depth)
      case 'search':
        return await searchMembers(
          data.familyId, data.keyword, data.filters, data.limit, data.fuzzy
        )
      case 'getStats':
        return await getFamilyStats(data.familyId)
      default:
        return { code: -1, message: '未知操作' }
    }
  } catch (error) {
    console.error(error)
    return { code: -1, message: error.message }
  }
}

/**
 * Gets the user's current family ID from request data or user record.
 * @param {string} openid - User openid.
 * @param {string|undefined} dataFamilyId - Family ID from request data.
 * @return {Promise<string|null>} Family ID or null.
 */
async function resolveFamilyId(openid, dataFamilyId) {
  if (dataFamilyId) return dataFamilyId

  const userRes = await db.collection('users').where({ _openid: openid }).get()
  if (userRes.data.length === 0) return null

  const user = userRes.data[0]
  const fmRes = await db.collection('familyMembers')
    .where({ userId: user._id })
    .limit(1)
    .get()

  if (fmRes.data.length > 0) return fmRes.data[0].familyId
  return null
}

// 创建成员
async function createMember(openid, data) {
  // 获取当前用户
  const userRes = await db.collection('users').where({ _openid: openid }).get()
  if (userRes.data.length === 0) {
    return { code: -1, message: '用户未登录' }
  }
  const user = userRes.data[0]

  const familyId = await resolveFamilyId(openid, data.familyId)
  if (!familyId) {
    return { code: -1, message: '请先选择或创建一个家族' }
  }

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
    familyId,
    userId: user._id,
    generation,
    createdBy: user._id,
    createdAt: db.serverDate(),
    updatedAt: db.serverDate(),
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
      { motherId: id },
    ])
  ).get()
  relations.children = childrenRes.data

  return {
    code: 0,
    data: { ...member, relations },
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
      updatedAt: db.serverDate(),
    },
  })

  return { code: 0, message: '更新成功' }
}

// 删除成员
async function deleteMember(openid, id) {
  // 检查是否有子女，有子女不能删除
  const childrenRes = await db.collection('members').where(
    _.or([
      { fatherId: id },
      { motherId: id },
    ])
  ).get()

  if (childrenRes.data.length > 0) {
    return { code: -1, message: '该成员有子女，无法删除' }
  }

  await db.collection('members').doc(id).remove()
  return { code: 0, message: '删除成功' }
}

// 获取家谱树
async function getFamilyTree(familyId, rootId, depth = 5) {
  if (!familyId) {
    return { code: -1, message: '请先选择家族' }
  }

  // If no rootId, find the earliest generation member as root
  let startId = rootId
  if (!startId) {
    const rootRes = await db.collection('members')
      .where({ familyId, generation: 1 })
      .limit(1)
      .get()
    if (rootRes.data.length > 0) {
      startId = rootRes.data[0]._id
    } else {
      // Fallback: any member with no parents
      const anyRes = await db.collection('members')
        .where({
          familyId,
          fatherId: null,
          motherId: null,
        })
        .limit(1)
        .get()
      if (anyRes.data.length > 0) {
        startId = anyRes.data[0]._id
      }
    }
  }

  if (!startId) {
    return { code: 0, data: null }
  }

  const visited = new Set()
  const tree = await buildTree(startId, 0, depth, visited)
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
      { motherId: memberId },
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
    children: children,
  }
}

// 搜索成员
async function searchMembers(familyId, keyword, filters = {}, limit = 50, fuzzy = false) {
  if (!familyId) {
    return { code: -1, message: '请先选择家族', data: [] }
  }

  let query = db.collection('members')
  const conditions = { familyId }

  if (keyword) {
    const trimmed = keyword.trim()
    if (fuzzy) {
      // 模糊匹配：支持包含任意字符
      const chars = trimmed.split('').filter((c) => c.trim())
      const regexps = chars.map((c) => `.*${escapeRegExp(c)}`)
      const fuzzyPattern = regexps.join('')
      conditions.name = db.RegExp({
        regexp: fuzzyPattern,
        options: 'i',
      })
    } else {
      conditions.name = db.RegExp({
        regexp: trimmed,
        options: 'i',
      })
    }
  }

  if (filters && filters.generation) {
    conditions.generation = filters.generation
  }

  if (filters && filters.gender) {
    conditions.gender = filters.gender
  }

  if (Object.keys(conditions).length > 0) {
    query = query.where(conditions)
  }

  const res = await query.limit(limit).get()
  return { code: 0, data: res.data }
}

// 转义正则特殊字符
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 获取家族统计
async function getFamilyStats(familyId) {
  if (!familyId) {
    return { code: -1, message: '请先选择家族' }
  }

  const membersRes = await db.collection('members').where({ familyId }).get()
  const members = membersRes.data

  const stats = {
    totalCount: members.length,
    generationCount: {},
    generationTotal: 0,
    genderCount: { male: 0, female: 0, unknown: 0 },
    locationCount: {},
    ageDistribution: {},
    birthYearRange: null,
    topSurnames: [],
    avgChildren: 0,
  }

  const birthYears = []
  const surnameMap = {}
  let totalChildren = 0
  let membersWithChildren = 0

  members.forEach((m) => {
    // 辈分统计
    stats.generationCount[m.generation] =
      (stats.generationCount[m.generation] || 0) + 1

    // 性别统计
    if (m.gender === 'male' || m.gender === 'female') {
      stats.genderCount[m.gender]++
    } else {
      stats.genderCount.unknown++
    }

    // 地区统计
    if (m.currentLocation) {
      stats.locationCount[m.currentLocation] =
        (stats.locationCount[m.currentLocation] || 0) + 1
    }

    // 年龄分布
    const age = computeAge(m.birthDate, m.deathDate)
    const ageGroup = getAgeGroup(age)
    stats.ageDistribution[ageGroup] =
      (stats.ageDistribution[ageGroup] || 0) + 1

    // 出生年份
    const year = extractYear(m.birthDate)
    if (year) {
      birthYears.push(year)
    }

    // 姓氏统计（取第一个字符作为姓氏）
    if (m.name) {
      const surname = m.name.charAt(0)
      surnameMap[surname] = (surnameMap[surname] || 0) + 1
    }

    // 子女数
    const childCount = Array.isArray(m.children) ? m.children.length : 0
    if (childCount > 0) {
      totalChildren += childCount
      membersWithChildren++
    }
  })

  // 辈分总数
  stats.generationTotal = Object.keys(stats.generationCount).length

  // 出生年份范围
  if (birthYears.length > 0) {
    const minYear = Math.min(...birthYears)
    const maxYear = Math.max(...birthYears)
    stats.birthYearRange = {
      min: minYear,
      max: maxYear,
      span: maxYear - minYear,
    }
  }

  // 常见姓氏 TOP10
  const surnameEntries = Object.entries(surnameMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  const maxSurnameCount = surnameEntries.length > 0 ? surnameEntries[0][1] : 1
  stats.topSurnames = surnameEntries.map(([surname, count]) => ({
    surname,
    count,
    percent: Math.round((count / maxSurnameCount) * 100),
  }))

  // 平均子女数
  stats.avgChildren = membersWithChildren > 0
    ? parseFloat((totalChildren / membersWithChildren).toFixed(2))
    : 0

  return { code: 0, data: stats }
}

/**
 * Computes age from birth date and optional death date.
 * @param {string|Date} birthDate - Birth date.
 * @param {string|Date} deathDate - Death date if deceased.
 * @return {number|null} Age in years or null.
 */
function computeAge(birthDate, deathDate) {
  const birth = parseDate(birthDate)
  if (!birth) return null
  const end = parseDate(deathDate) || new Date()
  let age = end.getFullYear() - birth.getFullYear()
  const monthDiff = end.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    age--
  }
  return age
}

/**
 * Returns age group label for a given age.
 * @param {number|null} age - Age in years.
 * @return {string} Age group label.
 */
function getAgeGroup(age) {
  if (age == null) return '未知'
  if (age <= 18) return '0-18'
  if (age <= 30) return '19-30'
  if (age <= 45) return '31-45'
  if (age <= 60) return '46-60'
  if (age <= 80) return '61-80'
  return '80+'
}

/**
 * Extracts year from a date value.
 * @param {string|Date|Object} dateValue - Date value.
 * @return {number|null} Year or null.
 */
function extractYear(dateValue) {
  const d = parseDate(dateValue)
  return d ? d.getFullYear() : null
}

/**
 * Parses a date value into a Date object.
 * @param {string|Date|Object} dateValue - Date value.
 * @return {Date|null} Parsed Date or null.
 */
function parseDate(dateValue) {
  if (!dateValue) return null
  if (dateValue instanceof Date) return dateValue
  if (typeof dateValue === 'string') {
    const d = new Date(dateValue)
    return isNaN(d.getTime()) ? null : d
  }
  if (typeof dateValue === 'object' && dateValue.$date) {
    const d = new Date(dateValue.$date)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}
