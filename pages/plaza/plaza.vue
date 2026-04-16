<template>
  <view class="plaza-container">
    <!-- 顶部导航栏 -->
    <view class="top-navbar">
      <text class="title">广场</text>
    </view>

    <!-- 标签切换 -->
    <view class="tabs">
      <view 
        :class="['tab', activeTab === 'groupbuy' ? 'active' : '']"
        @click="switchTab('groupbuy')"
      >
        团购
      </view>
      <view 
        :class="['tab', activeTab === 'running' ? 'active' : '']"
        @click="switchTab('running')"
      >
        跑腿
      </view>
    </view>

    <!-- 团购列表 -->
    <scroll-view 
      v-if="activeTab === 'groupbuy'" 
      class="content-list"
      scroll-y="true"
      @scrolltolower="loadMore('groupbuy')"
      :refresher-enabled="true"
      :refresher-triggered="refreshing.groupbuy"
      @refresherrefresh="onRefresh('groupbuy')"
      refresher-background="#f8f8f8"
    >
      <view v-if="groupbuyList.length === 0 && !loading.groupbuy" class="empty-tip">
        暂未有团购活动
      </view>
      
      <view 
        v-for="(item, index) in groupbuyList" 
        :key="`groupbuy-${index}`"
        class="shop-item"
        @click="goToBuyPage(item, 'groupbuy')"
      >
        <view class="shop-header">
          <image 
            :src="baseImgUrl + item.img" 
            class="shop-image"
            mode="aspectFill"
          />
          <view class="shop-info">
            <text class="shop-name">{{ item.name }}</text>
            <text class="shop-location">{{ item.building_name }}</text>
          </view>
        </view>
        
        <view class="item-details">
          <text class="item-title">{{ item.title }}</text>
          <view class="sale-info">
            <text>已售{{ item.sold_totalnum || item.sold_num }}</text>
            <text v-if="item.is_presale">预售截止：{{ formatDate(item.deadline) }}</text>
          </view>
          <view class="price-info">
            <text>目前价格：{{ item.price }}元</text>
            <text v-if="item.num_in_short > 0">差{{ item.num_in_short }}件{{ item.next_price }}元</text>
          </view>
        </view>
      </view>
      
      <view v-if="loading.groupbuy && groupbuyList.length > 0" class="loading-tip">加载更多...</view>
    </scroll-view>

    <!-- 跑腿列表 -->
    <scroll-view 
      v-else 
      class="content-list"
      scroll-y="true"
      @scrolltolower="loadMore('running')"
      :refresher-enabled="true"
      :refresher-triggered="refreshing.running"
      @refresherrefresh="onRefresh('running')"
      refresher-background="#f8f8f8"
    >
      <view v-if="runningList.length === 0 && !loading.running" class="empty-tip">
        暂未有人发起跑腿
      </view>
      
      <view 
        v-for="(item, index) in runningList" 
        :key="`running-${index}`"
        class="shop-item"
        @click="goToBuyPage(item, 'running')"
      >
        <view class="shop-header">
          <image 
            :src="baseImgUrl + item.img" 
            class="shop-image"
            mode="aspectFill"
          />
          <view class="shop-info">
            <text class="shop-name">{{ item.name }}</text>
            <text class="shop-location">{{ item.building_name }}</text>
          </view>
        </view>
        
        <view class="item-details">
          <text class="item-title">{{ item.title }}</text>
          <view class="runner-info">
            <text>腿长：{{ item.running_username }}</text>
          </view>
          <view class="sale-info">
            <text>已售{{ item.sold_num }}</text>
            <text>截止：{{ formatDate(item.deadline) }}</text>
          </view>
          <view class="price-info">
            <text>目前价格：{{ item.price }}元</text>
            <text v-if="item.num_in_short > 0">差{{ item.num_in_short }}件{{ item.next_price }}元</text>
          </view>
        </view>
      </view>
      
      <view v-if="loading.running && runningList.length > 0" class="loading-tip">加载更多...</view>
      
      <button 
        class="launch-button" 
        @click="goToSponsorRunning" 
        v-if="activeTab === 'running'"
      >
        发起跑腿
      </button>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { onShow, onHide } from '@dcloudio/uni-app';

// 状态数据
const activeTab = ref('groupbuy');
const baseImgUrl = ref('');
const groupbuyList = ref([]);
const runningList = ref([]);
const refreshing = ref({
  groupbuy: false,
  running: false
});
const loading = ref({
  groupbuy: false,
  running: false
});

