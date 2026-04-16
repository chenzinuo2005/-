<template>
  <view class="orders-container">
    <!-- 顶部选项卡 -->
    <view class="tab-bar">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'running' }"
        @click="switchTab('running')"
      >
        <text class="tab-text">跑腿</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'groupbuy' }"
        @click="switchTab('groupbuy')"
      >
        <text class="tab-text">团购</text>
      </view>
    </view>

    <!-- 订单列表 -->
    <view class="orders-list">
      <!-- 跑腿订单 -->
      <view v-if="activeTab === 'running' && runningOrders.length > 0" class="order-section">
        <view 
          v-for="order in runningOrders" 
          :key="order.running_id"
          class="order-card"
          @click="goToRunningDetail(order)"
        >
          <view class="order-header">
            <text class="merchant-name">{{ getFirstMerchantName(order.merchants) }}</text>
            <text class="order-status" :class="getStatusClass(order.status)">{{ order.status }}</text>
          </view>
          
          <view class="order-content">
            <image 
              :src="baseImgUrl + (order.merchants[0]?.img || '')" 
              class="product-img"
              v-if="order.merchants[0]?.img"
            ></image>
            <view class="order-details">
              <text class="product-name">跑腿服务</text>
              <text class="building-info">范围：{{ getBuildingNames(order.buildings) }}</text>
              <view class="price-info">
                <text class="quantity">已售：{{ order.total_num }}/{{ order.max_booknum }}</text>
              </view>
              <text class="deadline">截止：{{ order.deadline }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 团购订单 -->
      <view v-if="activeTab === 'groupbuy' && groupbuyOrders.length > 0" class="order-section">
        <view 
          v-for="order in groupbuyOrders" 
          :key="order.order_id"
          class="order-card"
          @click="goToGroupbuyDetail(order)"
        >
          <view class="order-header">
            <text class="merchant-name">{{ order.merchant_name }}</text>
            <text class="order-status" :class="getStatusClass(order.status)">{{ order.status }}</text>
          </view>
          
          <view class="order-content">
            <image 
              :src="baseImgUrl + order.product_img" 
              class="product-img"
              v-if="order.product_img"
            ></image>
            <view class="order-details">
              <text class="product-name">{{ order.product_name }}</text>
              <text class="spec-info">{{ order.spec_name }}</text>
              <view class="price-info">
                <text class="current-price">单价：¥{{ order.unit_price }}</text>
                <text class="quantity">数量：{{ order.quantity }}</text>
              </view>
              <text class="total-price">总价：¥{{ order.total_price }}</text>
              <text class="order-date">{{ order.order_date }}</text>
              <text class="order-id">订单号：{{ order.order_id }}</text>
            </view>
          </view>
          
          <view class="order-actions" v-if="order.status === 'pending'">
            <button class="action-btn cancel-btn" @click="cancelGroupbuyOrder(order)">取消订单</button>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="(activeTab === 'running' && runningOrders.length === 0 && !loading) || 
                  (activeTab === 'groupbuy' && groupbuyOrders.length === 0 && !loading)" 
            class="empty-state">
        <text class="empty-text">暂无{{ activeTab === 'running' ? '跑腿' : '团购' }}订单</text>
        <text class="empty-desc">{{ activeTab === 'running' ? '您还没有发起过跑腿服务' : '您还没有团购订单' }}</text>
        <button class="go-shopping-btn" @click="goToSquare">
          {{ activeTab === 'running' ? '去发起跑腿' : '去团购' }}
        </button>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script>
import { ref, onMounted } from 'vue';
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import { uniRequest } from '@/utils/request';

export default {
  setup() {
    const activeTab = ref('running');
    const runningOrders = ref([]);
    const groupbuyOrders = ref([]);
    const loading = ref(false);
    const baseImgUrl = ref('');

    const switchTab = (tab) => {
      activeTab.value = tab;
      if (tab === 'running') {
        loadRunningOrders();
      } else {
        loadGroupbuyOrders();
      }
    };

    // 获取基础图片URL
    const getBaseSetting = async () => {
      try {
        const res = await uniRequest({
          url: '/getBaseSetting',
          method: 'GET',
          data: { userid: uni.getStorageSync('userid') }
        });
        
        if (res.code === 0) {
          baseImgUrl.value = res.data.baseImgUrl;
        }
      } catch (error) {
        console.error('获取基础配置失败:', error);
      }
    };

    // 加载跑腿订单
    const loadRunningOrders = async () => {
      loading.value = true;
      try {
        const userInfo = uni.getStorageSync('userInfo');
        const schoolid = uni.getStorageSync('schoolid') || (userInfo && userInfo.schoolid);
        
        if (!schoolid) {
          uni.showToast({
            title: '请先绑定学校',
            icon: 'none'
          });
          runningOrders.value = [];
          return;
        }

        const res = await uniRequest({
          url: '/getMyRunningList',
          method: 'GET',
          data: {
            userid: uni.getStorageSync('userid'),
            schoolid: schoolid
          }
        });

        console.log('跑腿列表响应:', res);

        if (res.code === 0) {
          runningOrders.value = res.data || [];
        } else {
          runningOrders.value = [];
        }
      } catch (error) {
        console.error('加载跑腿订单失败:', error);
        runningOrders.value = [];
      } finally {
        loading.value = false;
        uni.stopPullDownRefresh();
      }
    };

    // 加载团购订单 - 使用本地存储
    const loadGroupbuyOrders = async () => {
      loading.value = true;
      try {
        // 从本地存储获取团购订单
        const userid = uni.getStorageSync('userid');
        const localOrders = uni.getStorageSync(`groupbuy_orders_${userid}`) || [];
        
        // 如果有本地订单数据，直接使用
        if (localOrders.length > 0) {
          groupbuyOrders.value = localOrders;
          return;
        }

        // 如果没有本地数据，尝试从服务器获取（如果后端提供了接口）
        // 这里先使用模拟数据
        groupbuyOrders.value = getMockGroupbuyOrders();
        
        // 保存到本地存储
        uni.setStorageSync(`groupbuy_orders_${userid}`, groupbuyOrders.value);
        
      } catch (error) {
        console.error('加载团购订单失败:', error);
        groupbuyOrders.value = [];
      } finally {
        loading.value = false;
      }
    };

    // 模拟团购订单数据
    const getMockGroupbuyOrders = () => {
      return [
        {
          order_id: 'GB202503200001',
          merchant_name: '韵江南',
          product_name: '柠檬奶茶',
          product_img: '1.jpg',
          spec_name: '大杯',
          unit_price: 15,
          quantity: 2,
          total_price: 30,
          order_date: '2025-03-20',
          status: 'completed'
        },
        {
          order_id: 'GB202503190002',
          merchant_name: '江南之春',
          product_name: '草莓蛋糕',
          product_img: '2.jpg',
          spec_name: '标准份',
          unit_price: 25,
          quantity: 1,
          total_price: 25,
          order_date: '2025-03-19',
          status: 'pending'
        }
      ];
    };

    // 获取第一个商家名称
    const getFirstMerchantName = (merchants) => {
      if (!merchants || merchants.length === 0) return '未知商家';
      if (merchants.length === 1) return merchants[0].name;
      return `${merchants[0].name}等`;
    };

    // 获取建筑物名称
    const getBuildingNames = (buildings) => {
      if (!buildings || buildings.length === 0) return '未知范围';
      if (buildings.length === 1) return buildings[0].running_for_building_name;
      return `${buildings[0].running_for_building_name}等`;
    };

    // 获取状态样式类
    const getStatusClass = (status) => {
      const classMap = {
        'completed': 'status-completed',
        'pending': 'status-pending',
        'cancelled': 'status-cancelled',
        'refunded': 'status-refunded'
      };
      return classMap[status] || 'status-pending';
    };

    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        'completed': '已完成',
        'pending': '进行中',
        'cancelled': '已取消',
        'refunded': '已退款'
      };
      return statusMap[status] || '未知状态';
    };

    // 跳转到跑腿详情
    const goToRunningDetail = (order) => {
      uni.navigateTo({
        url: `/pages/my-running-detail/my-running-detail?running_id=${order.running_id}&schoolid=${uni.getStorageSync('schoolid')}`
      });
    };

    // 跳转到团购详情
    const goToGroupbuyDetail = (order) => {
      uni.showModal({
        title: '订单详情',
        content: `订单号：${order.order_id}\n商品：${order.product_name}\n状态：${getStatusText(order.status)}`,
        showCancel: false
      });
    };

    // 取消团购订单
    const cancelGroupbuyOrder = (order) => {
      uni.showModal({
        title: '确认取消',
        content: '确定要取消这个团购订单吗？',
        success: (res) => {
          if (res.confirm) {
            // 更新订单状态
            const userid = uni.getStorageSync('userid');
            const orders = uni.getStorageSync(`groupbuy_orders_${userid}`) || [];
            const updatedOrders = orders.map(item => {
              if (item.order_id === order.order_id) {
                return { ...item, status: 'cancelled' };
              }
              return item;
            });
            
            uni.setStorageSync(`groupbuy_orders_${userid}`, updatedOrders);
            groupbuyOrders.value = updatedOrders;
            
            uni.showToast({
              title: '取消成功',
              icon: 'success'
            });
          }
        }
      });
    };

    // 跳转到广场
    const goToSquare = () => {
      uni.switchTab({
        url: '/pages/square/square'
      });
    };

    // 监听页面显示，用于从购买页面返回时刷新数据
    const onPageShow = () => {
      // 检查是否有新的团购订单需要添加
      const newOrder = uni.getStorageSync('new_groupbuy_order');
      if (newOrder) {
        const userid = uni.getStorageSync('userid');
        const orders = uni.getStorageSync(`groupbuy_orders_${userid}`) || [];
        
        // 避免重复添加
        const exists = orders.some(order => order.order_id === newOrder.order_id);
        if (!exists) {
          orders.unshift(newOrder);
          uni.setStorageSync(`groupbuy_orders_${userid}`, orders);
          groupbuyOrders.value = orders;
        }
        
        // 清除临时存储
        uni.removeStorageSync('new_groupbuy_order');
      }
    };

    onLoad(() => {
      getBaseSetting();
      loadRunningOrders();
    });

    onShow(() => {
      onPageShow();
      if (activeTab.value === 'running') {
        loadRunningOrders();
      } else {
        loadGroupbuyOrders();
      }
    });

    onPullDownRefresh(() => {
      if (activeTab.value === 'running') {
        loadRunningOrders();
      } else {
        loadGroupbuyOrders();
      }
    });

    return {
      activeTab,
      runningOrders,
      groupbuyOrders,
      loading,
      baseImgUrl,
      switchTab,
      getFirstMerchantName,
      getBuildingNames,
      getStatusClass,
      getStatusText,
      goToRunningDetail,
      goToGroupbuyDetail,
      cancelGroupbuyOrder,
      goToSquare
    };
  }
}
</script>

