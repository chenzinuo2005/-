<template>
  <view class="food-container">
    <view class="fixed-search">
      <navigator url="/pages/search/search" class="search-section">
        <input type="text" placeholder="搜索美食">
      </navigator>
    </view>
    <view class="food-list">
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-state">
        <text>加载中...</text>
      </view>
      
      <!-- 空状态 -->
      <view v-else-if="foods.length === 0" class="empty-state">
        <text>暂未有商家入驻</text>
      </view>
      
      <!-- 美食列表 -->
      <navigator 
        v-else
        :url="`/pages/restaurant/restaurant?merchantId=${food.merchant_id}`" 
        class="food-item" 
        v-for="(food, index) in foods" 
        :key="index"
      >
        <image :src="getImageUrl(food.img)" @error="handleImageError"></image> 
        <view class="food-details">
          <view class="food-title">{{ food.name }}</view> 
          <!-- 添加更多商家信息 -->
          <view class="food-info">
            <text class="category">{{ food.subcategory || '美食' }}</text>
            <text class="location">{{ food.building_name || '校内商家' }}</text>
          </view>
          <view class="food-stats">
            <text class="rating">评分: {{ food.average_rating || 0 }}</text>
            <text class="consumption">人均: ¥{{ food.per_cap_consumption || 0 }}</text>
          </view>
          <view class="food-description">{{ food.dianping || '暂无评价' }}</view>
          <!-- 活动标签 -->
          <view class="food-tags">
            <text v-if="food.has_groupbuy" class="tag groupbuy">团购</text>
            <text v-if="food.has_date" class="tag date">邀约</text>
            <text v-if="food.has_running" class="tag running">跑腿</text>
          </view>
        </view>
      </navigator>
    </view>
  </view>
</template>

<script>
import { uniRequest } from '@/utils/request';
import store from '@/utils/store';

export default {
  data() {
    return {
      foods: [],
      baseImgUrl: '',
      loading: true
    }
  },
  
  onLoad() {
    console.log('首页 onLoad');
    this.initializePage();
  },
  
  onShow() {
    console.log('首页 onShow - 刷新数据');
    this.fetchFoods();
  },
  
  onPullDownRefresh() {
    console.log('首页下拉刷新');
    this.fetchFoods();
    setTimeout(() => {
      uni.stopPullDownRefresh();
    }, 1000);
  },
  
  methods: {
    initializePage() {
      console.log('首页初始化 - 检查登录状态');
      
      // 先检查登录状态
      if (!store.isLoggedIn) {
        store.checkLoginStatus();
      }
      
      // 延迟加载数据，确保状态已更新
      setTimeout(() => {
        this.fetchBaseSetting();
        this.fetchFoods();
      }, 500);
    },
    
    getUserInfo() {
      try {
        // 首先从store获取
        if (store.isLoggedIn && store.userInfo && store.userInfo.userid) {
          console.log('从store获取用户信息:', store.userInfo);
          return store.userInfo;
        }
        
        // 如果store中没有，从本地存储获取
        const userInfoStr = uni.getStorageSync('userInfo');
        const userid = uni.getStorageSync('userid');
        const schoolid = uni.getStorageSync('schoolid');
        const schoolname = uni.getStorageSync('schoolname');
        
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          console.log('从本地存储获取用户信息:', userInfo);
          return userInfo;
        } else if (userid && schoolid) {
          // 构建基础用户信息
          const basicUserInfo = {
            userid: userid,
            schoolid: schoolid,
            schoolname: schoolname || '广州商学院'
          };
          console.log('从基础信息构建用户信息:', basicUserInfo);
          return basicUserInfo;
        }
        
        console.warn('未找到用户信息，用户可能未登录');
        return null;
      } catch (error) {
        console.error('获取用户信息失败:', error);
        return null;
      }
    },
    
    async fetchBaseSetting() {
      try {
        const userInfo = this.getUserInfo();
        if (!userInfo || !userInfo.userid) {
          console.warn('无法获取用户信息，跳过基础配置请求');
          return;
        }
        
        const res = await uniRequest({
          url: '/getBaseSetting',
          method: 'GET',
          data: { 
            userid: userInfo.userid
          }
        });
        console.log('基础配置响应:', res);
        if (res.code === 0) {
          this.baseImgUrl = res.data.baseImgUrl;
        }
      } catch (error) {
        console.error('获取基础配置失败:', error);
      }
    },
    
    async fetchFoods() {
      this.loading = true;
      try {
        const userInfo = this.getUserInfo();
        
        if (!userInfo || !userInfo.userid || !userInfo.schoolid) {
          console.error('用户信息不完整，无法请求数据:', userInfo);
          uni.showToast({
            title: '请先登录并选择学校',
            icon: 'none',
            duration: 2000
          });
          this.foods = [];
          return;
        }
        
        console.log('请求参数:', {
          userid: userInfo.userid,
          schoolid: userInfo.schoolid
        });
        
        const res = await uniRequest({ 
          url: '/getFoodShops',
          method: 'GET',
          data: { 
            userid: userInfo.userid,
            schoolid: userInfo.schoolid
          }
        });
        
        console.log('美食商家响应:', res);
        
        if (res.code === 0) {
          this.foods = res.data || [];
          console.log('处理后的商家数据:', this.foods);
        } else {
          console.warn('API返回错误码:', res.code, res.message);
          this.foods = [];
        }
      } catch (error) {
        console.error('请求失败:', error);
        this.foods = [];
        
        // 显示具体的错误信息
        if (error.code === 400) {
          uni.showToast({
            title: '参数错误，请重新登录',
            icon: 'none',
            duration: 2000
          });
        } else {
          uni.showToast({
            title: '网络错误，请重试',
            icon: 'none',
            duration: 2000
          });
        }
      } finally {
        this.loading = false;
      }
    },
    
    getImageUrl(imgPath) {
      if (!imgPath) return '/static/images/default-food.png';
      if (imgPath.startsWith('http')) return imgPath;
      return this.baseImgUrl + imgPath;
    },
    
    handleImageError(e) {
      console.log('图片加载失败:', e);
      e.target.src = '/static/images/default-food.png';
    }
  }
}
</script>

