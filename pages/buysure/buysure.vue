<template>
  <view class="order-confirm-container">
    <!-- 商品信息卡片 -->
    <view class="product-card" v-if="productInfo">
      <image :src="baseImgUrl + productInfo.img" class="product-img" v-if="productInfo.img"></image>
      <view class="product-details">
        <view class="product-name" v-if="productInfo.productName">{{ productInfo.productName }}</view>
        <view class="product-spec" v-if="productInfo.specName">{{ productInfo.specName }}</view>
        <view class="product-price" v-if="productInfo.unitPrice">¥{{ productInfo.unitPrice }}</view>
        
        <!-- 跑腿特有信息 -->
        <view v-if="productInfo.orderType === 'running'" class="running-info">
          <view class="runner">腿长: {{ productInfo.running_username }}</view>
        </view>
      </view>
    </view>
    
    <!-- 订单详情 -->
    <view class="order-details" v-if="productInfo">
      <view class="detail-item">
        <text class="label">商家名称：</text>
        <text class="value">{{ productInfo.merchantName }}</text>
      </view>
      <view class="detail-item">
        <text class="label">商家位置：</text>
        <text class="value">{{ productInfo.buildingName }}</text>
      </view>
      <view class="detail-item">
        <text class="label">购买数量：</text>
        <text class="value">{{ productInfo.quantity }}件</text>
      </view>
      <view class="detail-item">
        <text class="label">单价：</text>
        <text class="value">¥{{ productInfo.unitPrice }}</text>
      </view>
      
      <!-- 团购订单特有字段 -->
      <view v-if="productInfo.orderType === 'groupbuy'" class="detail-item">
        <text class="label">团购ID：</text>
        <text class="value">{{ productInfo.groupbuy_id }}</text>
      </view>
      
      <!-- 跑腿订单特有字段 -->
      <view v-if="productInfo.orderType === 'running'" class="detail-item">
        <text class="label">跑腿ID：</text>
        <text class="value">{{ productInfo.running_id }}</text>
      </view>
    </view>
    
    <!-- 留言区域 -->
    <view class="message-section" v-if="productInfo">
      <text class="label">留言：</text>
      <text class="value">{{ productInfo.message || '无留言' }}</text>
    </view>
    
    <!-- 总计区域 -->
    <view class="total-section" v-if="productInfo">
      <text class="total-label">总计：</text>
      <text class="total-price">¥{{ productInfo.totalPrice }}</text>
    </view>
    
    <!-- 提交按钮 -->
    <view class="submit-button" @click="submitOrder">提交订单并支付</view>
  </view>
</template>

<script>
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { uniRequest } from '@/utils/request';

