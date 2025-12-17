import { userCenterLogin, qrScan, qrConfirm } from '../../../utils/api.js'
import { setAuth } from '../../../utils/auth.js'
import { APP_ID } from '../../../utils/config.js'

Page({
  data: {
    loading: false,
    qrcodeId: ''
  },

  onLoad() {
    const enter = typeof wx.getEnterOptionsSync === 'function' ? wx.getEnterOptionsSync() : null
    const q = enter && enter.query ? enter.query : {}
    const id = q.qrcodeId || q.scene || ''
    this.setData({ qrcodeId: id })
  },

  onLogin() {
    if (this.data.loading) return

    // 尝试获取用户信息
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        console.log('getUserProfile success:', res.userInfo)
        this.performLogin(res.userInfo, res.encryptedData, res.iv)
      },
      fail: (err) => {
        console.log('getUserProfile fail or denied:', err)
        // 用户拒绝授权或接口不可用，降级为静默登录（无头像昵称）
        this.performLogin(null, null, null)
      }
    })
  },

  async performLogin(userInfo, encryptedData, iv) {
    this.setData({ loading: true })
    console.log('Starting login process with userInfo:', userInfo)

    try {
      // 1. 获取 Login Code
      const code = await new Promise((resolve, reject) => {
        wx.login({
          success: (r) => {
            console.log('wx.login success:', r)
            r.code ? resolve(r.code) : reject(new Error('no code'))
          },
          fail: (err) => {
            console.error('wx.login fail:', err)
            reject(err)
          }
        })
      })

      // 2. 调用后端登录接口
      const res = await userCenterLogin(code, userInfo, encryptedData, iv)

      // 3. 保存 Token 和用户信息
      setAuth(res.token, res.userInfo)

      // 4. 检查是否需要完善资料
      const u = res.userInfo
      if (!u.nickname || u.nickname === '微信用户' || !u.avatarUrl) {
        wx.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/auth/profile/index' })
        }, 1000)
      } else {
        // 5. 处理扫码登录逻辑或跳转首页
        // 5. 处理扫码登录逻辑: 恢复旧版逻辑，直接确认，不跳转中间页
        if (this.data.qrcodeId) {
          try {
            await qrScan(this.data.qrcodeId)
          } catch (scanErr) {
            console.warn('qrScan failed:', scanErr)
          }

          try {
            await qrConfirm(this.data.qrcodeId)
            wx.showToast({ title: '已确认网页登录', icon: 'success' })
            // 延迟跳转，让用户看清提示
            setTimeout(() => {
              wx.switchTab({ url: '/pages/tabs/home/index' })
            }, 1000)
          } catch (confirmErr) {
            console.error('qrConfirm failed:', confirmErr)
            // 假如自动确认失败，再降级跳转到确认页让用户重试
            wx.navigateTo({ url: `/pages/auth/confirm/index?qrcodeId=${this.data.qrcodeId}` })
          }
        } else {
          wx.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            wx.switchTab({ url: '/pages/tabs/home/index' })
          }, 1000)
        }
      }
    } catch (err) {
      console.error('Login failed:', err)
      wx.showToast({ title: '登录失败: ' + (err.message || '未知错误'), icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})
