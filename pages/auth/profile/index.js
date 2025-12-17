import { updateUserInfo, uploadAvatar, qrScan, qrConfirm } from '../../../utils/api.js'
import { USER_CENTER_BASE } from '../../../utils/config.js'

Page({
  data: {
    nickname: '',
    avatarUrl: '', 
    remoteAvatarUrl: '',
    loading: false,
    qrcodeId: '' // 添加 qrcodeId 字段
  },
  
  onLoad(options) {
    console.log('Profile page onLoad, options:', options)
    
    // 获取 qrcodeId（如果有）
    const qrcodeId = options.qrcodeId || ''
    this.setData({ qrcodeId })
    
    if (qrcodeId) {
      console.log('Profile page has qrcodeId:', qrcodeId)
      wx.showToast({
        title: '完善资料后将完成扫码登录',
        icon: 'none',
        duration: 2000
      })
    }
    
    const user = wx.getStorageSync('user_data')
    if (user) {
      // 兼容后端返回的字段：可能是 avatar 或 avatarUrl
      let displayAvatar = user.avatar || user.avatarUrl || ''
      if (displayAvatar && displayAvatar.startsWith('/')) {
        displayAvatar = USER_CENTER_BASE + displayAvatar
      }
      
      this.setData({
        nickname: (user.nickname === '微信用户' || !user.nickname) ? '' : user.nickname,
        avatarUrl: displayAvatar,
        remoteAvatarUrl: user.avatar || user.avatarUrl || ''
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
      // 1. 更新用户信息
      // 注意：后端更新接口接收 avatarUrl，但返回数据中是 avatar
      const user = await updateUserInfo({
        nickname: this.data.nickname,
        avatarUrl: this.data.remoteAvatarUrl  // 后端接收的是 avatarUrl
      })
      
      // 更新本地存储
      wx.setStorageSync('user_data', user)
      
      wx.showToast({ title: '保存成功', icon: 'success' })
      
      // 2. 如果有 qrcodeId，处理扫码登录逻辑
      if (this.data.qrcodeId) {
        console.log('Processing QR code after profile update, qrcodeId:', this.data.qrcodeId)
        
        try {
          // 上报扫码状态
          console.log('Calling qrScan API...')
          await qrScan(this.data.qrcodeId)
          console.log('QR scan reported successfully')
          
          // 确认登录
          console.log('Calling qrConfirm API...')
          await qrConfirm(this.data.qrcodeId)
          console.log('QR confirm successful')
          
          wx.showToast({ 
            title: '网页登录已确认', 
            icon: 'success',
            duration: 2000
          })
          
          setTimeout(() => {
            wx.switchTab({ url: '/pages/tabs/home/index' })
          }, 1500)
          
        } catch (scanErr) {
          console.error('QR scan/confirm failed:', scanErr)
          
          // 如果失败，跳转到确认页
          wx.showToast({ 
            title: '请手动确认登录', 
            icon: 'none',
            duration: 2000
          })
          
          setTimeout(() => {
            wx.navigateTo({ 
              url: `/pages/auth/confirm/index?qrcodeId=${this.data.qrcodeId}` 
            })
          }, 1500)
        }
      } else {
        // 3. 普通情况，判断是返回还是跳转首页
        const pages = getCurrentPages()
        if (pages.length > 1) {
          setTimeout(() => wx.navigateBack(), 1500)
        } else {
          setTimeout(() => wx.switchTab({ url: '/pages/tabs/home/index' }), 1500)
        }
      }
      
    } catch (err) {
      console.error('Save profile failed:', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})