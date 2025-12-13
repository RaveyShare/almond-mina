import { userCenterLogin, qrScan, qrConfirm } from '../../../utils/api.js'
import { setAuth } from '../../../utils/auth.js'
import { APP_ID } from '../../../utils/config.js'

Page({
  data:{ loading:false, qrcodeId:'' },
  onLoad(){
    const enter = typeof wx.getEnterOptionsSync==='function' ? wx.getEnterOptionsSync() : null
    const q = enter && enter.query ? enter.query : {}
    const id = q.qrcodeId || q.scene || ''
    this.setData({ qrcodeId: id })
  },
  async onLogin(){
    console.log('Login button clicked') // Debug log
    if(this.data.loading) {
      console.log('Login is loading, ignore click')
      return
    }
    this.setData({ loading:true })
    console.log('Starting login process...')
    try{
      console.log('Calling wx.login...')
      const code = await new Promise((resolve,reject)=>{
        wx.login({
          success:(r)=>{
            console.log('wx.login success:', r)
            r.code?resolve(r.code):reject(new Error('no code'))
          },
          fail:(err)=>{
            console.error('wx.login fail:', err)
            reject(err)
          }
        })
      })
      console.log('Got code:', code)
      const res = await userCenterLogin(code, null)
      setAuth(res.token, res.userInfo)
      if(this.data.qrcodeId){
        try{ await qrScan(this.data.qrcodeId) }catch(_){ }
        await qrConfirm(this.data.qrcodeId)
        wx.showToast({ title:'已确认网页登录', icon:'none' })
      }else{
        wx.showToast({ title:'登录成功', icon:'none' })
      }
      wx.reLaunch({ url:'/pages/index/index' })
    }catch(e){
      console.error('Login Error:', e)
      let msg = e.message || e.errMsg || '登录失败'
      if (typeof e === 'object' && !msg && JSON.stringify(e) !== '{}') {
          msg = JSON.stringify(e)
      }
      wx.showToast({ title: String(msg), icon:'none' })
    }finally{
      this.setData({ loading:false })
    }
  }
})
