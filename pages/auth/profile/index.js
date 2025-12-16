import { updateUserInfo, uploadAvatar } from '../../../utils/api.js'
import { USER_CENTER_BASE } from '../../../utils/config.js'

Page({
  data: {
    nickname: '',
    avatarUrl: '', 
    remoteAvatarUrl: '',
    loading: false
  },
  
  onLoad(options) {
      const user = wx.getStorageSync('user_data')
      if (user) {
          let displayAvatar = user.avatarUrl || ''
          if (displayAvatar.startsWith('/')) {
              displayAvatar = USER_CENTER_BASE + displayAvatar
          }
          
          this.setData({
              nickname: (user.nickname === '微信用户' || !user.nickname) ? '' : user.nickname,
              avatarUrl: displayAvatar,
              remoteAvatarUrl: user.avatarUrl
          })
      }
  },

  async onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({ avatarUrl }) // 立即显示选中的图片（临时路径）
    
    try {
        wx.showLoading({ title: '上传中...' })
        const url = await uploadAvatar(avatarUrl)
        this.setData({ remoteAvatarUrl: url }) // 保存相对路径
        wx.hideLoading()
    } catch(err) {
        wx.hideLoading()
        wx.showToast({ title: '上传失败', icon: 'none' })
        console.error(err)
    }
  },

  onNicknameChange(e) {
      this.setData({ nickname: e.detail.value })
  },
  
  onNicknameInput(e) {
      this.setData({ nickname: e.detail.value })
  },

  async onSave() {
      if (!this.data.nickname) {
          wx.showToast({ title: '请输入昵称', icon: 'none' })
          return
      }
      
      this.setData({ loading: true })
      try {
          const user = await updateUserInfo({
              nickname: this.data.nickname,
              avatarUrl: this.data.remoteAvatarUrl
          })
          
          // 更新本地存储
          wx.setStorageSync('user_data', user)
          
          wx.showToast({ title: '保存成功', icon: 'success' })
          
          // 获取页面栈，判断是返回还是跳转首页
          const pages = getCurrentPages()
          if (pages.length > 1) {
              setTimeout(() => wx.navigateBack(), 1500)
          } else {
              setTimeout(() => wx.switchTab({ url: '/pages/tabs/home/index' }), 1500)
          }
      } catch (err) {
          console.error(err)
          wx.showToast({ title: '保存失败', icon: 'none' })
      } finally {
          this.setData({ loading: false })
      }
  }
})
