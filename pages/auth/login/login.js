import { userCenterLogin, qrScan, qrConfirm } from '../../../utils/api.js'
import { setAuth } from '../../../utils/auth.js'
import { APP_ID } from '../../../utils/config.js'

Page({
  data: {
    loading: false,
    qrcodeId: ''
  },

  onLoad(options) {
    console.log('Login page onLoad, options:', options)
    
    // 方式1: 从页面参数获取（navigateTo 传递的参数）
    let qrcodeId = options.qrcodeId || options.scene || ''
    
    // 方式2: 如果参数为空，尝试从启动场景获取（扫码进入）
    if (!qrcodeId) {
      try {
        const enterOptions = wx.getEnterOptionsSync ? wx.getEnterOptionsSync() : null
        console.log('Enter options:', enterOptions)
        
        if (enterOptions) {
          // 从 query 中获取
          if (enterOptions.query) {
            qrcodeId = enterOptions.query.qrcodeId || enterOptions.query.scene || ''
          }
          
          // 从 scene 参数中获取（小程序码场景值）
          if (!qrcodeId && enterOptions.scene) {
            // 场景值需要解码，格式可能是 qrcodeId=xxx
            const sceneStr = decodeURIComponent(enterOptions.scene)
            console.log('Decoded scene:', sceneStr)
            
            // 尝试解析 scene 参数
            const match = sceneStr.match(/qrcodeId=([^&]+)/)
            if (match) {
              qrcodeId = match[1]
            } else {
              // 如果 scene 就是 qrcodeId
              qrcodeId = sceneStr
            }
          }
          
          // 从 referrerInfo 中获取（扫普通二维码）
          if (!qrcodeId && enterOptions.referrerInfo && enterOptions.referrerInfo.extraData) {
            qrcodeId = enterOptions.referrerInfo.extraData.qrcodeId || ''
          }
        }
      } catch (err) {
        console.error('Failed to get enter options:', err)
      }
    }
    
    console.log('Final qrcodeId:', qrcodeId)
    this.setData({ qrcodeId })
    
    // 如果有 qrcodeId，提示用户这是扫码登录
    if (qrcodeId) {
      wx.showToast({
        title: '检测到扫码登录',
        icon: 'none',
        duration: 2000
      })
    }
  },

  onShow() {
    // 每次页面显示时也尝试获取最新的场景参数
    if (!this.data.qrcodeId) {
      try {
        const enterOptions = wx.getEnterOptionsSync ? wx.getEnterOptionsSync() : null
        if (enterOptions && enterOptions.query) {
          const qrcodeId = enterOptions.query.qrcodeId || enterOptions.query.scene || ''
          if (qrcodeId) {
            console.log('Got qrcodeId from onShow:', qrcodeId)
            this.setData({ qrcodeId })
          }
        }
      } catch (err) {
        console.error('onShow get qrcodeId failed:', err)
      }
    }
  },

  onLogin() {
    if (this.data.loading) return

    // 微信隐私政策更新后，getUserProfile 只返回"微信用户"
    // 所以我们直接静默登录，不需要获取微信的用户信息
    // 用户的真实昵称和头像从后端返回
    this.performLogin(null, null, null)
  },

  async performLogin(userInfo, encryptedData, iv) {
    this.setData({ loading: true })
    console.log('Starting login process with userInfo:', userInfo)
    console.log('QrcodeId for scan:', this.data.qrcodeId)

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
      console.log('Calling backend login API...')
      const res = await userCenterLogin(code, userInfo, encryptedData, iv)
      console.log('Login API response:', res)

      // 3. 保存 Token 和用户信息
      setAuth(res.token, res.userInfo)
      console.log('Token saved:', res.token)

      // 4. 检查是否需要完善资料
      const u = res.userInfo
      console.log('Checking user profile completeness:', u)
      
      // 兼容后端返回的字段：可能是 avatar 或 avatarUrl
      const nickname = u.nickname || ''
      const avatar = u.avatar || u.avatarUrl || ''
      
      console.log('nickname:', nickname, 'avatar:', avatar)
      
      // 只有在真正缺少必要信息时才跳转完善资料页
      // 排除"微信用户"这种默认昵称
      const hasValidNickname = nickname && nickname.trim() !== '' && nickname !== '微信用户'
      const hasValidAvatar = avatar && avatar.trim() !== ''
      
      const needsProfile = !hasValidNickname || !hasValidAvatar
      
      console.log('hasValidNickname:', hasValidNickname, 'hasValidAvatar:', hasValidAvatar, 'needsProfile:', needsProfile)
      
      if (needsProfile) {
        console.log('User profile incomplete, redirecting to profile page')
        wx.showToast({ title: '登录成功，请完善资料', icon: 'none', duration: 2000 })
        setTimeout(() => {
          // 如果有 qrcodeId，需要传递给资料页，完善后继续扫码流程
          const url = this.data.qrcodeId 
            ? `/pages/auth/profile/index?qrcodeId=${this.data.qrcodeId}`
            : '/pages/auth/profile/index'
          wx.redirectTo({ url })
        }, 1500)
        return
      }
      
      console.log('User profile is complete, proceeding...')

      // 5. 处理扫码登录逻辑
      if (this.data.qrcodeId) {
        console.log('Processing QR code login, qrcodeId:', this.data.qrcodeId)
        
        try {
          // 5.1 上报扫码状态
          console.log('Calling qrScan API...')
          await qrScan(this.data.qrcodeId)
          console.log('QR scan reported successfully')
          
          // 5.2 确认登录
          console.log('Calling qrConfirm API...')
          await qrConfirm(this.data.qrcodeId)
          console.log('QR confirm successful')
          
          wx.showToast({ 
            title: '网页登录已确认', 
            icon: 'success',
            duration: 2000
          })
          
          // 延迟跳转，让用户看到提示
          setTimeout(() => {
            wx.switchTab({ url: '/pages/tabs/home/index' })
          }, 1500)
          
        } catch (scanErr) {
          console.error('QR scan/confirm failed:', scanErr)
          
          // 如果自动确认失败，跳转到确认页让用户手动确认
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
        // 普通登录，直接跳转首页
        console.log('Normal login, redirecting to home')
        wx.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => {
          wx.switchTab({ url: '/pages/tabs/home/index' })
        }, 1000)
      }
      
    } catch (err) {
      console.error('Login failed:', err)
      wx.showToast({ 
        title: '登录失败: ' + (err.message || '未知错误'), 
        icon: 'none',
        duration: 3000
      })
    } finally {
      this.setData({ loading: false })
    }
  }
})