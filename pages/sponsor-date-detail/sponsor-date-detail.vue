<template>
  <view class="sponsor-date-detail-container">

    <!-- 内容区域 -->
    <scroll-view class="content" scroll-y>
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 错误状态 -->
      <view v-else-if="error" class="error-container">
        <text class="error-text">{{ error }}</text>
        <button class="retry-btn" @click="fetchDateDetail">重试</button>
      </view>

      <!-- 内容区域 -->
      <view v-else-if="dateDetail" class="detail-content">
        <!-- 标题区域 -->
        <view class="title-section">
          <text class="main-title">{{ dateDetail.title || '未命名邀约' }}</text>
          <view class="status-badge" :class="getStatusClass(dateDetail)">
            <text class="status-text">{{ getStatusText(dateDetail) }}</text>
          </view>
        </view>

        <!-- 基本信息卡片 -->
        <view class="info-card">
          <view class="card-header">
            <text class="card-title">基本信息</text>
          </view>
          <view class="info-list">
            <view class="info-item">
              <view class="info-icon">📍</view>
              <view class="info-content">
                <text class="info-label">地点</text>
                <text class="info-value">{{ dateDetail.name || '未设置' }}</text>
              </view>
            </view>
            <view class="info-item">
              <view class="info-icon">⏰</view>
              <view class="info-content">
                <text class="info-label">时间</text>
                <text class="info-value">{{ dateDetail.time || '未设置' }}</text>
              </view>
            </view>
            <view class="info-item">
              <view class="info-icon">👥</view>
              <view class="info-content">
                <text class="info-label">人数</text>
                <text class="info-value">{{ dateDetail.confirms || 0 }}/{{ dateDetail.maxpersons || 0 }}人</text>
              </view>
            </view>
            <view class="info-item">
              <view class="info-icon">💰</view>
              <view class="info-content">
                <text class="info-label">报名费</text>
                <text class="info-value price">{{ dateDetail.signup_fee || 1 }}元</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 邀约详情 -->
        <view class="detail-section">
          <view class="section-header">邀约详情</view>
          <view class="detail-list">
            <view class="detail-item">
              <text class="detail-label">事由</text>
              <text class="detail-value">{{ dateDetail.reason || '暂无说明' }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">请吃内容</text>
              <text class="detail-value highlight">{{ dateDetail.feed || '暂无说明' }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">人均消费</text>
              <text class="detail-value price">￥{{ dateDetail.av_fee || 0 }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">参与者要求</text>
              <text class="detail-value">{{ dateDetail.demands || '无特定要求' }}</text>
            </view>
          </view>
        </view>

        <!-- 时间信息 -->
        <view class="time-section">
          <view class="section-header">时间安排</view>
          <view class="time-list">
            <view class="time-item">
              <text class="time-label">活动时间</text>
              <text class="time-value">{{ dateDetail.time || '未设置' }}</text>
            </view>
            <view class="time-item">
              <text class="time-label">报名截止</text>
              <text class="time-value">{{ dateDetail.deadline || '未设置' }}</text>
            </view>
          </view>
        </view>

        <!-- 统计信息 -->
        <view class="stats-section">
          <view class="stats-grid">
            <view class="stat-item">
              <text class="stat-number">{{ dateDetail.maxpersons || 0 }}</text>
              <text class="stat-label">预计人数</text>
            </view>
            <view class="stat-item">
              <text class="stat-number">{{ dateDetail.signups || 0 }}</text>
              <text class="stat-label">已报名</text>
            </view>
            <view class="stat-item">
              <text class="stat-number">{{ dateDetail.confirms || 0 }}</text>
              <text class="stat-label">已确认</text>
            </view>
          </view>
        </view>

        <!-- 报名名单 -->
        <view v-if="applications.length > 0" class="applications-section">
          <view class="section-header">报名名单</view>
          <view class="applications-list">
            <view 
              v-for="application in applications" 
              :key="application.application_id" 
              class="application-item"
              @click="goToSelectUser(application)"
            >
              <view class="application-avatar">
                <text class="avatar-text">{{ getAvatarText(application.username) }}</text>
              </view>
              <view class="application-info">
                <text class="application-name">{{ application.username || '未知用户' }}</text>
                <text class="application-intro">{{ application.intro || '暂无简介' }}</text>
              </view>
              <view class="application-status" :class="getApplicationStatusClass(application.status)">
                <text class="status-text">{{ getApplicationStatusText(application.status) }}</text>
              </view>
              <view class="application-arrow">›</view>
            </view>
          </view>
        </view>

        <!-- 空报名状态 -->
        <view v-else class="empty-applications">
          <view class="empty-icon">👥</view>
          <text class="empty-text">暂无用户报名</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      error: '',
      dateDetail: null,
      applications: [],
      dateId: null
    }
  },

  onLoad(options) {
    console.log('发起邀约详情页面加载，参数:', options);
    
    if (options && options.date_id) {
      this.dateId = options.date_id;
      this.fetchDateDetail();
    } else {
      this.error = '参数错误，缺少邀约ID';
    }
  },

  onPullDownRefresh() {
    console.log('下拉刷新');
    this.fetchDateDetail();
    setTimeout(() => {
      uni.stopPullDownRefresh();
    }, 1000);
  },

  methods: {
    // 获取邀约详情
    async fetchDateDetail() {
      this.loading = true;
      this.error = '';

      try {
        const userInfo = uni.getStorageSync('userInfo');
        const token = uni.getStorageSync('token');
        
        if (!userInfo || !token) {
          this.error = '请先登录';
          return;
        }

        const params = {
          userid: userInfo.userid,
          date_id: this.dateId,
          schoolid: userInfo.schoolid || userInfo.selectedSchoolId
        };

        console.log('请求邀约详情参数:', params);

        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: 'http://www.gongxiangfeng.com:12100/campusnav/getDateDetail',
            method: 'GET',
            data: params,
            header: {
              'content-type': 'application/json',
              'token': token
            },
            success: (res) => {
              resolve(res);
            },
            fail: (err) => {
              reject(err);
            }
          });
        });

        console.log('邀约详情响应:', res.data);

        if (res.data.code === 0) {
          this.dateDetail = {
            ...res.data.data,
            av_fee: Number(res.data.data.av_fee) || 0,
            maxpersons: Number(res.data.data.maxpersons) || 0,
            signups: Number(res.data.data.signups) || 0,
            confirms: Number(res.data.data.confirms) || 0,
            signup_fee: Number(res.data.data.signup_fee) || 1
          };
          
          // 获取报名名单
          this.fetchApplications();
        } else {
          this.error = res.data.message || '获取详情失败';
          // 使用模拟数据
          this.useMockData();
        }
      } catch (err) {
        console.error('获取邀约详情失败:', err);
        this.error = '网络错误，请重试';
        // 使用模拟数据
        this.useMockData();
      } finally {
        this.loading = false;
      }
    },

    // 获取报名名单
    async fetchApplications() {
      try {
        const userInfo = uni.getStorageSync('userInfo');
        const token = uni.getStorageSync('token');
        
        // 模拟获取报名名单数据
        // 实际项目中这里应该调用获取报名名单的接口
        this.applications = [
          {
            application_id: 1,
            userid: 1001,
            username: '指尖阳光',
            intro: '信工物联网2023，男，热爱生活，善于发现人们的需求点。担任学院生活委员已有两年',
            status: 'selected', // selected: 已选, pending: 待选
            message: '我对这个活动很感兴趣，希望能参与讨论。'
          },
          {
            application_id: 2,
            userid: 1002,
            username: '小猪',
            intro: '计算机学院软件工程专业，有丰富的产品设计经验',
            status: 'pending',
            message: '希望能和大家一起交流产品优化想法'
          },
          {
            application_id: 3,
            userid: 1003,
            username: '会飞的鱼',
            intro: '设计学院视觉传达专业，擅长用户体验设计',
            status: 'pending',
            message: '对校园应用设计很感兴趣'
          }
        ];
        
      } catch (err) {
        console.error('获取报名名单失败:', err);
      }
    },

    // 使用模拟数据
    useMockData() {
      this.dateDetail = {
        date_id: this.dateId,
        title: '校园生活产品优化讨论会',
        name: '韵江南餐厅',
        time: '2025年3月20日 周三 17:30-19:30',
        deadline: '2025年3月20日 周三 12:00',
        confirms: 1,
        maxpersons: 3,
        signup_fee: 1,
        reason: '讨论如何提升校园生活应用的用户体验和功能完善',
        feed: '喝奶茶，吃点心',
        av_fee: 10,
        demands: '能提出可行的优化建议，有产品设计经验者优先',
        signups: 6,
        status: 'active'
      };
      
      this.applications = [
        {
          application_id: 1,
          userid: 1001,
          username: '指尖阳光',
          intro: '信工物联网2023，男，热爱生活，善于发现人们的需求点。担任学院生活委员已有两年',
          status: 'selected',
          message: '我对这个活动很感兴趣，希望能参与讨论。'
        },
        {
          application_id: 2,
          userid: 1002,
          username: '小猪',
          intro: '计算机学院软件工程专业，有丰富的产品设计经验',
          status: 'pending',
          message: '希望能和大家一起交流产品优化想法'
        }
      ];
    },

    // 获取头像文本
    getAvatarText(username) {
      if (!username) return '?';
      return username.charAt(0).toUpperCase();
    },

    // 获取状态样式
    getStatusClass(date) {
      if (date.status === 'completed') return 'status-completed';
      if (date.status === 'cancelled') return 'status-cancelled';
      return 'status-active';
    },

    // 获取状态文本
    getStatusText(date) {
      if (date.status === 'completed') return '已结束';
      if (date.status === 'cancelled') return '已取消';
      return '进行中';
    },

    // 获取报名状态样式
    getApplicationStatusClass(status) {
      if (status === 'selected') return 'app-status-selected';
      if (status === 'rejected') return 'app-status-rejected';
      return 'app-status-pending';
    },

    // 获取报名状态文本
    getApplicationStatusText(status) {
      if (status === 'selected') return '已选';
      if (status === 'rejected') return '未选';
      return '待选';
    },

    // 跳转到选择用户页面
    goToSelectUser(application) {
      uni.navigateTo({
        url: `/pages/select-user/select-user?date_id=${this.dateId}&application_id=${application.application_id}&userid=${application.userid}`
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
.sponsor-date-detail-container {
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

.detail-content {
  padding: 30rpx;
}

.title-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  box-shadow: 0 8rpx 30rpx rgba(7, 193, 96, 0.1);
  border: 1rpx solid rgba(7, 193, 96, 0.1);
  
  .main-title {
    flex: 1;
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    line-height: 1.4;
  }
  
  .status-badge {
    padding: 12rpx 20rpx;
    border-radius: 20rpx;
    font-size: 24rpx;
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
  }
}

.info-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 30rpx rgba(7, 193, 96, 0.1);
  border: 1rpx solid rgba(7, 193, 96, 0.1);

  .card-header {
    margin-bottom: 20rpx;
    
    .card-title {
      font-size: 28rpx;
      font-weight: bold;
      color: #07c160;
    }
  }

  .info-list {
    .info-item {
      display: flex;
      align-items: center;
      padding: 20rpx 0;
      border-bottom: 1rpx solid rgba(7, 193, 96, 0.1);

      &:last-child {
        border-bottom: none;
      }

      .info-icon {
        font-size: 32rpx;
        margin-right: 20rpx;
        width: 40rpx;
        text-align: center;
        color: #07c160;
      }

      .info-content {
        flex: 1;
        display: flex;
        flex-direction: column;

        .info-label {
          font-size: 24rpx;
          color: #999;
          margin-bottom: 8rpx;
        }

        .info-value {
          font-size: 28rpx;
          color: #333;
          
          &.price {
            color: #e64340;
            font-weight: bold;
          }
        }
      }
    }
  }
}

.detail-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 30rpx rgba(7, 193, 96, 0.1);
  border: 1rpx solid rgba(7, 193, 96, 0.1);

  .section-header {
    font-size: 28rpx;
    font-weight: bold;
    margin-bottom: 20rpx;
    color: #07c160;
  }

  .detail-list {
    .detail-item {
      margin-bottom: 24rpx;
      
      &:last-child {
        margin-bottom: 0;
      }

      .detail-label {
        display: block;
        font-size: 26rpx;
        color: #666;
        margin-bottom: 8rpx;
        font-weight: 500;
      }

      .detail-value {
        display: block;
        font-size: 28rpx;
        color: #333;
        line-height: 1.6;
        
        &.highlight {
          color: #07c160;
          font-weight: 500;
        }
        
        &.price {
          color: #e64340;
          font-weight: bold;
        }
      }
    }
  }
}

.time-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 30rpx rgba(7, 193, 96, 0.1);
  border: 1rpx solid rgba(7, 193, 96, 0.1);

  .section-header {
    font-size: 28rpx;
    font-weight: bold;
    margin-bottom: 20rpx;
    color: #07c160;
  }

  .time-list {
    .time-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20rpx 0;
      border-bottom: 1rpx solid rgba(7, 193, 96, 0.1);

      &:last-child {
        border-bottom: none;
      }

      .time-label {
        font-size: 26rpx;
        color: #666;
      }

      .time-value {
        font-size: 26rpx;
        color: #333;
        font-weight: 500;
      }
    }
  }
}

