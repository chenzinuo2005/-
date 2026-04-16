<template>
  <view class="my-dates-container">
    <!-- 选项卡 -->
    <view class="tabs">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 0 }"
        @click="switchTab(0)"
      >
        <text class="tab-text">我发起的</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 1 }"
        @click="switchTab(1)"
      >
        <text class="tab-text">我参与的</text>
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view class="content" scroll-y>
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 错误状态 -->
      <view v-else-if="error" class="error-container">
        <text class="error-text">{{ error }}</text>
        <button class="retry-btn" @click="fetchDates">重试</button>
      </view>

      <!-- 空状态 -->
      <view v-else-if="datesList.length === 0" class="empty-container">
        <view class="empty-icon">📅</view>
        <text class="empty-text">{{ activeTab === 0 ? '您还没有发起过邀约' : '您还没有参与过邀约' }}</text>
        <button v-if="activeTab === 0" class="create-btn" @click="goToCreateDate">创建邀约</button>
      </view>

      <!-- 邀约列表 -->
      <view v-else class="dates-list">
        <view 
          v-for="date in datesList" 
          :key="date.date_id" 
          class="date-item"
          @click="goToDateDetail(date)"
        >
          <view class="date-header">
            <text class="date-title">{{ date.title || '未命名邀约' }}</text>
            <view class="date-status" :class="getStatusClass(date)">
              <text class="status-text">{{ getStatusText(date) }}</text>
            </view>
          </view>

          <view class="date-content">
            <view class="date-info">
              <text class="info-item">📍 {{ date.name || '未设置地点' }}</text>
              <text class="info-item">⏰ {{ date.time || '未设置时间' }}</text>
              <text class="info-item">👥 {{ date.confirms || 0 }}/{{ date.maxpersons || 0 }}人</text>
            </view>

            <view class="date-footer">
              <text class="feed-text">{{ date.feed || '暂无说明' }}</text>
              <text class="budget-text">人均￥{{ date.av_fee || 0 }}</text>
            </view>
          </view>

          <!-- 我参与的邀约特定信息 -->
          <view v-if="activeTab === 1" class="participant-info">
            <text class="sponsor-text">发起人：{{ date.invitor_username || '未知用户' }}</text>
            <text class="my-status" :class="getMyStatusClass(date)">
              {{ getMyStatusText(date) }}
            </text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      activeTab: 0, // 0: 我发起的, 1: 我参与的
      loading: false,
      error: '',
      datesList: [],
      userInfo: {}
    }
  },

  onLoad() {
    console.log('我的邀约页面加载');
    this.checkLoginStatus();
  },

  onShow() {
    console.log('我的邀约页面显示');
    this.checkLoginStatus();
  },

  onPullDownRefresh() {
    console.log('下拉刷新');
    this.fetchDates();
    setTimeout(() => {
      uni.stopPullDownRefresh();
    }, 1000);
  },

  methods: {
    // 检查登录状态
    checkLoginStatus() {
      const token = uni.getStorageSync('token');
      const userInfo = uni.getStorageSync('userInfo');
      
      if (!token || !userInfo) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        setTimeout(() => {
          uni.navigateTo({
            url: '/pages/login/login'
          });
        }, 1500);
        return;
      }

      this.userInfo = userInfo;
      this.fetchDates();
    },

    // 切换选项卡
    switchTab(tabIndex) {
      if (this.activeTab === tabIndex) return;
      
      this.activeTab = tabIndex;
      this.datesList = [];
      this.fetchDates();
    },

    // 获取邀约列表
    async fetchDates() {
      if (!this.userInfo.userid) {
        this.error = '用户信息获取失败';
        return;
      }

      this.loading = true;
      this.error = '';

      try {
        // 使用统一的接口，通过 isSponsor 参数区分
        const url = 'http://www.gongxiangfeng.com:12100/campusnav/getMySponsorDates';
        const params = {
          userid: this.userInfo.userid,
          schoolid: this.userInfo.schoolid || this.userInfo.selectedSchoolId,
          isSponsor: this.activeTab === 0 ? 1 : 0 // 1: 我发起的, 0: 我参与的
        };

        console.log('请求邀约列表:', { url, params });

        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: url,
            method: 'GET',
            data: params,
            header: {
              'content-type': 'application/json',
              'token': uni.getStorageSync('token')
            },
            success: (res) => {
              resolve(res);
            },
            fail: (err) => {
              reject(err);
            }
          });
        });

        console.log('邀约列表响应:', res.data);

        if (res.data.code === 0) {
          this.datesList = res.data.data || [];
          if (this.datesList.length === 0) {
            console.log('没有找到邀约数据');
          }
        } else {
          this.error = res.data.message || '获取数据失败';
          console.log('接口返回错误，使用模拟数据');
          this.useMockData();
        }
      } catch (err) {
        console.error('获取邀约列表失败:', err);
        this.error = '网络错误，请重试';
        // 网络错误时使用模拟数据
        this.useMockData();
      } finally {
        this.loading = false;
      }
    },

    // 使用模拟数据（备用方案）
    useMockData() {
      if (this.activeTab === 0) {
        // 我发起的邀约模拟数据
        this.datesList = [
          {
            date_id: 1,
            title: '校园生活产品优化讨论',
            name: '韵江南',
            time: '3月20日 周三 17:30',
            confirms: 1,
            maxpersons: 3,
            feed: '喝奶茶',
            av_fee: 10,
            status: 'active'
          },
          {
            date_id: 2,
            title: '周末读书分享会',
            name: '图书馆咖啡厅',
            time: '3月22日 周五 14:00',
            confirms: 2,
            maxpersons: 5,
            feed: '咖啡点心',
            av_fee: 25,
            status: 'completed'
          }
        ];
      } else {
        // 我参与的邀约模拟数据
        this.datesList = [
          {
            date_id: 3,
            title: '技术交流会',
            name: '创新实验室',
            time: '3月18日 周一 19:00',
            confirms: 3,
            maxpersons: 8,
            feed: '披萨饮料',
            av_fee: 20,
            invitor_username: '张老师',
            my_status: 'confirmed'
          },
          {
            date_id: 4,
            title: '羽毛球活动',
            name: '体育馆',
            time: '3月25日 周一 16:00',
            confirms: 6,
            maxpersons: 10,
            feed: '运动饮料',
            av_fee: 5,
            invitor_username: '李同学',
            my_status: 'pending'
          }
        ];
      }
    },

    // 获取状态样式
    getStatusClass(date) {
      if (this.activeTab === 0) {
        // 我发起的邀约状态
        if (date.status === 'completed') return 'status-completed';
        if (date.status === 'cancelled') return 'status-cancelled';
        return 'status-active';
      } else {
        // 我参与的邀约状态
        if (date.my_status === 'confirmed') return 'status-confirmed';
        if (date.my_status === 'rejected') return 'status-rejected';
        return 'status-pending';
      }
    },

    // 获取状态文本
    getStatusText(date) {
      if (this.activeTab === 0) {
        // 我发起的邀约状态
        if (date.status === 'completed') return '已结束';
        if (date.status === 'cancelled') return '已取消';
        return '进行中';
      } else {
        // 我参与的邀约状态
        if (date.my_status === 'confirmed') return '已确认';
        if (date.my_status === 'rejected') return '未入选';
        return '待确认';
      }
    },

    // 获取我的参与状态样式
    getMyStatusClass(date) {
      if (date.my_status === 'confirmed') return 'my-status-confirmed';
      if (date.my_status === 'rejected') return 'my-status-rejected';
      return 'my-status-pending';
    },

    // 获取我的参与状态文本
    getMyStatusText(date) {
      if (date.my_status === 'confirmed') return '已入选';
      if (date.my_status === 'rejected') return '未入选';
      return '待确认';
    },

    // 跳转到邀约详情
    goToDateDetail(date) {
      if (this.activeTab === 0) {
        // 我发起的邀约 - 跳转到发起邀约详情
        uni.navigateTo({
          url: `/pages/sponsor-date-detail/sponsor-date-detail?date_id=${date.date_id}`
        });
      } else {
        // 我参与的邀约 - 跳转到参与邀约详情
        uni.navigateTo({
          url: `/pages/join-date-detail/join-date-detail?date_id=${date.date_id}`
        });
      }
    },

    // 创建邀约
    goToCreateDate() {
      uni.navigateTo({
        url: '/pages/create-date/create-date'
      });
    },

    // 返回上一页
    navigateBack() {
      uni.navigateBack();
    }
  }
}
</script>

