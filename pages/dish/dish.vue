<template>
  <view class="container">
    <!-- 菜品基本信息 -->
    <view class="header">
      <image :src="baseImgUrl + currentProduct.dish_img" class="product-img"></image>
      <view class="product-info">
        <view class="title">{{ dishInfo.name }}</view>
        <view class="merchant">商家: {{ dishInfo.name }}</view>
        <view class="location">{{ dishInfo.building_name }}</view>
      </view>
    </view>

    <!-- 菜品选择 -->
    <view class="section" v-if="dishInfo.kinds && dishInfo.kinds.length > 1">
      <view class="section-title">选择菜品</view>
      <view class="product-list">
        <view 
          v-for="(kind, kindIndex) in dishInfo.kinds" 
          :key="kind.dish_id"
          class="product-item"
          :class="{ active: selectedKindIndex === kindIndex }"
          @click="selectedKindIndex = kindIndex"
        >
          {{ kind.dish_name }}
        </view>
      </view>
    </view>

    <!-- 规格选择 -->
    <view class="section" v-if="currentSpecs && currentSpecs.length > 1">
      <view class="section-title">选择规格</view>
      <view class="spec-list">
        <view 
          v-for="(spec, specIndex) in currentSpecs" 
          :key="spec.spec_id"
          class="spec-item"
          :class="{ active: selectedSpecIndex === specIndex }"
          @click="selectedSpecIndex = specIndex"
        >
          {{ spec.spec }} (¥{{ spec.price }})
        </view>
      </view>
    </view>

    <!-- 数量选择 -->
    <view class="section">
      <view class="section-title">购买数量</view>
      <view class="quantity-selector">
        <view class="btn minus" @click="decreaseQuantity">-</view>
        <view class="quantity">{{ quantity }}</view>
        <view class="btn plus" @click="increaseQuantity">+</view>
      </view>
    </view>

    <!-- 价格信息 -->
    <view class="price-info">
      <view class="total">总价: ¥{{ totalPrice }}</view>
    </view>

    <!-- 留言区域 -->
    <view class="section">
      <view class="section-title">留言</view>
      <textarea 
        v-model="message" 
        placeholder="请输入您的留言（不超过30字）" 
        maxlength="30" 
        class="message-input"
      ></textarea>
    </view>

    <!-- 购买按钮 -->
    <view class="buy-btn" @click="confirmPurchase">立即购买</view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { uniRequest } from '@/utils/request';

// 响应式数据
const baseImgUrl = ref('');
const dishInfo = ref({
  building_name: '',
  kinds: [{
    specifications: []
  }]
});
const selectedKindIndex = ref(0);
const selectedSpecIndex = ref(0);
const quantity = ref(1);
const message = ref('');
const dishId = ref(null);

// 计算当前选中的菜品
const currentProduct = computed(() => 
  dishInfo.value.kinds[selectedKindIndex.value] || {}
);

// 计算当前规格
const currentSpecs = computed(() => 
  currentProduct.value.specifications || []
);

// 计算当前价格
const currentPrice = computed(() => 
  currentSpecs.value[selectedSpecIndex.value]?.price || 0
);

// 计算总价
const totalPrice = computed(() => 
  (currentPrice.value * quantity.value).toFixed(2)
);

onLoad((options) => {
  dishId.value = options.dish_id;
  if (!dishId.value) {
    uni.showToast({
      title: '缺少菜品ID',
      icon: 'none'
    });
    uni.navigateBack();
    return;
  }
  
  initPage();
});

// 初始化页面
const initPage = async () => {
  try {
    // 获取基础配置
    const baseRes = await uniRequest({
      url: '/getBaseSetting',
      method: 'GET',
      data: { userid: uni.getStorageSync('userid') },
      header: { token: uni.getStorageSync('token') }
    });
    
    if (baseRes.code === 0) {
      baseImgUrl.value = baseRes.data.baseImgUrl;
    }

    // 获取菜品详情
    const res = await uniRequest({
      url: '/getDishInfo',
      method: 'GET',
      data: {
        userid: uni.getStorageSync('userid'),
        dish_id: dishId.value
      },
      header: { token: uni.getStorageSync('token') }
    });
    
    if (res.code === 0) {
      dishInfo.value = res.data;
    } else {
      console.error('获取菜品详情失败:', res);
      uni.showToast({
        title: '获取菜品详情失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('初始化页面失败:', error);
    uni.showToast({
      title: '页面加载失败',
      icon: 'none'
    });
  }
};

// 减少数量
const decreaseQuantity = () => {
  if (quantity.value > 1) quantity.value--;
};

// 增加数量
const increaseQuantity = () => {
  quantity.value++;
};

// 确认购买
const confirmPurchase = () => {
  if (!currentProduct.value.dish_id) {
    uni.showToast({
      title: '请选择菜品',
      icon: 'none'
    });
    return;
  }

  if (!currentSpecs.value[selectedSpecIndex.value]) {
    uni.showToast({
      title: '请选择规格',
      icon: 'none'
    });
    return;
  }

  // 准备传递给确认页面的参数
  const params = {
    orderType: 'dish', // 订单类型标识
    dishId: dishId.value, // 菜品ID
    productName: currentProduct.value.dish_name, // 菜品名称
    specName: currentSpecs.value[selectedSpecIndex.value].spec, // 规格名称
    unitPrice: currentPrice.value, // 单价
    quantity: quantity.value, // 数量
    totalPrice: totalPrice.value, // 总价
    merchantName: dishInfo.value.name, // 商家名称
    specId: currentSpecs.value[selectedSpecIndex.value].spec_id, // 规格ID
    img: currentProduct.value.dish_img, // 菜品图片
    buildingName: dishInfo.value.building_name // 商家位置
  };

  // 构建查询字符串
  const queryString = Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');

  // 跳转到确认订单页面
  uni.navigateTo({
    url: `/pages/buysure/buysure?${queryString}`
  });
};
</script>

<style scoped>
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  display: flex;
  padding: 30rpx;
  background: white;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
}

.product-img {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  margin-right: 30rpx;
}

.product-info {
  flex: 1;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 15rpx;
}

.merchant, .location {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.product-list, .spec-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.product-item, .spec-item {
  padding: 15rpx 30rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 10rpx;
  font-size: 28rpx;
}

.product-item.active, .spec-item.active {
  border-color: #1aad19;
  background-color: rgba(26, 173, 25, 0.1);
  color: #1aad19;
}

.quantity-selector {
  display: flex;
  align-items: center;
  width: 250rpx;
}

.btn {
  width: 60rpx;
  height: 60rpx;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 40rpx;
}

.quantity {
  flex: 1;
  text-align: center;
  font-size: 36rpx;
}

.price-info {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  font-size: 32rpx;
}

.total {
  font-weight: bold;
  color: #e64340;
  font-size: 36rpx;
}

.message-input {
  width: 100%;
  height: 120rpx;
  padding: 20rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 10rpx;
  font-size: 28rpx;
}

.buy-btn {
  height: 90rpx;
  background: #1aad19;
  color: white;
  border-radius: 45rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 36rpx;
  font-weight: 500;
  margin-top: 40rpx;
}
</style>