// 分页数据
const pagination = ref({
  groupbuy: {
    page: 1,
    size: 10,
    hasMore: true,
    isLoading: false
  },
  running: {
    page: 1,
    size: 10,
    hasMore: true,
    isLoading: false
  }
});

// 防止重复请求的标记
let isRequesting = false;

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    // 处理各种日期格式
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // 返回原字符串如果无法解析
    }
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  } catch (error) {
    return dateString;
  }
};

// 跳转到购买页面
const goToBuyPage = (item, type) => {
  // 根据类型设置不同的参数
  let params = {};
  let targetUrl = '';
  
  if (type === 'groupbuy') {
    params = {
      groupbuy_id: item.groupbuy_id,
      merchant_id: item.merchant_id
    };
    targetUrl = '/pages/buy/buy'; // 团购类型跳转到buy页面
  } else if (type === 'running') {
    params = {
      running_id: item.running_id,
      merchant_id: item.merchant_id,
      type: 'running'
    };
    targetUrl = '/pages/runner/runner'; // 保持跑腿类型原跳转路径
  }
  
  // 构建查询字符串
  const queryString = Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  // 跳转到目标页面
  uni.navigateTo({
    url: `${targetUrl}?${queryString}`
  });
};

// 监听刷新事件
const setupRefreshListener = () => {
  uni.$on('runningListShouldRefresh', () => {
    console.log('收到刷新跑腿列表事件');
    if (activeTab.value === 'running') {
      // 重置分页并重新加载
      pagination.value.running.page = 1;
      pagination.value.running.hasMore = true;
      runningList.value = [];
      fetchRunningList(true);
    }
  });
};

// 移除事件监听
const removeRefreshListener = () => {
  uni.$off('runningListShouldRefresh');
};

// 下拉刷新
const onRefresh = async (type) => {
  if (refreshing.value[type]) return;
  
  refreshing.value[type] = true;
  
  // 重置分页数据
  pagination.value[type].page = 1;
  pagination.value[type].hasMore = true;
  
  if (type === 'groupbuy') {
    groupbuyList.value = [];
    await fetchGroupbuyList(true);
  } else {
    runningList.value = [];
    await fetchRunningList(true);
  }
  
  setTimeout(() => {
    refreshing.value[type] = false;
  }, 1000);
};

// 切换标签页
const switchTab = async (tab) => {
  if (activeTab.value === tab) return;
  
  activeTab.value = tab;
  
  // 如果当前标签页没有数据，则加载数据
  if (tab === 'groupbuy' && groupbuyList.value.length === 0) {
    await fetchGroupbuyList();
  } else if (tab === 'running' && runningList.value.length === 0) {
    await fetchRunningList();
  }
};

// 获取基本配置
const fetchBaseSetting = async () => {
  try {
    const res = await uni.request({
      url: 'http://www.gongxiangfeng.com:12100/campusnav/getBaseSetting',
      method: 'GET'
    });
    
    if (res.data.code === 0) {
      baseImgUrl.value = res.data.data.baseImgUrl;
    }
  } catch (error) {
    console.error('获取基本配置失败:', error);
  }
};

// 加载更多数据
const loadMore = async (type) => {
  const pageInfo = pagination.value[type];
  
  if (pageInfo.isLoading || !pageInfo.hasMore) return;
  
  pageInfo.page += 1;
  
  if (type === 'groupbuy') {
    await fetchGroupbuyList();
  } else {
    await fetchRunningList();
  }
};

