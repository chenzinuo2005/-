<template>
  <view class="container">
    <!-- 跑腿商品信息 -->
    <view class="header">
      <image :src="baseImgUrl + currentProduct.dish_img" class="product-img"></image>
      <view class="product-info">
        <view class="title">{{ runningInfo.title }}</view>
        <view class="merchant">商家: {{ currentMerchant.name }}</view>
        <view class="sold">腿长: {{ runningInfo.running_username }}</view>
      </view>
    </view>

    <!-- 商家选择（多个商家时显示） -->
    <view v-if="merchants.length > 1" class="section">
      <view class="section-title">选择商家</view>
      <view class="merchant-list">
        <view 
          v-for="(merchant, index) in merchants" 
          :key="merchant.merchant_id"
          class="merchant-item"
          :class="{ active: selectedMerchantIndex === index }"
          @click="selectMerchant(index)"
        >
          {{ merchant.name }}
        </view>
      </view>
    </view>

    <!-- 商品选择 -->
    <view class="section">
      <view class="section-title">选择商品</view>
      <view class="product-list">
        <view 
          v-for="(kind, index) in currentKinds" 
          :key="kind.dish_id"
          class="product-item"
          :class="{ active: selectedKindIndex === index }"
          @click="selectedKindIndex = index; selectedSpecIndex = 0"
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
          v-for="(spec, index) in currentSpecs" 
          :key="spec.spec_id"
          class="spec-item"
          :class="{ active: selectedSpecIndex === index }"
          @click="selectedSpecIndex = index"
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

    <!-- 留言输入 -->
    <view class="message-section">
      <view class="section-title">留言 (不超过30字)</view>
      <input 
        v-model="message" 
        class="message-input" 
        placeholder="请输入您的留言" 
        maxlength="30"
      />
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
const runningInfo = ref({ merchants: [] });
const merchants = ref([]);
const selectedMerchantIndex = ref(0);
const selectedKindIndex = ref(0);
const selectedSpecIndex = ref(0);
const quantity = ref(1);
const message = ref('');
const queryParams = ref({});

// 计算当前选中的商家
const currentMerchant = computed(() => 
  merchants.value[selectedMerchantIndex.value] || {}
);

// 计算当前商家下的商品种类
const currentKinds = computed(() => 
  currentMerchant.value.kinds || []
);

// 计算当前选中的商品
const currentProduct = computed(() => 
  currentKinds.value[selectedKindIndex.value] || {}
);

// 计算当前商品下的规格
const currentSpecs = computed(() => 
  currentProduct.value.specifications || []
);

// 计算当前选中的规格
const currentSpec = computed(() => 
  currentSpecs.value[selectedSpecIndex.value] || {}
);

// 计算当前价格
const currentPrice = computed(() => 
  currentSpec.value.price || 0
);

// 计算下一档价格
const nextPrice = computed(() => 
  currentSpec.value.next_price
);

// 计算离下一档还差的数量
const specsShortNum = computed(() => 
  currentSpec.value.num_in_short || 0
);

// 计算总价
const totalPrice = computed(() => 
  (currentPrice.value * quantity.value).toFixed(2)
);

// 获取页面参数
onLoad((options) => {
  if (!options.running_id || isNaN(options.running_id)) {
    uni.showToast({
      title: '缺少跑腿活动ID，无法加载页面',
      icon: 'none',
      duration: 2000
    });
    
    setTimeout(() => {
      uni.navigateBack();
    }, 2000);
    return;
  }
  
  queryParams.value = {
    running_id: Number(options.running_id),
    merchant_id: options.merchant_id ? Number(options.merchant_id) : 0
  };
  
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
    } else {
      console.error('获取基础配置失败:', baseRes.message);
    }

    // 获取跑腿详情
    const res = await uniRequest({
      url: '/getRunningInfo',
      method: 'GET',
      data: {
        userid: uni.getStorageSync('userid'),
        running_id: queryParams.value.running_id,
        merchant_id: queryParams.value.merchant_id
      },
      header: { token: uni.getStorageSync('token') }
    });
    
    if (res.code === 0) {
      runningInfo.value = res.data;
      merchants.value = res.data.merchants || [];
      
      // 初始化选择
      selectedMerchantIndex.value = 0;
      selectedKindIndex.value = 0;
      selectedSpecIndex.value = 0;
    } else {
      console.error('获取跑腿详情失败:', res.message);
      uni.showToast({
        title: '加载失败: ' + (res.message || '未知错误'),
        icon: 'none',
        duration: 3000
      });
    }
  } catch (error) {
    console.error('初始化页面失败:', error);
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none',
      duration: 3000
    });
  }
};

// 选择商家
const selectMerchant = (index) => {
  selectedMerchantIndex.value = index;
  selectedKindIndex.value = 0;
  selectedSpecIndex.value = 0;
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
  const selectedMerchant = merchants.value[selectedMerchantIndex.value];
  const selectedKind = selectedMerchant?.kinds?.[selectedKindIndex.value];
  const selectedSpec = selectedKind?.specifications?.[selectedSpecIndex.value];
  
  if (!selectedMerchant || !selectedKind || !selectedSpec) {
    uni.showToast({
      title: '请选择完整的商品信息',
      icon: 'none',
      duration: 2000
    });
    return;
  }
  
  // 准备参数 - 添加跑腿订单特有字段
  const params = {
    orderType: 'running', // 标识跑腿订单类型
    running_id: runningInfo.value.running_id,
    spec_id: selectedSpec.spec_id,
    num: quantity.value,
    price: selectedSpec.price,
    amount: totalPrice.value,
    message: message.value,
    merchant_id: selectedMerchant.merchant_id,
    merchantName: selectedMerchant.name,
    dish_id: selectedKind.dish_id,
    productName: selectedKind.dish_name,
    specName: selectedSpec.spec,
    img: selectedKind.dish_img,
    running_username: runningInfo.value.running_username, // 腿长用户名
    building_id: selectedMerchant.building_id,
    buildingName: selectedMerchant.building_name
  };

  // 跳转到确认页面
  const queryString = Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
    
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

.merchant-list, .product-list, .spec-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.merchant-item, .product-item, .spec-item {
  padding: 15rpx 30rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 10rpx;
  font-size: 28rpx;
}

.merchant-item.active, 
.product-item.active, 
.spec-item.active {
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

.message-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.message-input {
  height: 80rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 8rpx;
  padding: 0 20rpx;
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
  margin-bottom: 30rpx;
}
</style>