<style lang="scss" scoped>
.food-container {
  padding: 0 20px 20px;

  /* 为内容留出搜索栏的空间 */
  .content-padding {
    height: 80px; /* 根据搜索栏的高度调整 */
  }
    .fixed-search {
      position: fixed;  /* 固定定位 */
      top: 0;           /* 贴顶 */
      left: 0;
      width: 100%;      /* 全宽 */
      background: white;
      padding: 10rpx;   /* 内边距 */
      z-index: 999;     /* 确保在最上层 */
      box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
    }
  .search-section {
	  margin-left: 30rpx;
	  margin-top: 75rpx;
	  width: 300rpx;
    display: flex;
    align-items: center;
    margin-bottom: 10px;
	

    input {
      flex: 1;
	    width: 100%;
	    height: 70rpx;
      padding: 0 30rpx;
	    font-size: 28rpx;
      border: 1rpx solid #ddd;
	    line-height: 1.4;
      border-radius: 50px;
      margin-right: 10px;
      background: #f5f5f5;
    }
  }

  .category-nav {
    margin-bottom: 20px;

    .category-scroll {
      white-space: nowrap;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch; /* 增加滚动流畅度（针对 iOS） */
      scrollbar-width: none; /* 隐藏滚动条（Firefox） */
      &::-webkit-scrollbar {
        display: none; /* 隐藏滚动条（Chrome、Safari 等） */
      }
    }

    view {
      display: inline-block;
      padding: 10px 20px;
      margin-right: 10px;
      border: 1px solid #ccc;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.3s ease; /* 添加过渡效果 */

      &:hover {
        background-color: #f1f1f1; /* 鼠标悬停效果 */
      }
    }

    view.active {
      background-color: #007aff;
      color: white;
    }
  }

  .food-list {
	  margin-top: 200rpx; /* 关键修改：添加间距避免内容被遮挡 */

    /* 加载状态 */
    .loading-state {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200rpx;
      font-size: 28rpx;
      color: #999;
    }

    /* 空状态 */
    .empty-state {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200rpx;
      font-size: 28rpx;
      color: #999;
    }

    .food-item {
      display: flex;
      margin-bottom: 20px;
      border: 1px solid #eee;
      border-radius: 10px;
      padding: 15px;
      align-items: flex-start;
      background: white;
      box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
      transition: all 0.3s ease;

      &:active {
        background: #f8f8f8;
        transform: scale(0.98);
      }

      image {
        width: 120px;
        height: 120px;
        margin-right: 15px;
        border-radius: 8px;
        object-fit: cover;
      }

      .food-details {
        flex: 1;

        .food-title {
          font-weight: bold;
          margin-bottom: 8px;
          font-size: 16px;
          color: #333;
        }

        .food-info {
          display: flex;
          margin-bottom: 8px;
          
          .category, .location {
            font-size: 12px;
            color: #666;
            margin-right: 10px;
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 4px;
          }
        }

        .food-stats {
          display: flex;
          margin-bottom: 8px;
          
          .rating, .consumption {
            font-size: 12px;
            color: #ff6b35;
            margin-right: 15px;
          }
        }

        .food-description {
          color: #666;
          margin-bottom: 8px;
          font-size: 14px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .food-tags {
          .tag {
            display: inline-block;
            padding: 4px 8px;
            margin-right: 5px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            
            &.groupbuy {
              background: #ffece8;
              color: #ff6b35;
              border: 1px solid #ff6b35;
            }
            &.date {
              background: #e8f4ff;
              color: #1890ff;
              border: 1px solid #1890ff;
            }
            &.running {
              background: #f0f9eb;
              color: #52c41a;
              border: 1px solid #52c41a;
            }
          }
        }
      }
    }
  }
}
</style>