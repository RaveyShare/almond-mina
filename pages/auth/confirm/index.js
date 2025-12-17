import { qrConfirm } from '../../../utils/api.js'

Page({
  data: {
    qrcodeId: '',
    loading: false,
    confirmed: false
  },

  onLoad(options) {
    const qrcodeId = options.qrcodeId || ''
    if (!qrcodeId) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }
    this.setData({ qrcodeId })
  },

  async onConfirm() {
    if (this.data.loading || this.data.confirmed) return
    
    this.setData({ loading: true })
    
    try {
      await qrConfirm(this.data.qrcodeId)
      this.setData({ confirmed: true })
      
      wx.showToast({ title: '授权成功', icon: 'success' })
      
      // 授权成功后返回首页
      setTimeout(() => {
        wx.switchTab({ url: '/pages/tabs/home/index' })
      }, 1500)
    } catch (err) {
      console.error('Confirm QR failed:', err)
      wx.showToast({ title: '授权失败: ' + (err.message || '未知错误'), icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onCancel() {
    wx.navigateBack()
  }
})
