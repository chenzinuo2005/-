<template>
  <view class="protocol-container">
    <!-- 协议内容 -->
    <scroll-view class="protocol-content" scroll-y>
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 错误状态 -->
      <view v-else-if="error" class="error-container">
        <text class="error-text">{{ error }}</text>
        <button class="retry-btn" @click="fetchUserProtocol">重试</button>
      </view>

      <!-- 协议内容 -->
      <view v-else-if="protocolData.length > 0" class="protocol-sections">
        <view 
          v-for="(section, index) in protocolData" 
          :key="index" 
          class="protocol-section"
        >
          <!-- 主标题 -->
          <text class="section-title">{{ section.title }}</text>
          
          <!-- 内容列表 -->
          <view class="content-list">
            <view 
              v-for="(item, itemIndex) in section.content" 
              :key="itemIndex" 
              class="content-item"
            >
              <!-- 如果有子项 -->
              <view v-if="item.subitem" class="subitem">
                <text class="subitem-text">{{ item.subitem }}</text>
              </view>
              
              <!-- 如果有项目 -->
              <view v-else-if="item.item" class="item">
                <text class="item-text">{{ item.item }}</text>
              </view>
              
              <!-- 如果有子标题和子内容 -->
              <view v-else-if="item.subtitle" class="subtitle-section">
                <text class="subtitle">{{ item.subtitle }}</text>
                <view 
                  v-for="(subcontent, subIndex) in item.subcontents" 
                  :key="subIndex" 
                  class="subcontent-item"
                >
                  <text class="subcontent-text">{{ subcontent.subitem }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-container">
        <text class="empty-text">暂无用户协议内容</text>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-actions">
      <button class="agree-btn" @click="handleAgree">同意并继续</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const loading = ref(true);
const error = ref('');
const protocolData = ref([]);

// 获取用户协议
const fetchUserProtocol = async () => {
  loading.value = true;
  error.value = '';

  try {
    const result = await uni.request({
      url: 'http://www.gongxiangfeng.com:12100/campusnav/getUserContract',
      method: 'GET',
      header: {
        'content-type': 'application/json'
      }
    });

    console.log('用户协议接口响应:', result);

    if (result.data.code === 0) {
      protocolData.value = result.data.data || [];
    } else {
      error.value = result.data.message || '获取用户协议失败';
    }
  } catch (err) {
    console.error('获取用户协议错误:', err);
    error.value = '网络错误，请重试';
  } finally {
    loading.value = false;
  }
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 同意协议
const handleAgree = () => {
  uni.showToast({
    title: '已同意用户协议',
    icon: 'success',
    duration: 1500
  });
  
  setTimeout(() => {
    uni.navigateBack();
  }, 1500);
};

onMounted(() => {
  fetchUserProtocol();
});
</script>

<style scoped>
.protocol-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f8f8;
}

/* 导航栏样式 */
.nav-bar {
  height: 88rpx;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  border-bottom: 1rpx solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-back {
  display: flex;
  align-items: center;
  color: #007AFF;
  font-size: 32rpx;
}

.back-icon {
  font-size: 48rpx;
  margin-right: 8rpx;
  line-height: 1;
}

.back-text {
  font-size: 28rpx;
}

.nav-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.nav-placeholder {
  width: 120rpx;
}

/* 协议内容区域 */
.protocol-content {
  flex: 1;
  padding: 30rpx;
  background: white;
  margin: 20rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

/* 加载状态 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

/* 错误状态 */
.error-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200rpx;
}

.error-text {
  font-size: 28rpx;
  color: #ff4d4f;
  margin-bottom: 30rpx;
  text-align: center;
}

.retry-btn {
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 20rpx;
  padding: 16rpx 40rpx;
  font-size: 28rpx;
}

/* 空状态 */
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* 协议章节样式 */
.protocol-sections {
  padding-bottom: 40rpx;
}

.protocol-section {
  margin-bottom: 40rpx;
}

.section-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
  line-height: 1.4;
  border-left: 8rpx solid #007AFF;
  padding-left: 20rpx;
}

.content-list {
  padding-left: 28rpx;
}

.content-item {
  margin-bottom: 20rpx;
}

/* 子项样式 */
.subitem {
  margin-bottom: 16rpx;
}

.subitem-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  display: block;
}

/* 项目样式 */
.item {
  margin-bottom: 16rpx;
}

.item-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  display: block;
}

/* 子标题样式 */
.subtitle-section {
  margin-bottom: 24rpx;
}

.subtitle {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
  line-height: 1.4;
}

.subcontent-item {
  margin-bottom: 12rpx;
  padding-left: 20rpx;
}

.subcontent-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  display: block;
}

/* 底部操作栏 */
.bottom-actions {
  padding: 20rpx 30rpx 40rpx;
  background: white;
  border-top: 1rpx solid #e5e5e5;
}

.agree-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #007AFF, #0056CC);
  color: white;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
}

/* 响应式调整 */
@media (max-width: 750rpx) {
  .protocol-content {
    margin: 10rpx;
    padding: 20rpx;
  }
  
  .section-title {
    font-size: 32rpx;
  }
  
  .subitem-text,
  .item-text,
  .subcontent-text {
    font-size: 26rpx;
  }
}
</style>