.stats-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 30rpx rgba(7, 193, 96, 0.1);
  border: 1rpx solid rgba(7, 193, 96, 0.1);

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20rpx;

    .stat-item {
      text-align: center;
      
      .stat-number {
        display: block;
        font-size: 36rpx;
        font-weight: bold;
        color: #07c160;
        margin-bottom: 8rpx;
        text-shadow: 0 2rpx 4rpx rgba(7, 193, 96, 0.2);
      }
      
      .stat-label {
        font-size: 24rpx;
        color: #666;
      }
    }
  }
}

.applications-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 30rpx rgba(7, 193, 96, 0.1);
  border: 1rpx solid rgba(7, 193, 96, 0.1);

  .section-header {
    font-size: 28rpx;
    font-weight: bold;
    margin-bottom: 20rpx;
    color: #07c160;
  }

  .applications-list {
    .application-item {
      display: flex;
      align-items: center;
      padding: 24rpx 0;
      border-bottom: 1rpx solid rgba(7, 193, 96, 0.1);
      transition: all 0.3s ease;

      &:last-child {
        border-bottom: none;
      }

      &:active {
        background: rgba(7, 193, 96, 0.05);
        border-radius: 12rpx;
      }

      .application-avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        margin-right: 20rpx;
        background: linear-gradient(135deg, #07c160 0%, #05a050 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.3);
      }

      .avatar-text {
        font-size: 32rpx;
        font-weight: bold;
        color: white;
      }

      .application-info {
        flex: 1;
        display: flex;
        flex-direction: column;

        .application-name {
          font-size: 28rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 8rpx;
        }

        .application-intro {
          font-size: 24rpx;
          color: #666;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }

      .application-status {
        padding: 8rpx 16rpx;
        border-radius: 20rpx;
        font-size: 22rpx;
        margin-right: 16rpx;
        box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
        
        &.app-status-selected {
          background: linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%);
          color: #689f38;
        }
        
        &.app-status-rejected {
          background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
          color: #f44336;
        }
        
        &.app-status-pending {
          background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
          color: #ffa000;
        }
      }

      .application-arrow {
        font-size: 32rpx;
        color: #07c160;
      }
    }
  }
}

.empty-applications {
  background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
  border-radius: 20rpx;
  padding: 60rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 30rpx rgba(7, 193, 96, 0.1);
  border: 1rpx solid rgba(7, 193, 96, 0.1);
  
  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 30rpx;
    opacity: 0.5;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: #07c160;
    text-align: center;
  }
}
</style>