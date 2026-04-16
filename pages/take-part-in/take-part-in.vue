<template>
  <view class="take">
    <view class="t-title">标题：{{ dateTitle }}</view>
    <view class="t-reason">选我的理由:</view>
    
    <view class="input-container">
      <textarea
        v-model="inputValue"
        class="t-input"
        :style="{ height: textareaHeight }"
        placeholder="请输入选你的理由"
        :maxlength="maxLength"
        @input="handleInput"
        @linechange="adjustTextareaHeight"
        :show-confirm-bar="false"
        :adjust-position="false"
      ></textarea>
      <view class="counter" :class="{ 'over-limit': remainingCount < 0 }">
        {{ Math.max(remainingCount, 0) }}/{{ maxLength }}
      </view>
    </view>
    
    <view class="submit-btn" 
          :class="{ disabled: isSubmitting || !inputValue.trim() }"
          @click="submitApplication">
      提交给发起人
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

// 页面数据
const dateId = ref(null);
const dateTitle = ref('');
const inputValue = ref('');
const textareaHeight = ref('200rpx');
const maxLength = 500;
const isSubmitting = ref(false);

// 剩余字数计算
const remainingCount = computed(() => {
  return maxLength - (inputValue.value?.length || 0);
});

// 调整文本域高度
const adjustTextareaHeight = (e) => {
  const lineCount = e.detail?.lineCount || 1;
  const lineHeight = 48;
  const minHeight = 200;
  
  const newHeight = Math.max(
    minHeight, 
    lineCount * lineHeight + 40
  );
  
  textareaHeight.value = `${newHeight}rpx`;
};

// 输入处理
const handleInput = (e) => {
  const value = e.detail?.value || e.target?.value || '';
  inputValue.value = value.slice(0, maxLength);
};

// 页面加载获取参数
onLoad((options) => {
  if (options && options.date_id) {
    dateId.value = options.date_id;
  }
  if (options && options.title) {
    dateTitle.value = decodeURIComponent(options.title);
  }
});

// 提交报名申请
const submitApplication = async () => {
  if (isSubmitting.value || !inputValue.value.trim()) return;
  
  isSubmitting.value = true;
  
  try {
    const token = uni.getStorageSync('token');
    const userid = uni.getStorageSync('userid');
    
    if (!token || !userid) {
      uni.showToast({ title: '请先登录', icon: 'none' });
      isSubmitting.value = false;
      return;
    }
    
    const res = await uni.request({
      url: 'http://www.gongxiangfeng.com:12100/campusnav/signUpForDate',
      method: 'POST',
      header: {
        'token': token,
        'Content-Type': 'application/json'
      },
      data: {
        userid: userid,
        date_id: dateId.value,
        reason: inputValue.value.trim()
      }
    });
    
    if (res.data.code === 0) {
      uni.showToast({ title: '报名成功', icon: 'success' });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    } else {
      uni.showToast({ 
        title: res.data.message || '报名失败', 
        icon: 'none' 
      });
    }
  } catch (error) {
    console.error('报名请求失败:', error);
    uni.showToast({ 
      title: '网络错误，请重试', 
      icon: 'none' 
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.take {
  padding: 50rpx;
  
  .t-title {
    margin-bottom: 30rpx;
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
  
  .t-reason {
    font-size: 28rpx;
    margin-bottom: 30rpx;
    color: #333;
  }

  .input-container {
    position: relative;
    margin-bottom: 40rpx;
    border-radius: 12rpx;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
  }

  .t-input {
    width: 100%;
    min-height: 200rpx;
    padding: 20rpx;
    font-size: 28rpx;
    border: 2rpx solid #e0e0e0;
    border-radius: 8rpx;
    box-sizing: border-box;
    line-height: 48rpx;
    background: #fff;
  }

  .counter {
    position: absolute;
    right: 20rpx;
    bottom: 20rpx;
    font-size: 24rpx;
    color: #999;
    background: rgba(255, 255, 255, 0.9);
    padding: 6rpx 12rpx;
    border-radius: 4rpx;
    z-index: 1;

    &.over-limit {
      color: #ff4444;
      font-weight: bold;
      &::after {
        content: '!';
        margin-left: 4rpx;
      }
    }
  }
  
  .submit-btn {
    margin: 40rpx 20rpx;
    padding: 24rpx;
    background-color: #07c160;
    color: white;
    border-radius: 12rpx;
    text-align: center;
    font-size: 32rpx;
    font-weight: bold;
    transition: all 0.3s;
    box-shadow: 0 4rpx 8rpx rgba(7, 193, 96, 0.3);
    
    &:active {
      transform: scale(0.98);
      opacity: 0.9;
    }
    
    &.disabled {
      background-color: #cccccc;
      pointer-events: none;
      opacity: 0.7;
      box-shadow: none;
    }
  }
}
</style>