<style scoped>
.orders-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.tab-bar {
  display: flex;
  background: white;
  border-bottom: 1rpx solid #eee;
}

.tab-item {
  flex: 1;
  padding: 30rpx 0;
  text-align: center;
  position: relative;
}

.tab-item.active {
  color: #07c160;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80rpx;
  height: 4rpx;
  background: #07c160;
  border-radius: 2rpx;
}

.tab-text {
  font-size: 32rpx;
  font-weight: 500;
}

.orders-list {
  padding: 20rpx;
}

.order-section {
  margin-bottom: 20rpx;
}

.order-card {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.merchant-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.order-status {
  font-size: 26rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
}

.status-pending {
  background: #fff0f0;
  color: #e64340;
}

.status-completed {
  background: #f0f9f0;
  color: #07c160;
}

.status-cancelled {
  background: #f5f5f5;
  color: #999;
}

.order-content {
  display: flex;
  gap: 20rpx;
}

.product-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  background-color: #f0f0f0;
}

.order-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.product-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.building-info {
  font-size: 24rpx;
  color: #666;
}

.price-info {
  display: flex;
  justify-content: space-between;
  font-size: 26rpx;
}

.quantity {
  color: #666;
}

.deadline {
  font-size: 24rpx;
  color: #999;
}

.info-card {
  background: white;
  border-radius: 16rpx;
  padding: 60rpx 40rpx;
  text-align: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.info-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.info-desc {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 15rpx;
}

.info-tip {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 100rpx 40rpx;
}

.empty-text {
  display: block;
  font-size: 32rpx;
  color: #999;
  margin-bottom: 20rpx;
}

.empty-desc {
  display: block;
  font-size: 26rpx;
  color: #ccc;
  margin-bottom: 40rpx;
}

.go-shopping-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 40rpx;
  padding: 20rpx 60rpx;
  font-size: 28rpx;
}

.loading-state {
  text-align: center;
  padding: 60rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
  margin-top: 30rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.action-btn {
  padding: 16rpx 32rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  border: none;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.spec-info {
  font-size: 24rpx;
  color: #666;
}

.current-price {
  color: #e64340;
  font-weight: 500;
}

.total-price {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.order-date {
  font-size: 24rpx;
  color: #999;
}

.order-id {
  font-size: 22rpx;
  color: #ccc;
}

.status-refunded {
  background: #f0f7ff;
  color: #1989fa;
}
</style>