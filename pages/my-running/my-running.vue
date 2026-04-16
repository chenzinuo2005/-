<template>
  <view class="my-running-container">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-tip">
      加载中...
    </view>

    <!-- 空状态 -->
    <view v-else-if="myRunningList.length === 0" class="empty-tip">
      <image src="/static/empty-running.png" class="empty-img" mode="widthFix"></image>
      <text class="empty-text">暂未发起任何跑腿</text>
      <button class="go-sponsor-btn" @click="goToSponsorRunning">立即发起</button>
    </view>

    <!-- 跑腿列表 -->
    <scroll-view 
      v-else 
      class="running-list"
      scroll-y="true"
      refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      refresher-background="#f8f8f8"
    >
      <view 
        v-for="(item, index) in myRunningList" 
        :key="`running-${item.running_id}-${index}`"
        class="running-item"
        @click="goToDetail(item)"
      >
        <!-- 商家图片 -->
        <image 
          :src="`${baseImgUrl}${item.merchants[0]?.img || '/static/default-shop.png'}`" 
          class="shop-img"
          mode="aspectFill"
        ></image>

        <!-- 跑腿信息 -->
        <view class="running-info">
          <!-- 商家名称（多商家加"等"） -->
          <text class="shop-name">{{ formatMerchantName(item.merchants) }}</text>
          
          <!-- 跑腿范围（多建筑物加"等"） -->
          <text class="building-range">
            范围：{{ formatBuildingName(item.buildings) }}
          </text>
          
          <!-- 销售状态 -->
          <view class="sale-status">
            <text class="sold-num">已售：{{ item.total_num }}</text>
            <text class="split">|</text>
            <text class="max-num">最多预订：{{ item.max_booknum }}</text>
          </view>
          
          <!-- 截止时间 & 状态 -->
          <view class="bottom-info">
            <text class="deadline">截止：{{ formatDate(item.deadline) }}</text>
            <text 
              class="status-tag"
              :class="{ 'status-done': item.status === '已完成', 'status-ongoing': item.status === '进行中' }"
            >
              {{ item.status }}
            </text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
// 1. 导入 Vue 核心 API 和 uni-app 生命周期函数
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app'; // 修复：导入 onLoad
import { uniRequest } from '@/utils/request';

// 2. 响应式数据
const myRunningList = ref([]); // 用户发起的跑腿列表
const loading = ref(true); // 加载状态
const refreshing = ref(false); // 下拉刷新状态
const baseImgUrl = ref(''); // 图片基地址（从getBaseSetting获取）
const userid = ref(''); // 用户ID（登录后缓存）
const schoolid = ref(''); // 学校ID（登录后缓存）

// 3. 页面加载生命周期：现在已正确导入
onLoad(() => {
  // 从缓存获取用户信息（登录后必存，参考接口文档登录返回的userid/schoolid）
  const cachedUserid = uni.getStorageSync('userid');
  const cachedSchoolid = uni.getStorageSync('schoolid');
  const cachedToken = uni.getStorageSync('token');

  // 未登录拦截（符合页面文档"未登录时隐藏功能"的要求）
  if (!cachedUserid || !cachedSchoolid || !cachedToken) {
    uni.showToast({
      title: '请先登录',
      icon: 'none',
      duration: 2000
    });
    setTimeout(() => uni.navigateTo({ url: '/pages/login/login' }), 2000);
    return;
  }

  // 赋值用户信息
  userid.value = cachedUserid;
  schoolid.value = cachedSchoolid;

  // 初始化数据（先获取图片基地址，再获取跑腿列表）
  initPageData();
});

// 4. 初始化页面数据
const initPageData = async () => {
  try {
    // 4.1 调用接口：获取基本配置（图片基地址，参考接口文档7）
    await getBaseSetting();
    // 4.2 调用接口：获取用户发起的跑腿列表（核心接口，参考接口文档21）
    await getMyRunningList();
  } catch (error) {
    console.error('初始化我的跑腿页面失败：', error);
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none',
      duration: 3000
    });
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

