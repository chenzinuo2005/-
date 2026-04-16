<template>
  <view class="my-running-detail-container">
    <!-- 排序方式选择 -->
    <view class="sort-tabs">
      <view 
        class="sort-tab"
        :class="{ active: orderBy === 1 }"
        @click="changeOrderBy(1)"
      >
        <text>按商家排</text>
      </view>
      <view 
        class="sort-tab"
        :class="{ active: orderBy === 2 }"
        @click="changeOrderBy(2)"
      >
        <text>按预订者地址排</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-tip">
      <text>加载中...</text>
    </view>

    <!-- 空状态 -->
    <view v-else-if="!runningDetail || (orderBy === 1 && (!runningDetail.merchants || runningDetail.merchants.length === 0)) || (orderBy === 2 && (!runningDetail.buildings || runningDetail.buildings.length === 0))" class="empty-tip">
      <image src="/static/empty-order.png" class="empty-img" mode="widthFix"></image>
      <text class="empty-text">暂无订单信息</text>
    </view>

    <!-- 跑腿详情内容 -->
    <scroll-view v-else class="content" scroll-y>
      <!-- 按商家排序显示 -->
      <view v-if="orderBy === 1 && runningDetail.merchants" class="merchant-list">
        <view 
          v-for="merchant in runningDetail.merchants" 
          :key="merchant.merchant_id"
          class="merchant-section"
        >
          <!-- 商家头部 -->
          <view class="merchant-header">
            <view class="merchant-info">
              <text class="merchant-name">{{ merchant.name }}</text>
              <text class="merchant-building">{{ merchant.buildingname }}</text>
            </view>
            <view class="merchant-total">
              <text class="total-text">预订总数：{{ calculateMerchantTotal(merchant) }}</text>
            </view>
          </view>

          <!-- 菜品列表 -->
          <view class="dish-list">
            <view 
              v-for="dish in merchant.dishes" 
              :key="dish.dish_id"
              class="dish-section"
            >
              <view class="dish-header">
                <image 
                  :src="`${baseImgUrl}${dish.img}`" 
                  class="dish-img"
                  mode="aspectFill"
                ></image>
                <view class="dish-info">
                  <text class="dish-name">{{ dish.title }}</text>
                  <text v-if="dish.num_in_short" class="short-num">差{{ dish.num_in_short }}件可享下一价格</text>
                </view>
                <text class="dish-total">共{{ dish.total_num }}件</text>
              </view>

              <!-- 订单列表 -->
              <view class="order-list">
                <view 
                  v-for="order in dish.orders" 
                  :key="order.order_id"
                  class="order-item"
                  @click="goToOrderDetail(order)"
                >
                  <view class="order-main">
                    <text class="order-quantity">数量{{ order.num }}</text>
                    <text class="order-spec">{{ order.spec_name }}</text>
                    <text class="order-user">{{ order.username }}</text>
                    <text class="order-address">{{ order.buildingname }}{{ order.room }}</text>
                  </view>
                  <view class="order-status">
                    <text 
                      class="status-tag"
                      :class="{
                        'status-delivered': order.status === '已派送',
                        'status-pending': order.status === '待派送'
                      }"
                    >
                      {{ order.status }}
                    </text>
                    <uni-icons type="right" size="16" color="#999"></uni-icons>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 按预订者地址排序显示 -->
      <view v-if="orderBy === 2 && runningDetail.buildings" class="building-list">
        <view 
          v-for="building in runningDetail.buildings" 
          :key="building.building_id"
          class="building-section"
        >
          <!-- 建筑物头部 -->
          <view class="building-header">
            <text class="building-name">{{ building.buildingname }}</text>
          </view>

          <!-- 菜品列表 -->
          <view class="dish-list">
            <view 
              v-for="dish in building.dishes" 
              :key="`${dish.dish_id}-${dish.merchant_id}`"
              class="dish-section"
            >
              <view class="dish-header">
                <image 
                  :src="`${baseImgUrl}${dish.img}`" 
                  class="dish-img"
                  mode="aspectFill"
                ></image>
                <view class="dish-info">
                  <text class="dish-name">{{ dish.title }}</text>
                  <text class="merchant-info">{{ dish.name }} · {{ dish.buildingname }}</text>
                  <text v-if="dish.num_in_short" class="short-num">差{{ dish.num_in_short }}件可享下一价格</text>
                </view>
              </view>

              <!-- 订单列表 -->
              <view class="order-list">
                <view 
                  v-for="order in dish.orders" 
                  :key="order.order_id"
                  class="order-item"
                  @click="goToOrderDetail(order)"
                >
                  <view class="order-main">
                    <text class="order-quantity">数量{{ order.num }}</text>
                    <text class="order-spec">{{ order.spec_name }}</text>
                    <text class="order-user">{{ order.username }}</text>
                    <text class="order-room">{{ order.room }}</text>
                  </view>
                  <view class="order-status">
                    <text 
                      class="status-tag"
                      :class="{
                        'status-delivered': order.status === '已派送',
                        'status-pending': order.status === '待派送'
                      }"
                    >
                      {{ order.status }}
                    </text>
                    <uni-icons type="right" size="16" color="#999"></uni-icons>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
// 修正：从 vue 导入 ref，从 uni-app 导入 onLoad
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { uniRequest } from '@/utils/request';

// 响应式数据
const runningDetail = ref(null); // 跑腿详情数据
const loading = ref(true); // 加载状态
const orderBy = ref(1); // 排序方式：1-按商家，2-按地址
const baseImgUrl = ref(''); // 图片基地址

// 页面参数
const runningId = ref(''); // 跑腿ID
const userid = ref(''); // 用户ID
const schoolid = ref(''); // 学校ID

