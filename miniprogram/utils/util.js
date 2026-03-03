// utils/util.js
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

// 计算年龄
const calculateAge = (birthDate) => {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// 辈分中文
const generationText = (generation) => {
  const texts = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  if (generation <= 10) return `第${texts[generation]}代`
  return `第${generation}代`
}

// 验证手机号
const isValidPhone = (phone) => {
  return /^1[3-9]\d{9}$/.test(phone)
}

// 防抖函数
const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

module.exports = {
  formatTime,
  calculateAge,
  generationText,
  isValidPhone,
  debounce
}
