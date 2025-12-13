const ACCESS_TOKEN_KEY = 'access_token'
const USER_KEY = 'user_data'

export function setAuth(token, user) {
  try {
    wx.setStorageSync(ACCESS_TOKEN_KEY, token)
    if (user) wx.setStorageSync(USER_KEY, user)
  } catch (_) {}
}

export function getToken() {
  try {
    const t = wx.getStorageSync(ACCESS_TOKEN_KEY)
    return t || null
  } catch (_) { return null }
}

export function clearAuth() {
  try {
    wx.removeStorageSync(ACCESS_TOKEN_KEY)
    wx.removeStorageSync(USER_KEY)
  } catch (_) {}
}
