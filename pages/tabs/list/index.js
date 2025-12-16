import { getMemoryItems, getTasks } from '../../../utils/api'

Page({
  data: {
    activeTab: 'memory', // 'memory' or 'task'
    memoryList: [],
    taskList: [],
    memoryPage: 1,
    taskPage: 1,
    loading: false,
    hasMoreMemory: true,
    hasMoreTask: true
  },

  onShow() {
      // Refresh data on show
      this.setData({
          memoryPage: 1,
          taskPage: 1,
          memoryList: [],
          taskList: [],
          hasMoreMemory: true,
          hasMoreTask: true
      }, () => {
          this.loadData()
      })
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.activeTab) return
    this.setData({ activeTab: tab })
    if ((tab === 'memory' && this.data.memoryList.length === 0) || 
        (tab === 'task' && this.data.taskList.length === 0)) {
        this.loadData()
    }
  },

  async loadData() {
    if (this.data.loading) return
    
    // Check limits
    if (this.data.activeTab === 'memory' && !this.data.hasMoreMemory) return
    if (this.data.activeTab === 'task' && !this.data.hasMoreTask) return

    this.setData({ loading: true })

    try {
      if (this.data.activeTab === 'memory') {
        const res = await getMemoryItems({ page: this.data.memoryPage, size: 20 })
        const list = res.list || []
        this.setData({
          memoryList: this.data.memoryPage === 1 ? list : this.data.memoryList.concat(list),
          memoryPage: this.data.memoryPage + 1,
          hasMoreMemory: list.length === 20
        })
      } else {
        const res = await getTasks({ page: this.data.taskPage, size: 20 })
        const list = res.list || []
        this.setData({
          taskList: this.data.taskPage === 1 ? list : this.data.taskList.concat(list),
          taskPage: this.data.taskPage + 1,
          hasMoreTask: list.length === 20
        })
      }
    } catch (err) {
      console.error(err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onReachBottom() {
    this.loadData()
  }
})