// 页面加载
onLoad((options) => {
  // 获取页面参数
  runningId.value = options.running_id;
  userid.value = options.userid;
  schoolid.value = options.schoolid;

  // 初始化数据
  initPageData();
});

// 初始化页面数据
const initPageData = async () => {
  try {
    // 获取基本配置（图片基地址）
    await getBaseSetting();
    
    // 获取跑腿详情
    await getMyRunningDetail();
  } catch (error) {
    console.error('初始化跑腿详情页面失败：', error);
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none',
      duration: 3000
    });
  } finally {
    loading.value = false;
  }
};

// 获取基本配置（图片基地址）
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
    // 降级处理
    baseImgUrl.value = 'http://www.gongxiangfeng.com:12100/campusnav/static/';
  }
};

// 获取我的跑腿详情
const getMyRunningDetail = async () => {
  const res = await uniRequest({
    url: '/getMyRunningDetail',
    method: 'GET',
    data: {
      userid: userid.value,
      schoolid: schoolid.value,
      running_id: runningId.value,
      orderby: orderBy.value
    },
    header: { token: uni.getStorageSync('token') }
  });

  if (res.code === 0) {
    runningDetail.value = res.data;
  } else {
    throw new Error(res.message || '获取跑腿详情失败');
  }
};

// 切换排序方式
const changeOrderBy = async (type) => {
  if (orderBy.value === type) return;
  
  orderBy.value = type;
  loading.value = true;
  
  try {
    await getMyRunningDetail();
  } catch (error) {
    console.error('切换排序方式失败：', error);
    uni.showToast({
      title: '切换失败，请重试',
      icon: 'none',
      duration: 2000
    });
  } finally {
    loading.value = false;
  }
};

// 计算商家总订单数
const calculateMerchantTotal = (merchant) => {
  if (!merchant.dishes) return 0;
  
  return merchant.dishes.reduce((total, dish) => {
    return total + (dish.total_num || 0);
  }, 0);
};

// 跳转到订单详情
const goToOrderDetail = (order) => {
  uni.navigateTo({
    url: `/pages/my-running-order-detail/my-running-order-detail?` +
      `order_id=${order.order_id}&` +
      `running_id=${runningId.value}&` +
      `userid=${userid.value}&` +
      `schoolid=${schoolid.value}`
  });
};

// 返回上一页
const navigateBack = () => {
  uni.navigateBack();
};
</script>

<style lang="scss" scoped>
.my-running-detail-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f8f8;
}

.navbar {
  display: flex;
  align-items: center;
  padding: 15px 16px;
  background-color: #fff;
  border-bottom: 1px solid #eee;

  .back-btn {
    margin-right: 16px;
  }

  .title {
    flex: 1;
    text-align: center;
    font-size: 18px;
    font-weight: 500;
  }
}

.sort-tabs {
  display: flex;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  
  .sort-tab {
    flex: 1;
    text-align: center;
    padding: 12px 0;
    font-size: 14px;
    color: #666;
    position: relative;
    
    &.active {
      color: #1aad19;
      font-weight: 500;
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 2px;
        background-color: #1aad19;
      }
    }
  }
}

.loading-tip {
  text-align: center;
  padding: 40px 0;
  font-size: 14px;
  color: #999;
}

.empty-tip {
  text-align: center;
  padding: 60px 20px;
  
  .empty-img {
    width: 120px;
    margin-bottom: 20px;
    opacity: 0.6;
  }
  
  .empty-text {
    display: block;
    font-size: 14px;
    color: #999;
  }
}

.content {
  flex: 1;
}

// 商家列表样式
.merchant-list {
  padding: 16px;
}

.merchant-section {
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.merchant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  
  .merchant-info {
    .merchant-name {
      display: block;
      font-size: 16px;
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }
    
    .merchant-building {
      font-size: 12px;
      color: #666;
    }
  }
  
  .merchant-total {
    .total-text {
      font-size: 14px;
      color: #1aad19;
      font-weight: 500;
    }
  }
}

// 建筑物列表样式
.building-list {
  padding: 16px;
}

.building-section {
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.building-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  
  .building-name {
    font-size: 16px;
    font-weight: 500;
    color: #333;
  }
}

// 菜品列表通用样式
.dish-list {
  padding: 0 16px 16px;
}

.dish-section {
  margin-top: 16px;
  
  &:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 16px;
  }
}

.dish-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  
  .dish-img {
    width: 60px;
    height: 60px;
    border-radius: 6px;
    margin-right: 12px;
  }
  
  .dish-info {
    flex: 1;
    
    .dish-name {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }
    
    .merchant-info {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    
    .short-num {
      display: block;
      font-size: 12px;
      color: #ff6b35;
    }
  }
  
  .dish-total {
    font-size: 14px;
    color: #666;
    font-weight: 500;
  }
}

// 订单列表样式
.order-list {
  background-color: #f9f9f9;
  border-radius: 6px;
  overflow: hidden;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
  
  .order-main {
    flex: 1;
    
    .order-quantity {
      display: block;
      font-size: 14px;
      color: #333;
      margin-bottom: 4px;
    }
    
    .order-spec {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    
    .order-user {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    
    .order-address, .order-room {
      display: block;
      font-size: 12px;
      color: #999;
    }
  }
  
  .order-status {
    display: flex;
    align-items: center;
    
    .status-tag {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      margin-right: 8px;
    }
    
    .status-delivered {
      background-color: rgba(26, 173, 25, 0.1);
      color: #1aad19;
    }
    
    .status-pending {
      background-color: rgba(255, 122, 69, 0.1);
      color: #ff7a45;
    }
  }
}
</style>