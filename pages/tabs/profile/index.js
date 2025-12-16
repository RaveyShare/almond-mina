import { clearAuth } from '../../../utils/auth'

Page({
  data: {
    userInfo: null,
    stats: {
        memoryCount: 0,
        taskCount: 0,
        days: 1
    }
  },

  onShow() {
    const user = wx.getStorageSync('user_data')
    this.setData({
      userInfo: user || { nickname: '未登录', avatar: '' }
    })
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          clearAuth()
          wx.reLaunch({ url: '/pages/auth/login/login' })
        }
      }
    })
  }
})
