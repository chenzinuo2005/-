<template>
  <view class="create-container">
    <!-- 顶部导航栏 -->
    <view class="top-navbar">
      <text class="title">创新角</text>
    </view>

    <!-- 未登录提示 -->
    <view v-if="!isLoggedIn" class="login-prompt">
      <view class="prompt-content">
        <text class="prompt-text">您还未登录，请先登录查看邀约</text>
        <button class="login-btn" @click="goToLogin">立即登录</button>
      </view>
    </view>

    <!-- 邀约列表 -->
    <scroll-view 
      v-else
      class="content-list"
      scroll-y="true"
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="dateList.length === 0 && !loading" class="empty-tip">
        暂未有用户发出邀约
      </view>
      
      <view 
        v-for="(item, index) in dateList" 
        :key="`date-${index}`"
        class="date-item"
        @click="goToDateDetail(item)"
      >
        <view class="date-header">
          <image 
            :src="getImageUrl(item.img)" 
            class="shop-image"
            mode="aspectFill"
          />
          <view class="shop-info">
            <text class="shop-name">{{ item.name }}</text>
            <text class="shop-location">{{ item.building_name }}</text>
          </view>
        </view>
        
        <view class="date-content">
          <text class="date-title">{{ item.title }}</text>
          
          <view class="date-meta">
            <view class="date-time">
              <text>{{ item.time }}</text>
            </view>
            <view class="date-participants">
              <text>最多{{ item.maxpersons }}人</text>
              <text>报名{{ item.signups }}人</text>
              <text>已确认{{ item.confirms }}人</text>
            </view>
          </view>
          
          <view class="date-details">
            <text class="date-feed">{{ item.feed }}</text>
            <text class="date-budget">人均预算￥{{ item.av_fee }}</text>
          </view>
        </view>
        
        <view v-if="loading && index === dateList.length - 1" class="loading-tip">加载中...</view>
      </view>

      <!-- 加载更多提示 -->
      <view v-if="pagination.hasMore && dateList.length > 0" class="load-more-tip">
        <text>上拉加载更多</text>
      </view>
      
      <view v-else-if="dateList.length > 0" class="no-more-tip">
        <text>没有更多数据了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';

// 状态数据
const baseImgUrl = ref('');
const dateList = ref([]);
const refreshing = ref(false);
const loading = ref(false);

// 分页数据
const pagination = ref({
  page: 1,
  size: 10,
  hasMore: true,
  isLoading: false
});

// 计算属性：检查登录状态
const isLoggedIn = computed(() => {
  const token = uni.getStorageSync('token');
  const userInfo = uni.getStorageSync('userInfo');
  return !!(token && userInfo);
});

// 获取当前用户ID
const getUserId = () => {
  const userInfo = uni.getStorageSync('userInfo');
  return userInfo ? userInfo.userid : null;
};

// 跳转到登录页面
const goToLogin = () => {
  uni.reLaunch({
    url: '/pages/login/login'
  });
};

// 获取图片完整URL
const getImageUrl = (imgPath) => {
  if (!imgPath) return '/static/default-shop.jpg';
  return baseImgUrl.value ? `${baseImgUrl.value}${imgPath}` : imgPath;
};

// 跳转到邀约详情
const goToDateDetail = (item) => {
  uni.navigateTo({
    url: `/pages/investion/investion?date_id=${item.date_id}&merchant_id=${item.merchant_id}`
  });
};

// 下拉刷新
const onRefresh = async () => {
  if (refreshing.value || !isLoggedIn.value) return;
  
  refreshing.value = true;
  
  // 重置分页数据
  pagination.value.page = 1;
  pagination.value.hasMore = true;
  
  dateList.value = [];
  await fetchDateList(true);
  
  setTimeout(() => {
    refreshing.value = false;
  }, 1000);
};

// 加载更多数据
const loadMore = async () => {
  const pageInfo = pagination.value;
  
  if (pageInfo.isLoading || !pageInfo.hasMore || !isLoggedIn.value) return;
  
  pageInfo.page += 1;
  await fetchDateList();
};

// 获取基本配置
const fetchBaseSetting = async () => {
  try {
    const userid = getUserId();
    if (!userid) {
      console.log('用户未登录，跳过获取基本配置');
      return;
    }
    
    const res = await uni.request({
      url: 'http://www.gongxiangfeng.com:12100/campusnav/getBaseSetting',
      method: 'GET',
      data: {
        userid: userid
      }
    });
    
    if (res.data.code === 0) {
      baseImgUrl.value = res.data.data.baseImgUrl;
      console.log('获取基本配置成功:', baseImgUrl.value);
    }
  } catch (error) {
    console.error('获取基本配置失败:', error);
  }
};