// 获取团购列表
const fetchGroupbuyList = async (isRefresh = false) => {
  if (isRequesting) return;
  
  const pageInfo = pagination.value.groupbuy;
  if (pageInfo.isLoading) return;
  
  pageInfo.isLoading = true;
  loading.value.groupbuy = true;
  isRequesting = true;
  
  try {
    const res = await uni.request({
      url: 'http://www.gongxiangfeng.com:12100/campusnav/getShopItemList',
      method: 'GET',
      data: {
        userid: uni.getStorageSync('userid'),
        type: 2, // 团购类型
        merchant_id: 0, // 所有商家
        pageno: pageInfo.page,
        pagesize: pageInfo.size
      }
    });
    
    if (res.data.code === 0) {
      const newData = res.data.data || [];
      
      if (newData.length < pageInfo.size) {
        pageInfo.hasMore = false;
      }
      
      if (isRefresh || pageInfo.page === 1) {
        groupbuyList.value = newData;
      } else {
        groupbuyList.value = [...groupbuyList.value, ...newData];
      }
    }
  } catch (error) {
    console.error('获取团购列表失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    });
  } finally {
    pageInfo.isLoading = false;
    loading.value.groupbuy = false;
    isRequesting = false;
  }
};

// 获取跑腿列表
const fetchRunningList = async (isRefresh = false) => {
  if (isRequesting) return;
  
  const pageInfo = pagination.value.running;
  if (pageInfo.isLoading) return;
  
  pageInfo.isLoading = true;
  loading.value.running = true;
  isRequesting = true;
  
  try {
    const userid = uni.getStorageSync('userid');
    console.log('获取跑腿列表，userid:', userid);
    
    const res = await uni.request({
      url: 'http://www.gongxiangfeng.com:12100/campusnav/getShopItemList',
      method: 'GET',
      data: {
        userid: userid,
        type: 3, // 跑腿类型
        merchant_id: 0, // 所有商家
        pageno: pageInfo.page,
        pagesize: pageInfo.size
      }
    });
    
    console.log('跑腿列表API响应:', res);
    
    if (res.data.code === 0) {
      const newData = res.data.data || [];
      console.log('获取到的跑腿数据:', newData);
      
      if (newData.length < pageInfo.size) {
        pageInfo.hasMore = false;
      }
      
      if (isRefresh || pageInfo.page === 1) {
        runningList.value = newData;
      } else {
        runningList.value = [...runningList.value, ...newData];
      }
      
      console.log('更新后的跑腿列表:', runningList.value);
    } else {
      console.log('获取跑腿列表失败:', res.data.message);
      uni.showToast({
        title: res.data.message || '加载失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取跑腿列表失败:', error);
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    });
  } finally {
    pageInfo.isLoading = false;
    loading.value.running = false;
    isRequesting = false;
  }
};

// 跳转发起跑腿
const goToSponsorRunning = () => {
  uni.navigateTo({
    url: '/pages/gorun/gorun'
  });
};

// 页面初始化
onMounted(async () => {
  await fetchBaseSetting();
  await fetchGroupbuyList();
  setupRefreshListener(); // 添加事件监听
});

onShow(() => {
  console.log('广场页面显示');
  // 页面显示时检查是否需要刷新数据
  if (activeTab.value === 'running') {
    // 可以添加逻辑检查是否需要刷新，比如时间间隔等
    const lastRefreshTime = uni.getStorageSync('lastRunningRefreshTime');
    const currentTime = new Date().getTime();
    if (!lastRefreshTime || (currentTime - lastRefreshTime) > 60000) { // 1分钟刷新一次
      fetchRunningList(true);
      uni.setStorageSync('lastRunningRefreshTime', currentTime);
    }
  }
});

onHide(() => {
  console.log('页面隐藏');
});

onUnmounted(() => {
  // 清理工作
  removeRefreshListener(); // 移除事件监听
  groupbuyList.value = [];
  runningList.value = [];
});
</script>

<style lang="scss" scoped>
.plaza-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f8f8;
}

.top-navbar {
  padding: 60rpx 0;
  background-color: #fff;
  text-align: center;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
  
  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
}

.tabs {
  display: flex;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
  
  .tab {
    flex: 1;
    padding: 24rpx 0;
    text-align: center;
    font-size: 32rpx;
    color: #666;
    
    &.active {
      color: #07c160;
      font-weight: bold;
      border-bottom: 4rpx solid #07c160;
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

.shop-item {
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
}

.shop-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  
  .shop-image {
    width: 120rpx;
    height: 120rpx;
    border-radius: 12rpx;
    margin-right: 20rpx;
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

.item-details {
  .item-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 12rpx;
    display: block;
  }
  
  .runner-info {
    font-size: 26rpx;
    color: #666;
    margin-bottom: 12rpx;
  }
  
  .sale-info {
    display: flex;
    justify-content: space-between;
    font-size: 24rpx;
    color: #666;
    margin-bottom: 8rpx;
  }
  
  .price-info {
    display: flex;
    justify-content: space-between;
    font-size: 28rpx;
    color: #e4393c;
    font-weight: bold;
  }
} 

.launch-button {
  position: fixed;
  bottom: 120rpx; /* 距离底部的距离，留出tabBar空间 */
  left: 48%;
  transform: translateX(-50%);
  background-color: #07c160;
  color: #fff;
  border-radius: 40rpx;
  width: 80%;
  font-size: 32rpx;
  height: 80rpx;
  line-height: 80rpx;
  z-index: 99; /* 确保按钮在其他内容上方 */
  box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.3); /* 添加阴影增强视觉效果 */
}
</style>