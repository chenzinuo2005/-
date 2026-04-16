<template>
  <view class="container">
    <!-- 团购商品信息 -->
    <view class="header">
      <image :src="baseImgUrl + currentProduct.dish_img" class="product-img"></image>
      <view class="product-info">
        <view class="title">{{ groupbuy.title }}</view>
        <view class="merchant">商家: {{ groupbuy.name }}</view>
        <view class="sold">已售: {{ groupbuy.sold_totalnum }}</view>
      </view>
    </view>

    <!-- 规格选择 -->
    <view class="section">
      <view class="section-title">选择商品</view>
      <view class="product-list">
        <view 
          v-for="(kind, kindIndex) in groupbuy.kinds" 
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
    <view class="section">
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
      <view>单价: ¥{{ currentPrice }}</view>
      <view v-if="nextPrice">下一档: 差{{ specsShortNum }}件享¥{{ nextPrice }}</view>
      <view class="total">总价: ¥{{ totalPrice }}</view>
    </view>

    <!-- 购买按钮 -->
    <view class="buy-btn" @click="confirmPurchase">立即购买</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { uniRequest } from '@/utils/request';

// 响应式数据
const baseImgUrl = ref('');
const groupbuy = ref({
  kinds: [{
    specifications: []
  }]
});
const selectedKindIndex = ref(0);
const selectedSpecIndex = ref(0);
const quantity = ref(1);

// 计算当前选中的商品
const currentProduct = computed(() => 
  groupbuy.value.kinds[selectedKindIndex.value] || {}
);

// 获取页面参数
const queryParams = ref({});
onLoad((options) => {
  queryParams.value = options;
  console.log('页面参数:', options);
  initPage();
});

// 计算属性
const currentSpecs = computed(() => 
  currentProduct.value.specifications || []
);

const currentPrice = computed(() => 
  currentSpecs.value[selectedSpecIndex.value]?.price || 0
);

const nextPrice = computed(() => 
  currentSpecs.value[selectedSpecIndex.value]?.next_price
);

const specsShortNum = computed(() => 
  currentSpecs.value[selectedSpecIndex.value]?.num_in_short || 0
);

const totalPrice = computed(() => 
  (currentPrice.value * quantity.value).toFixed(2)
);

// 方法
const initPage = async () => {
  try {
    // 获取基础配置
    const baseRes = await uniRequest({
      url: '/getBaseSetting',
      method: 'GET',
      data: { userid: uni.getStorageSync('userid') }
    });
    
    if (baseRes.code === 0) {
      baseImgUrl.value = baseRes.data.baseImgUrl;
      console.log('基础图片URL:', baseImgUrl.value);
    } else {
      console.warn('获取基础配置失败:', baseRes);
    }

    // 获取团购详情
    const res = await uniRequest({
      url: '/getGroupBuyGoodsInfo',
      method: 'GET',
      data: {
        userid: uni.getStorageSync('userid'),
        groupbuy_id: queryParams.value.groupbuy_id,
        merchant_id: queryParams.value.merchant_id
      }
    });
    
    console.log('团购详情响应:', res);
    
    if (res.code === 0) {
      groupbuy.value = res.data;
      selectedKindIndex.value = 0;
      selectedSpecIndex.value = 0;
      console.log('团购数据加载成功');
    } else {
      console.error('获取团购详情失败:', res);
    }
  } catch (error) {
    console.error('初始化页面失败:', error);
  }
};

const decreaseQuantity = () => {
  if (quantity.value > 1) quantity.value--;
};

const increaseQuantity = () => {
  quantity.value++;
};

const confirmPurchase = () => {
  const selectedKind = groupbuy.value.kinds[selectedKindIndex.value];
  
  if (!selectedKind) {
    uni.showToast({
      title: '请选择商品',
      icon: 'none',
      duration: 2000
    });
    return;
  }
  
  const selectedSpec = selectedKind.specifications[selectedSpecIndex.value];
  
  if (!selectedSpec) {
    uni.showToast({
      title: '请选择商品规格',
      icon: 'none',
      duration: 2000
    });
    return;
  }
  
  // 准备传递给确认页面的参数 - 修正参数名称
  const params = {
    orderType: 'groupbuy', // 明确指定订单类型为团购
    productName: selectedKind.dish_name,
    specName: selectedSpec.spec,
    price: selectedSpec.price, // 改为 price 而不是 unitPrice
    num: quantity.value, // 改为 num 而不是 quantity
    amount: totalPrice.value, // 改为 amount 而不是 totalPrice
    groupbuy_id: queryParams.value.groupbuy_id,
    merchant_id: queryParams.value.merchant_id,
    merchantName: groupbuy.value.name,
    spec_id: selectedSpec.spec_id,
    nextPrice: selectedSpec.next_price,
    num_in_short: selectedSpec.num_in_short,
    img: selectedKind.dish_img,
    buildingName: groupbuy.value.building_name // 添加建筑物名称
  };

  console.log('确认购买参数:', params);
  
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
/* 样式保持不变 */
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

.merchant, .sold {
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
  margin-top: 20rpx;
  font-weight: bold;
  color: #e64340;
  font-size: 36rpx;
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
}
</style>