// 获取邀约列表
const fetchDateList = async (isRefresh = false) => {
  if (!isLoggedIn.value) {
    console.log('用户未登录，跳过获取邀约列表');
    return;
  }

  const pageInfo = pagination.value;
  if (pageInfo.isLoading) return;
  
  pageInfo.isLoading = true;
  loading.value = true;
  
  try {
    const userid = getUserId();
    if (!userid) {
      console.error('用户未登录');
      return;
    }
    
    const res = await uni.request({
      url: 'http://www.gongxiangfeng.com:12100/campusnav/getShopItemList',
      method: 'GET',
      data: {
        userid: userid,
        type: 1, // 邀约类型
        merchant_id: 0, // 所有商家
        pageno: pageInfo.page,
        pagesize: pageInfo.size
      }
    });
    
    console.log('获取邀约列表响应:', res.data);
    
    if (res.data.code === 0) {
      const newData = res.data.data || [];
      
      if (newData.length < pageInfo.size) {
        pageInfo.hasMore = false;
      }
      
      if (isRefresh || pageInfo.page === 1) {
        dateList.value = newData;
      } else {
        dateList.value = [...dateList.value, ...newData];
      }
      
      console.log(`获取邀约列表成功，当前页: ${pageInfo.page}, 数据量: ${newData.length}, 还有更多: ${pageInfo.hasMore}`);
    } else {
      console.error('获取邀约列表失败:', res.data.message);
      uni.showToast({
        title: res.data.message || '加载失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取邀约列表失败:', error);
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none'
    });
  } finally {
    pageInfo.isLoading = false;
    loading.value = false;
  }
};

// 检查并刷新数据
const checkAndRefreshData = () => {
  if (isLoggedIn.value) {
    console.log('用户已登录，刷新数据');
    fetchBaseSetting();
    fetchDateList(true);
  } else {
    console.log('用户未登录，显示登录提示');
    dateList.value = [];
  }
};

// 页面初始化
onMounted(async () => {
  console.log('创新角页面初始化');
  checkAndRefreshData();
});

onShow(() => {
  console.log('创新角页面显示');
  // 页面显示时检查登录状态并刷新数据
  checkAndRefreshData();
});
</script>

<style lang="scss" scoped>
.create-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f8f8;
}

.top-navbar {
  padding: 35px 0;
  background-color: #fff;
  text-align: center;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
  
  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
}

/* 未登录提示样式 */
.login-prompt {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 40rpx;
  
  .prompt-content {
    text-align: center;
    background: white;
    padding: 60rpx 40rpx;
    border-radius: 20rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
    
    .prompt-text {
      display: block;
      font-size: 32rpx;
      color: #666;
      margin-bottom: 40rpx;
    }
    
    .login-btn {
      background: linear-gradient(135deg, #007AFF, #0056CC);
      color: white;
      border: none;
      border-radius: 44rpx;
      padding: 20rpx 60rpx;
      font-size: 28rpx;
      font-weight: bold;
    }
  }
}

.content-list {
  flex: 1;
  padding: 20rpx;
  overflow-y: auto;
}

.empty-tip {
  text-align: center;
  padding: 60rpx;
  color: #999;
  font-size: 28rpx;
}

.loading-tip {
  text-align: center;
  padding: 20rpx;
  color: #999;
  font-size: 26rpx;
}

.load-more-tip,
.no-more-tip {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 26rpx;
}

.date-item {
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
}

.date-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  
  .shop-image {
    width: 120rpx;
    height: 120rpx;
    border-radius: 12rpx;
    margin-right: 20rpx;
    background-color: #f0f0f0;
  }
  
  .shop-info {
    flex: 1;
    
    .shop-name {
      display: block;
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 8rpx;
    }
    
    .shop-location {
      font-size: 24rpx;
      color: #666;
    }
  }
}

.date-content {
  .date-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 16rpx;
    display: block;
  }
  
  .date-meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12rpx;
    
    .date-time {
      font-size: 26rpx;
      color: #07c160;
      font-weight: bold;
    }
    
    .date-participants {
      display: flex;
      gap: 16rpx;
      font-size: 24rpx;
      color: #666;
    }
  }
  
  .date-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .date-feed {
      font-size: 26rpx;
      color: #333;
    }
    
    .date-budget {
      font-size: 26rpx;
      color: #e4393c;
      font-weight: bold;
    }
  }
}
</style>