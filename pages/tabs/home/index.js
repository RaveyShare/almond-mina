import { saveMemoryItem, createTask } from '../../../utils/api'
import { getToken } from '../../../utils/auth'

Page({
  data: {
    inputType: 'memory', // 'memory' or 'task'
    inputValue: '',
    loading: false,
    dashboard: {
      reviewCount: 0, // Mock for now
      taskCount: 0    // Mock for now
    },
    userInfo: null
  },

  onShow() {
    if (!getToken()) {
      wx.redirectTo({ url: '/pages/auth/login/login' })
      return
    }
    const user = wx.getStorageSync('user_data')
    if (user) {
        this.setData({ userInfo: user })
    }
    this.loadDashboard()
  },

  toggleType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ inputType: type })
  },

  handleInput(e) {
    this.setData({ inputValue: e.detail.value })
  },

  async handleSubmit() {
    if (!this.data.inputValue.trim()) return
    if (this.data.loading) return

    this.setData({ loading: true })
    try {
      if (this.data.inputType === 'memory') {
        await saveMemoryItem(this.data.inputValue)
        wx.showToast({ title: '已保存到记忆库', icon: 'success' })
      } else {
        await createTask(this.data.inputValue)
        wx.showToast({ title: '已添加到待办', icon: 'success' })
      }
      this.setData({ inputValue: '' })
      this.loadDashboard() 
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' })
      console.error(err)
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadDashboard() {
    // TODO: Implement dashboard stats API
    // For now, we just keep it simple.
  }
})