<style lang="scss" scoped>
.my-dates-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f8fff8 0%, #f0f9f0 100%);
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 16px;
  background-color: #fff;
  border-bottom: 1px solid #eee;

  .nav-back {
    display: flex;
    align-items: center;
    color: #07c160;
    
    .back-text {
      font-size: 24px;
      margin-right: 4px;
    }
    
    .back-label {
      font-size: 16px;
    }
  }

  .nav-title {
    flex: 1;
    text-align: center;
    font-size: 18px;
    font-weight: 500;
  }

  .nav-placeholder {
    width: 60px;
  }
}

.tabs {
  display: flex;
  background: white;
  border-bottom: 1rpx solid #eee;
  box-shadow: 0 2rpx 8rpx rgba(7, 193, 96, 0.1);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 30rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
  transition: all 0.3s ease;
  
  &.active {
    color: #07c160;
    font-weight: 500;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 80rpx;
      height: 4rpx;
      background: linear-gradient(135deg, #07c160, #05a050);
      border-radius: 2rpx;
      box-shadow: 0 2rpx 8rpx rgba(7, 193, 96, 0.3);
    }
  }
}

.content {
  flex: 1;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200rpx;
  
  .loading-text {
    font-size: 28rpx;
    color: #07c160;
  }
}

.error-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200rpx;
  
  .error-text {
    font-size: 28rpx;
    color: #ff4d4f;
    margin-bottom: 30rpx;
    text-align: center;
  }
  
  .retry-btn {
    background: linear-gradient(135deg, #07c160, #05a050);
    color: white;
    border: none;
    border-radius: 20rpx;
    padding: 16rpx 40rpx;
    font-size: 28rpx;
    box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.3);
  }
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  
  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 40rpx;
    opacity: 0.5;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: #07c160;
    text-align: center;
    margin-bottom: 60rpx;
  }
  
  .create-btn {
    background: linear-gradient(135deg, #07c160, #05a050);
    color: white;
    border: none;
    border-radius: 40rpx;
    padding: 20rpx 60rpx;
    font-size: 28rpx;
    font-weight: 500;
    box-shadow: 0 8rpx 30rpx rgba(7, 193, 96, 0.4);
  }
}

