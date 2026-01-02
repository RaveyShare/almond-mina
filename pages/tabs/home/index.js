import { saveMemoryItem, createTask } from '../../../utils/api'
import { getToken } from '../../../utils/auth'

Page({
  data: {
    inputValue: '',
    loading: false,
    status: 'idle', // idle, processing, converted, need_confirm, confirmed
    statusAnimation: null,

    // 动态 placeholder
    placeholders: [
      "「刚想到的一件事」",
      "「一个模糊的想法」",
      "「最近反复出现的念头」",
      "「今天发生的一件事」",
      "「心里的困惑」",
      "「想要记录的瞬间」"
    ],
    currentPlaceholderIndex: 0,
    currentPlaceholder: "「刚想到的一件事」",

    // 动画对象
    logoAnimation: null,
    titleAnimation: null,
    heroAnimation: null,
    inputAnimation: null,
    featureAnimation: null,

    dashboard: {
      reviewCount: 0,
      taskCount: 0
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

    // 启动 placeholder 轮播
    this.startPlaceholderRotation()
  },

  onReady() {
    // 播放进场动画
    this.playEntranceAnimations()
  },

  onHide() {
    // 停止 placeholder 轮播
    this.stopPlaceholderRotation()
  },

  handleInput(e) {
    this.setData({ inputValue: e.detail.value })
  },

  async handleSubmit() {
    if (!this.data.inputValue.trim()) return
    if (this.data.loading || this.data.status === 'processing') return

    const value = this.data.inputValue;
    this.setData({ 
        status: 'processing',
        inputValue: '' 
    })
    
    // 状态区域入场动画
    const anim = wx.createAnimation({ duration: 300, timingFunction: 'ease-out' })
    anim.opacity(1).translateY(0).step()
    this.setData({ statusAnimation: anim.export() })

    try {
      // 模拟调用保存接口
      // await saveMemoryItem(value)
      
      // 模拟 AI 处理延迟
      setTimeout(() => {
          const isHighConfidence = Math.random() > 0.4;
          if (isHighConfidence) {
              this.setData({ status: 'converted' });
          } else {
              this.setData({ status: 'need_confirm' });
          }
          this.loadDashboard();
      }, 1500);
      
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' })
      this.setData({ status: 'idle' })
    }
  },

  handleView() {
      // 模拟查看详情，暂时直接完成
      this.finishStatus();
  },

  handleEditType() {
      this.setData({ status: 'need_confirm' });
  },

  handleConfirmType(e) {
      const type = e.currentTarget.dataset.type;
      console.log('Selected type:', type);
      // 这里应该调用 API 更新类型
      this.finishStatus();
  },
  
  handleReset() {
      this.setData({ status: 'idle' });
  },

  finishStatus() {
      this.setData({ status: 'confirmed' });
      setTimeout(() => {
          this.setData({ status: 'idle' });
      }, 2000);
  },

  async loadDashboard() {
    // TODO: Implement dashboard stats API
    // For now, we just keep it simple.
  },

  // ============ Placeholder 轮播 ============
  startPlaceholderRotation() {
    this.placeholderTimer = setInterval(() => {
      const nextIndex = (this.data.currentPlaceholderIndex + 1) % this.data.placeholders.length;

      // 创建淡出动画
      const fadeOut = wx.createAnimation({
        duration: 300,
        timingFunction: 'ease-out'
      });
      fadeOut.opacity(0).step();

      this.setData({
        placeholderAnimation: fadeOut.export()
      });

      // 300ms 后切换文案并淡入
      setTimeout(() => {
        const fadeIn = wx.createAnimation({
          duration: 300,
          timingFunction: 'ease-in'
        });
        fadeIn.opacity(1).step();

        this.setData({
          currentPlaceholderIndex: nextIndex,
          currentPlaceholder: this.data.placeholders[nextIndex],
          placeholderAnimation: fadeIn.export()
        });
      }, 300);
    }, 3000);
  },

  stopPlaceholderRotation() {
    if (this.placeholderTimer) {
      clearInterval(this.placeholderTimer);
      this.placeholderTimer = null;
    }
  },

  // ============ 进场动画 ============
  playEntranceAnimations() {
    // Logo 动画（延迟 200ms）
    setTimeout(() => {
      const logoAnim = wx.createAnimation({
        duration: 800,
        timingFunction: 'cubic-bezier(0.25, 0.4, 0.25, 1)'
      });
      logoAnim.opacity(1).translateY(0).scale(1).step();
      this.setData({ logoAnimation: logoAnim.export() });
    }, 200);

    // 标题动画（延迟 500ms）
    setTimeout(() => {
      const titleAnim = wx.createAnimation({
        duration: 1000,
        timingFunction: 'cubic-bezier(0.25, 0.4, 0.25, 1)'
      });
      titleAnim.opacity(1).translateY(0).step();
      this.setData({ titleAnimation: titleAnim.export() });
    }, 500);

    // Hero 区域动画（延迟 800ms）
    setTimeout(() => {
      const heroAnim = wx.createAnimation({
        duration: 800,
        timingFunction: 'ease-out'
      });
      heroAnim.opacity(1).translateY(0).step();
      this.setData({ heroAnimation: heroAnim.export() });
    }, 800);

    // 输入框动画（延迟 1100ms）
    setTimeout(() => {
      const inputAnim = wx.createAnimation({
        duration: 800,
        timingFunction: 'ease-out'
      });
      inputAnim.opacity(1).translateY(0).step();
      this.setData({ inputAnimation: inputAnim.export() });
    }, 1100);

    // 功能卡片动画（延迟 1400ms）
    setTimeout(() => {
      const featureAnim = wx.createAnimation({
        duration: 800,
        timingFunction: 'ease-out'
      });
      featureAnim.opacity(1).translateY(0).step();
      this.setData({ featureAnimation: featureAnim.export() });
    }, 1400);
  }
})