// 5. 接口请求：获取基本配置（图片基地址，参考接口文档7）
const getBaseSetting = async () => {
  const res = await uniRequest({
    url: '/getBaseSetting',
    method: 'GET',
    data: { userid: userid.value },
    header: { 
      token: uni.getStorageSync('token')
    }
  });

  if (res.code === 0 && res.data?.baseImgUrl) {
    baseImgUrl.value = res.data.baseImgUrl;
  } else {
    console.error('获取图片基地址失败：', res.message);
    // 降级处理：使用默认图片地址
    baseImgUrl.value = 'http://www.gongxiangfeng.com:12100/campusnav/static/';
  }
};

// 6. 接口请求：获取用户发起的跑腿列表（核心接口，参考接口文档21）
const getMyRunningList = async () => {
  const res = await uniRequest({
    url: '/getMyRunningList',
    method: 'GET',
    data: {
      userid: userid.value,
      schoolid: schoolid.value
    },
    header: { token: uni.getStorageSync('token') }
  });

  if (res.code === 0) {
    // 处理返回数据（符合页面文档"多商家/多建筑物加等"的要求）
    myRunningList.value = res.data || [];
  } else {
    throw new Error(res.message || '获取跑腿列表失败');
  }
};

// 7. 下拉刷新触发
const onRefresh = async () => {
  refreshing.value = true;
  await getMyRunningList();
  refreshing.value = false;
};

// 8. 跳转至"我的跑腿详情"页（参考页面文档4.1.1）
const goToDetail = (item) => {
  uni.navigateTo({
    url: `/pages/my-running-detail/my-running-detail?` +
      `running_id=${item.running_id}&` +
      `userid=${userid.value}&` +
      `schoolid=${schoolid.value}`
  });
};

// 9. 跳转至"发起跑腿"页（参考页面文档2.2.1）
const goToSponsorRunning = () => {
  uni.navigateTo({ url: '/pages/gorun/gorun' });
};

// 10. 辅助函数：处理商家名称（多商家加"等"，符合页面文档要求）
const formatMerchantName = (merchants) => {
  if (!merchants || merchants.length === 0) return '未知商家';
  return merchants.length > 1 
    ? `${merchants[0].name} 等${merchants.length}家` 
    : merchants[0].name;
};

// 11. 辅助函数：处理跑腿范围（多建筑物加"等"，符合页面文档要求）
const formatBuildingName = (buildings) => {
  if (!buildings || buildings.length === 0) return '未知范围';
  return buildings.length > 1 
    ? `${buildings[0].running_for_building_name} 等${buildings.length}栋` 
    : buildings[0].running_for_building_name;
};

// 12. 辅助函数：格式化日期（符合页面文档显示格式）
const formatDate = (dateStr) => {
  if (!dateStr) return '未知时间';
  // 接口返回格式为"3月20日 周三 12:00"（参考接口文档21），直接显示
  return dateStr;
};
</script>

<style lang="scss" scoped>
.my-running-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding-bottom: 30rpx;
}

.top-bar {
  padding: 30rpx 0;
  background-color: #fff;
  text-align: center;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
  
  .title {
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
  }
}

.loading-tip {
  text-align: center;
  padding: 80rpx 0;
  font-size: 28rpx;
  color: #999;
}

.empty-tip {
  text-align: center;
  padding: 60rpx 0;
  
  .empty-img {
    width: 240rpx;
    margin-bottom: 30rpx;
    opacity: 0.6;
  }
  
  .empty-text {
    display: block;
    font-size: 28rpx;
    color: #999;
    margin-bottom: 40rpx;
  }
  
  .go-sponsor-btn {
    background-color: #1aad19;
    color: #fff;
    font-size: 28rpx;
    width: 50%;
    height: 80rpx;
    line-height: 80rpx;
    border-radius: 40rpx;
  }
}

.running-list {
  padding: 20rpx;
}

.running-item {
  display: flex;
  align-items: flex-start;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.shop-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  margin-right: 24rpx;
}

.running-info {
  flex: 1;
  overflow: hidden;
}

.shop-name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.building-range {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.sale-status {
  display: flex;
  gap: 20rpx;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.bottom-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .deadline {
    font-size: 22rpx;
    color: #999;
  }
  
  .status-tag {
    padding: 6rpx 16rpx;
    border-radius: 20rpx;
    font-size: 22rpx;
    font-weight: 500;
  }
  
  .status-done {
    background-color: rgba(26, 173, 25, 0.1);
    color: #1aad19;
  }
  
  .status-ongoing {
    background-color: rgba(255, 122, 69, 0.1);
    color: #ff7a45;
  }
}
</style>