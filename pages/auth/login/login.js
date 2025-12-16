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
        this.performLogin(res.userInfo)
      },
      fail: (err) => {
        console.log('getUserProfile fail or denied:', err)
        // 用户拒绝授权或接口不可用，降级为静默登录（无头像昵称）
        this.performLogin(null)
      }
    })
  },

  async performLogin(userInfo) {
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
      const res = await userCenterLogin(code, userInfo)
      
      // 3. 保存 Token 和用户信息
      // 如果后端返回了新的 userInfo (可能包含 userId 等)，优先使用后端返回的
      // 如果后端没返回完整 info 但我们前端获取到了，可以合并一下(视具体后端逻辑而定，这里假设 res.userInfo 是最终数据)
      const finalUser = res.userInfo || res.user || userInfo
      setAuth(res.token, finalUser)

      // 4. 处理二维码扫描逻辑 (如果有)
      if (this.data.qrcodeId) {
        try { await qrScan(this.data.qrcodeId) } catch (_) { }
        await qrConfirm(this.data.qrcodeId)
        wx.showToast({ title: '已确认网页登录', icon: 'none' })
      } else {
        wx.showToast({ title: '登录成功', icon: 'none' })
      }

      // 5. 跳转首页
      wx.reLaunch({ url: '/pages/tabs/home/index' })
      
    } catch (e) {
      console.error('Login Error:', e)
      let msg = e.message || e.errMsg || '登录失败'
      if (typeof e === 'object' && !msg && JSON.stringify(e) !== '{}') {
        msg = JSON.stringify(e)
      }
      wx.showToast({ title: String(msg), icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})
