import { APP_ID, USER_CENTER_BASE, ALMOND_BACK_BASE } from './config.js'
import { getToken } from './auth.js'

function requestUC(path, method, data, headers = {}) {
  return new Promise((resolve, reject) => {
    console.log(`[Request UC] ${method} ${USER_CENTER_BASE}${path}`, data)
    wx.request({
      url: `${USER_CENTER_BASE}${path}`,
      method,
      data,
      header: { 'Content-Type': 'application/json', ...headers },
      success: (res) => {
        console.log(`[Response UC] ${path}`, res)
        resolve(res.data || res)
      },
      fail: (err) => {
        console.error(`[Request Error UC] ${path}`, err)
        reject(err)
      },
    })
  })
}

function requestBack(path, method, data, headers = {}) {
  const token = getToken()
  return new Promise((resolve, reject) => {
    console.log(`[Request Back] ${method} ${ALMOND_BACK_BASE}${path}`, data)
    wx.request({
      url: `${ALMOND_BACK_BASE}${path}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...headers
      },
      success: (res) => {
        console.log(`[Response Back] ${path}`, res)
        if (res.statusCode === 200) {
          const result = res.data
          if (result.code === 0 || result.code === 200) {
            resolve(result.data)
          } else {
            reject(new Error(result.message || 'Request failed'))
          }
        } else {
          reject(new Error(`HTTP Error ${res.statusCode}`))
        }
      },
      fail: (err) => {
        console.error(`[Request Error Back] ${path}`, err)
        reject(err)
      },
    })
  })
}

export async function userCenterLogin(code, userInfo = null, encryptedData = null, iv = null) {
  const body = { appId: APP_ID, code, userInfo, encryptedData, iv }
  const resp = await requestUC('/front/auth/wxMiniAppLogin', 'POST', body)
  if ((resp.code === 0 || resp.code === 200) && resp.data && resp.data.token) {
    return resp.data
  }
  throw new Error(resp.message || 'login failed')
}

export async function qrScan(qrcodeId) {
  const token = getToken()
  return requestUC('/front/auth/qr/scan', 'POST', { qrcodeId }, { Authorization: `Bearer ${token}` })
}

export async function qrConfirm(qrcodeId) {
  const token = getToken()
  return requestUC('/front/auth/qr/confirm', 'POST', { qrcodeId }, { Authorization: `Bearer ${token}` })
}

export async function updateUserInfo(data) {
  const token = getToken()
  const resp = await requestUC('/front/users/update', 'POST', data, { Authorization: `Bearer ${token}` })
  if (resp.code === 0 || resp.code === 200) {
    return resp.data
  }
  throw new Error(resp.message || '更新失败')
}

export function uploadAvatar(filePath) {
  return new Promise((resolve, reject) => {
    const token = getToken()
    wx.uploadFile({
      url: `${USER_CENTER_BASE}/front/users/avatar/upload`,
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success(res) {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 0 || data.code === 200) {
            resolve(data.message) // URL
          } else {
            reject(new Error(data.message || '上传失败'))
          }
        } catch (e) {
          reject(e)
        }
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

// Memory Items
export async function getMemoryItems(params = {}) {
  // params: { page, size, keyword, category }
  return requestBack('/front/memory/items/list', 'GET', params)
}

export async function saveMemoryItem(content) {
  const payload = {
    title: content.slice(0, 20),
    content: content,
    itemType: 'text',
    difficulty: 'medium'
  }
  return requestBack('/front/memory/items/create', 'POST', payload)
}

// Tasks
export async function getTasks(params = {}) {
  // params: { page, size, keyword, status }
  return requestBack('/front/tasks/list', 'GET', params)
}

export async function createTask(title) {
  const payload = {
    title: title,
    status: 'todo',
    priority: 0,
    level: 'inbox'
  }
  return requestBack('/front/tasks/create', 'POST', payload)
}
