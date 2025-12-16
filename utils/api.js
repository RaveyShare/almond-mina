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

export async function userCenterLogin(code, userInfo = null) {
  const body = { appId: APP_ID, code, userInfo }
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
