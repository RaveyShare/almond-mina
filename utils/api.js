import { APP_ID, USER_CENTER_BASE } from './config.js'
import { getToken } from './auth.js'

function requestUC(path, method, data, headers = {}) {
  return new Promise((resolve, reject) => {
    console.log(`[Request] ${method} ${USER_CENTER_BASE}${path}`, data)
    wx.request({
      url: `${USER_CENTER_BASE}${path}`,
      method,
      data,
      header: { 'Content-Type': 'application/json', ...headers },
      success: (res) => {
        console.log(`[Response] ${path}`, res)
        resolve(res.data || res)
      },
      fail: (err) => {
        console.error(`[Request Error] ${path}`, err)
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