export default {
  setup() {
    const baseImgUrl = ref('');
    const productInfo = ref(null);

    // URL解码函数
    const decodeUrlParam = (param) => {
      if (!param) return '';
      try {
        return decodeURIComponent(param);
      } catch (e) {
        console.warn('URL参数解码失败:', e);
        return param;
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
          console.log('基础图片URL获取成功:', baseImgUrl.value);
        } else {
          console.warn('获取基础配置失败:', res);
        }
      } catch (error) {
        console.error('获取基础配置失败:', error);
      }
    };

    // 使用onLoad处理页面加载
    onLoad((query) => {
      console.log('接收到的页面参数（编码前）:', query);
      
      // 对URL参数进行解码
      const decodedQuery = {};
      Object.keys(query).forEach(key => {
        decodedQuery[key] = decodeUrlParam(query[key]);
      });
      
      console.log('解码后的页面参数:', decodedQuery);
      
      // 从URL参数填充产品信息 - 修正参数映射
      if (decodedQuery) {
        productInfo.value = {
          orderType: decodedQuery.orderType || 'groupbuy', // 使用明确的订单类型
          groupbuy_id: decodedQuery.groupbuy_id || '',
          running_id: decodedQuery.running_id || '',
          spec_id: decodedQuery.spec_id || '',
          productName: decodedQuery.productName || '',
          specName: decodedQuery.specName || '',
          unitPrice: parseFloat(decodedQuery.price) || 0, // price 映射到 unitPrice
          quantity: parseInt(decodedQuery.num) || 0, // num 映射到 quantity
          totalPrice: parseFloat(decodedQuery.amount) || 0, // amount 映射到 totalPrice
          merchantName: decodedQuery.merchantName || '',
          buildingName: decodedQuery.buildingName || '',
          img: decodedQuery.img || '',
          message: decodedQuery.message || '',
          running_username: decodedQuery.running_username || '', // 腿长用户名
          nextPrice: parseFloat(decodedQuery.nextPrice) || 0,
          num_in_short: parseInt(decodedQuery.num_in_short) || 0
        };
        
        console.log('处理后的产品信息:', productInfo.value);
      } else {
        console.warn('未接收到页面参数');
        uni.showToast({
          title: '页面参数错误',
          icon: 'none',
          duration: 2000
        });
      }
      
      // 获取基础配置
      getBaseSetting();
    });

    // 提交订单并支付
    const submitOrder = async () => {
      if (!productInfo.value) {
        uni.showToast({
          title: '订单信息未加载，请稍后再试',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      // 验证必要参数
      if (!productInfo.value.spec_id) {
        uni.showToast({
          title: '商品规格信息不完整',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      uni.showLoading({
        title: '处理中...',
        mask: true
      });
      
      try {
        let apiUrl, params;
        
        // 根据订单类型选择不同的API和参数
        if (productInfo.value.orderType === 'running') {
          // 跑腿订单
          apiUrl = '/orderRunning';
          params = {
            userid: uni.getStorageSync('userid'),
            running_id: productInfo.value.running_id,
            spec_id: productInfo.value.spec_id,
            num: productInfo.value.quantity,
            price: productInfo.value.unitPrice,
            amount: productInfo.value.totalPrice,
            message: productInfo.value.message || ''
          };
        } else if (productInfo.value.orderType === 'dish') {
          // 菜品订单
          apiUrl = '/buyDish';
          params = {
            userid: uni.getStorageSync('userid'),
            spec_id: productInfo.value.spec_id,
            num: productInfo.value.quantity,
            price: productInfo.value.unitPrice,
            amount: productInfo.value.totalPrice,
            message: productInfo.value.message || ''
          };
        } else {
          // 团购订单（默认）
          apiUrl = '/groupBuyGoods';
          params = {
            userid: uni.getStorageSync('userid'),
            groupbuy_id: productInfo.value.groupbuy_id,
            spec_id: productInfo.value.spec_id,
            num: productInfo.value.quantity,
            price: productInfo.value.unitPrice,
            amount: productInfo.value.totalPrice,
            message: productInfo.value.message || ''
          };
        }

        console.log('提交订单参数:', params);
        
        // 创建订单
        const orderRes = await uniRequest({
          url: apiUrl,
          method: 'POST',
          data: params
        });

        console.log('订单创建响应:', orderRes);

        if (orderRes.code !== 0) {
          uni.hideLoading();
          uni.showToast({
            title: orderRes.message || '订单创建失败',
            icon: 'none',
            duration: 2000
          });
          return;
        }

        // 获取订单ID - 根据不同类型获取不同字段
        let orderId;
        if (productInfo.value.orderType === 'running') {
          orderId = orderRes.data.running_orderid;
        } else if (productInfo.value.orderType === 'dish') {
          orderId = orderRes.data.dish_orderid;
        } else {
          orderId = orderRes.data.groupbuy_orderid;
        }
        
        if (!orderId) {
          uni.hideLoading();
          uni.showToast({
            title: '获取订单ID失败',
            icon: 'none',
            duration: 2000
          });
          return;
        }
        
        // 调用支付接口获取支付参数
        const payParams = {
          order_id: orderId,
          amount: productInfo.value.totalPrice
        };
        
        const payRes = await uniRequest({
          url: '/wechatPay',
          method: 'POST',
          data: payParams
        });

        if (payRes.code !== 0) {
          uni.hideLoading();
          uni.showToast({
            title: payRes.message || '获取支付参数失败',
            icon: 'none',
            duration: 2000
          });
          return;
        }

        const paymentData = payRes.data;
        
        // 调用微信支付
        uni.requestPayment({
          provider: 'wxpay',
          timeStamp: paymentData.timeStamp,
          nonceStr: paymentData.nonceStr,
          package: paymentData.package,
          signType: paymentData.signType,
          paySign: paymentData.paySign,
          success: () => {
            uni.hideLoading();
            uni.showToast({
              title: '支付成功',
              icon: 'success',
              duration: 1500
            });
            
            // 跳转到订单详情页
            setTimeout(() => {
              uni.redirectTo({
                url: `/pages/order-detail/order-detail?order_id=${orderId}&order_type=${productInfo.value.orderType}`
              });
            }, 1500);
          },
          fail: (err) => {
            uni.hideLoading();
            console.error('支付失败:', err);
            uni.showToast({
              title: '支付失败，请重试',
              icon: 'none',
              duration: 2000
            });
          }
        });
      } catch (error) {
        uni.hideLoading();
        console.error('提交订单失败:', error);
        uni.showToast({
          title: '下单失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    };

    return {
      baseImgUrl,
      productInfo,
      submitOrder
    };
  }
}
</script>

<style scoped>
.order-confirm-container {
  padding: 30rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.product-card {
  display: flex;
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.product-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  margin-right: 30rpx;
  background-color: #f0f0f0;
}

.product-details {
  flex: 1;
}

.product-name {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.product-spec {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 15rpx;
}

.product-price {
  font-size: 32rpx;
  color: #e64340;
  font-weight: bold;
}

/* 跑腿信息样式 */
.running-info {
  margin-top: 15rpx;
}

.runner {
  font-size: 28rpx;
  color: #666;
}

.order-details {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.detail-item {
  display: flex;
  margin-bottom: 20rpx;
  font-size: 30rpx;
  line-height: 1.6;
}

.label {
  width: 180rpx;
  color: #666;
}

.value {
  flex: 1;
  color: #333;
}

.message-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  display: flex;
  font-size: 30rpx;
  line-height: 1.6;
}

.message-section .label {
  width: 100rpx;
}

.message-section .value {
  flex: 1;
}

.total-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 30rpx;
  background: white;
  border-radius: 16rpx;
  font-size: 34rpx;
}

.total-label {
  color: #333;
  margin-right: 15rpx;
}

.total-price {
  font-weight: bold;
  color: #e64340;
  font-size: 38rpx;
}

.submit-button {
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