<template>
  <view class="bind-school-container">

    <!-- 当前绑定信息 -->
    <view class="current-school" v-if="currentSchool">
      <text class="section-title">当前绑定学校</text>
      <view class="school-card">
        <view class="school-info">
          <text class="school-name">{{ currentSchool.schoolname }}</text>
          <text class="school-id">学校ID: {{ currentSchool.schoolid }}</text>
        </view>
        <view class="bind-status">
          <text class="status-text">已绑定</text>
        </view>
      </view>
    </view>

    <!-- 无绑定学校时的提示 -->
    <view class="no-school" v-else>
      <text class="section-title">学校信息</text>
      <view class="empty-card">
        <text class="empty-icon">🏫</text>
        <text class="empty-title">暂未绑定学校</text>
        <text class="empty-desc">请先登录或注册账号</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-section">
      <button 
        class="bind-btn" 
        :class="{ disabled: !currentSchool }"
        :disabled="!currentSchool"
        @click="handleRebind"
      >
        {{ loading ? '处理中...' : '重新绑定' }}
      </button>
    </view>

    <!-- 提示信息 -->
    <view class="tips-section">
      <text class="tips-title">绑定说明</text>
      <text class="tips-content">• 学校信息在登录或注册时自动绑定</text>
      <text class="tips-content">• 如需更换学校，请重新注册或联系管理员</text>
      <text class="tips-content">• 绑定学校后，您将看到该学校的商家、活动等信息</text>
    </view>
  </view>
</template>

<script>
import store from '@/utils/store.js';

export default {
  data() {
    return {
      currentSchool: null,
      loading: false
    }
  },
  
  onLoad() {
    this.loadCurrentSchool();
  },
  
  methods: {
    loadCurrentSchool() {
      const userInfo = store.userInfo;
      if (userInfo && userInfo.schoolid && userInfo.schoolname) {
        this.currentSchool = {
          schoolid: userInfo.schoolid,
          schoolname: userInfo.schoolname
        };
      }
    },
    
    async handleRebind() {
      if (!this.currentSchool) {
        uni.showToast({
          title: '暂无学校信息',
          icon: 'none'
        });
        return;
      }

      this.loading = true;

      try {
        // 由于没有更换学校的接口，这里只能提示用户
        uni.showModal({
          title: '提示',
          content: '更换学校需要重新注册账号，是否前往注册页面？',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/login/login?type=register'
              });
            }
          }
        });

      } catch (error) {
        console.error('操作失败:', error);
        uni.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    goBack() {
      uni.navigateBack();
    }
  }
}
</script>

<style lang="scss" scoped>
.bind-school-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx 30rpx 20rpx;
  background: white;
  border-bottom: 1rpx solid #f0f0f0;
}

.nav-back {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.back-icon {
  font-size: 48rpx;
  color: #333;
}

.back-text {
  font-size: 28rpx;
  color: #333;
}

.nav-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.nav-placeholder {
  width: 120rpx;
}

.current-school, .no-school {
  padding: 30rpx;
  background: white;
  margin-bottom: 20rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.school-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
  border: 1rpx solid #e9ecef;
}

.school-info {
  flex: 1;
}

.school-name {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.school-id {
  display: block;
  font-size: 24rpx;
  color: #666;
}

.bind-status {
  background: #28a745;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
}

.status-text {
  font-size: 24rpx;
  color: white;
  font-weight: bold;
}

.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 30rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
  border: 1rpx solid #e9ecef;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-title {
  display: block;
  font-size: 32rpx;
  color: #333;
  margin-bottom: 12rpx;
}

.empty-desc {
  display: block;
  font-size: 26rpx;
  color: #666;
  text-align: center;
}

.action-section {
  padding: 30rpx;
  background: white;
}

.bind-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #007AFF, #0056CC);
  color: white;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.bind-btn.disabled {
  background: #ccc;
  color: #999;
}

.tips-section {
  padding: 30rpx;
  background: white;
  margin-top: 20rpx;
}

.tips-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.tips-content {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 12rpx;
  line-height: 1.5;
}
</style>