.dates-list {
  padding: 30rpx;
}

.date-item {
  background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 30rpx rgba(7, 193, 96, 0.1);
  border: 1rpx solid rgba(7, 193, 96, 0.1);
  transition: all 0.3s ease;
  
  &:active {
    background: linear-gradient(135deg, #f8fff8 0%, #f0f9f0 100%);
    transform: translateY(-2rpx);
    box-shadow: 0 12rpx 40rpx rgba(7, 193, 96, 0.15);
  }
}

.date-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.date-title {
  flex: 1;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
}

.date-status {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  margin-left: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
  
  &.status-active {
    background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
    color: #07c160;
  }
  
  &.status-completed {
    background: linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%);
    color: #689f38;
  }
  
  &.status-cancelled {
    background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
    color: #f44336;
  }
  
  &.status-confirmed {
    background: linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%);
    color: #689f38;
  }
  
  &.status-rejected {
    background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
    color: #f44336;
  }
  
  &.status-pending {
    background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
    color: #ffa000;
  }
}

.date-content {
  .date-info {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    margin-bottom: 20rpx;
    
    .info-item {
      font-size: 26rpx;
      color: #666;
    }
  }
  
  .date-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .feed-text {
      font-size: 26rpx;
      color: #07c160;
      font-weight: 500;
    }
    
    .budget-text {
      font-size: 26rpx;
      color: #e64340;
      font-weight: bold;
    }
  }
}

.participant-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(7, 193, 96, 0.1);
  
  .sponsor-text {
    font-size: 24rpx;
    color: #666;
  }
  
  .my-status {
    font-size: 24rpx;
    padding: 6rpx 16rpx;
    border-radius: 16rpx;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
    
    &.my-status-confirmed {
      background: linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%);
      color: #689f38;
    }
    
    &.my-status-rejected {
      background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
      color: #f44336;
    }
    
    &.my-status-pending {
      background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
      color: #ffa000;
    }
  }
}
</style>