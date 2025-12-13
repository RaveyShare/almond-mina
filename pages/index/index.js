import { getToken } from '../../utils/auth.js'

Page({
  data: {
    isLoggedIn: false
  },
  onLoad() {},
  onShow() {
    this.checkLoginStatus()
  },
  checkLoginStatus() {
    const token = getToken()
    this.setData({ isLoggedIn: !!token })
  },
  toLogin(){
    wx.navigateTo({ url: '/pages/auth/login/login' })
  },
  doLogout() {
    wx.removeStorageSync('access_token')
    wx.removeStorageSync('user_data')
    this.setData({ isLoggedIn: false })
    wx.showToast({ title: '已退出', icon: 'none' })
  }
})
