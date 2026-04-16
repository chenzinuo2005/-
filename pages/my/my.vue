<template>
  <view class="my-container">
    <!-- 调试信息 - 开发时可以开启 -->
    <view class="debug-info" v-if="false" style="padding: 20rpx; background: #f0f0f0; font-size: 24rpx;">
      <text>登录状态: {{ isLoggedIn }}</text>
      <text>用户ID: {{ userInfo.userid }}</text>
      <text>用户名: {{ userInfo.username }}</text>
      <text>学校ID: {{ userInfo.schoolid }}</text>
      <text>学校名称: {{ userInfo.schoolname }}</text>
    </view>
    
    <!-- 手动刷新按钮 -->
    <view class="refresh-btn" @click="forceRefresh" v-if="false" style="position: fixed; top: 100rpx; right: 30rpx; background: linear-gradient(135deg, #07c160, #05a050); color: white; padding: 20rpx; border-radius: 10rpx; z-index: 9999; box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.3);">
      <text>手动刷新状态</text>
    </view>
    
    <!-- 顶部空白区域 -->
    <view class="top-space"></view>
    
    <!-- 用户信息区域 -->
    <view class="user-info-section" v-if="isLoggedIn">
      <view class="user-avatar">
        <text class="avatar-text">{{ getAvatarText(userInfo.username) }}</text>
      </view>
      <view class="user-details">
        <text class="username">{{ userInfo.username || '用户' }}</text>
        <text class="school">{{ userInfo.schoolname || '未绑定学校' }}</text>
        <text class="school-id">学校ID: {{ userInfo.schoolid || '未设置' }}</text>
        <view class="user-tags" v-if="userInfo.student">
          <text class="tag">{{ userInfo.student.depart }}学院{{ userInfo.student.major }}</text>
          <text class="tag">{{ userInfo.student.grade }}班，{{ getUserTypeText(userInfo.usertype) }}，{{ userInfo.sex || '未知' }}</text>
        </view>
        <view class="user-tags" v-else-if="userInfo.name || userInfo.phone">
          <text class="tag">{{ userInfo.name || '' }}</text>
          <text class="tag">{{ userInfo.phone || '' }}</text>
        </view>
        <view class="admin-tag" v-if="userInfo.auth === 5">
          <text class="admin-text">管理员</text>
        </view>
      </view>
    </view>

    <!-- 未登录状态 -->
    <view class="login-prompt" v-else>
      <view class="login-avatar">
        <text class="avatar-text">?</text>
      </view>
      <view class="login-text">
        <text class="login-title">登录/注册</text>
        <text class="login-desc">登录后享受完整服务</text>
      </view>
      <button class="login-btn" @click="goToLogin">立即登录</button>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section" v-if="isLoggedIn">
      <view class="menu-grid">
        <view class="menu-item" @click="goToMyRunning">
          <view class="menu-icon running-icon">
            <text class="icon-text">🚴</text>
          </view>
          <text class="menu-text">我的跑腿</text>
        </view>
        <view class="menu-item" @click="goToMyDates">
          <view class="menu-icon date-icon">
            <text class="icon-text">📅</text>
          </view>
          <text class="menu-text">我的邀约</text>
        </view>
        <view class="menu-item" @click="goToOrders">
          <view class="menu-icon order-icon">
            <text class="icon-text">📦</text>
          </view>
          <text class="menu-text">订单</text>
        </view>
        <view class="menu-item" @click="goToBindSchool">
          <view class="menu-icon school-icon">
            <text class="icon-text">🏫</text>
          </view>
          <text class="menu-text">绑定学校</text>
        </view>
      </view>

      <view class="menu-list">
        <!-- 修改密码 -->
        <view class="menu-row" @click="toggleChangePassword">
          <view class="menu-left">
            <view class="row-icon password-icon">
              <text class="row-icon-text">🔒</text>
            </view>
            <text class="row-text">修改密码</text>
          </view>
          <view class="arrow-icon" :class="{ rotated: showChangePassword }">›</view>
        </view>
        
        <!-- 修改密码表单 -->
        <view class="change-password-form" v-if="showChangePassword">
          <view class="form-item">
            <text class="form-label">原密码</text>
            <input 
              v-model="passwordForm.oldPassword" 
              class="form-input" 
              type="password"
              placeholder="请输入原密码"
              placeholder-class="placeholder"
              maxlength="20"
            />
          </view>
          <view class="form-item">
            <text class="form-label">新密码</text>
            <input 
              v-model="passwordForm.newPassword" 
              class="form-input" 
              type="password"
              placeholder="请输入新密码"
              placeholder-class="placeholder"
              maxlength="20"
            />
          </view>
          <view class="form-item">
            <text class="form-label">确认新密码</text>
            <input 
              v-model="passwordForm.confirmPassword" 
              class="form-input" 
              type="password"
              placeholder="请再次输入新密码"
              placeholder-class="placeholder"
              maxlength="20"
            />
          </view>
          <view class="form-actions">
            <button class="cancel-btn" @click="cancelChangePassword">取消</button>
            <button class="confirm-btn" @click="handleChangePassword" :disabled="!isPasswordFormValid || loading">
              {{ loading ? '修改中...' : '确认修改' }}
            </button>
          </view>
        </view>

        <!-- 完善信息 -->
        <view class="menu-row" @click="goToCompleteInfo">
          <view class="menu-left">
            <view class="row-icon info-icon">
              <text class="row-icon-text">👤</text>
            </view>
            <text class="row-text">完善信息</text>
          </view>
          <view class="arrow-icon">›</view>
        </view>

        <!-- 用户协议 -->
        <view class="menu-row" @click="goToUserContract">
          <view class="menu-left">
            <view class="row-icon contract-icon">
              <text class="row-icon-text">📄</text>
            </view>
            <text class="row-text">用户协议</text>
          </view>
          <view class="arrow-icon">›</view>
        </view>

        <!-- 退出登录 -->
        <view class="menu-row" @click="handleLogout" v-if="isLoggedIn">
          <view class="menu-left">
            <view class="row-icon logout-icon">
              <text class="row-icon-text">🚪</text>
            </view>
            <text class="row-text logout-text">退出登录</text>
          </view>
          <view class="arrow-icon">›</view>
        </view>
      </view>
    </view>

    <!-- 未登录时的提示 -->
    <view class="menu-section" v-else>
      <view class="login-reminder">
        <text class="reminder-text">请先登录以使用完整功能</text>
      </view>
    </view>
  </view>
</template>

<script>
import store from '@/utils/store.js';

export default {
  data() {
    return {
      isLoggedIn: false,
      userInfo: {},
      showChangePassword: false,
      loading: false,
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      unsubscribe: null
    }
  },
  
  computed: {
    isPasswordFormValid() {
      const form = this.passwordForm;
      return (
        form.oldPassword.trim() !== '' &&
        form.newPassword.trim() !== '' &&
        form.confirmPassword.trim() !== '' &&
        form.newPassword === form.confirmPassword
      );
    }
  },
  
  onLoad() {
    console.log('我的页面 onLoad');
    this.initializePage();
    
    // 订阅store变化
    this.unsubscribe = store.subscribe((isLoggedIn, userInfo) => {
      console.log('我的页面收到store更新:', { isLoggedIn, userInfo });
      this.isLoggedIn = isLoggedIn;
      this.userInfo = userInfo;
      this.$forceUpdate();
    });
  },
  
  onShow() {
    console.log('我的页面 onShow - 检查登录状态和学校信息');
    this.initializePage();
  },
  
  onUnload() {
    // 取消订阅
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  },
  
  onPullDownRefresh() {
    console.log('下拉刷新 - 检查登录状态');
    this.initializePage();
    setTimeout(() => {
      uni.stopPullDownRefresh();
    }, 1000);
  },
  
  methods: {
    initializePage() {
      console.log('初始化页面状态');
      
      // 从store获取状态
      this.isLoggedIn = store.isLoggedIn;
      this.userInfo = store.userInfo;
      
      // 如果store中没有学校信息，尝试从本地存储读取
      if (this.isLoggedIn && (!this.userInfo.schoolid || !this.userInfo.schoolname)) {
        console.log('从本地存储补充学校信息');
        const schoolid = uni.getStorageSync('schoolid');
        const schoolname = uni.getStorageSync('schoolname');
        
        if (schoolid && schoolname) {
          this.userInfo.schoolid = schoolid;
          this.userInfo.schoolname = schoolname;
          // 更新store
          store.updateUserInfo(this.userInfo);
        }
      }
      
      console.log('页面状态初始化完成:', {
        isLoggedIn: this.isLoggedIn,
        userInfo: this.userInfo
      });
      
      this.$forceUpdate();
    },
    
    // 强制刷新状态
    forceRefresh() {
      console.log('手动刷新状态');
      store.checkLoginStatus();
      this.initializePage();
      uni.showToast({
        title: '状态已刷新',
        icon: 'success'
      });
    },
    
    // 获取用户类型文本
    getUserTypeText(usertype) {
      const typeMap = {
        0: '普通用户',
        1: '学生',
        2: '教师',
        3: '职工',
        5: '管理员'
      };
      return typeMap[usertype] || '用户';
    },
    
    // 获取头像文本
    getAvatarText(username) {
      if (!username) return '?';
      return username.charAt(0).toUpperCase();
    },
    
    toggleChangePassword() {
      if (!this.isLoggedIn) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      this.showChangePassword = !this.showChangePassword;
      if (!this.showChangePassword) {
        this.resetPasswordForm();
      }
    },
    
    cancelChangePassword() {
      this.showChangePassword = false;
      this.resetPasswordForm();
    },
    
    resetPasswordForm() {
      this.passwordForm = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    },
    
    async handleChangePassword() {
      if (!this.isPasswordFormValid) {
        uni.showToast({
          title: '请填写完整且一致的密码信息',
          icon: 'none'
        });
        return;
      }

      if (this.passwordForm.newPassword.trim() === '') {
        uni.showToast({
          title: '新密码不能为空',
          icon: 'none'
        });
        return;
      }

      this.loading = true;

      try {
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url: 'http://www.gongxiangfeng.com:12100/campusnav/modPwd',
            method: 'POST',
            data: {
              userid: this.userInfo.userid,
              oldpwd: this.passwordForm.oldPassword,
              newpwd: this.passwordForm.newPassword
            },
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

        console.log('修改密码响应:', result);

        if (result.data.code === 0) {
          uni.showToast({
            title: '密码修改成功',
            icon: 'success',
            duration: 2000
          });
          
          setTimeout(() => {
            this.resetPasswordForm();
            this.showChangePassword = false;
          }, 1500);
          
        } else {
          let errorMsg = '密码修改失败';
          if (result.data.message) {
            errorMsg = result.data.message;
          } else if (result.data.code === 1) {
            errorMsg = '原密码错误或新密码不符合要求';
          }
          
          uni.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 3000
          });
        }
      } catch (error) {
        console.error('修改密码错误:', error);
        uni.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    goToLogin() {
      uni.navigateTo({
        url: '/pages/login/login'
      });
    },
    
    goToMyRunning() {
      if (!this.isLoggedIn) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      uni.navigateTo({
        url: '/pages/my-running/my-running'
      });
    },
    
    goToMyDates() {
      if (!this.isLoggedIn) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      uni.navigateTo({
        url: '/pages/my-dates/my-dates'
      });
    },
    
    goToOrders() {
      if (!this.isLoggedIn) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      uni.navigateTo({
        url: '/pages/orders/orders'
      });
    },
    
    goToBindSchool() {
      if (!this.isLoggedIn) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      uni.navigateTo({
        url: '/pages/bind-school/bind-school'
      });
    },
    
    goToCompleteInfo() {
      if (!this.isLoggedIn) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      uni.navigateTo({
        url: '/pages/complete-info/complete-info'
      });
    },
    
    goToUserContract() {
      uni.navigateTo({
        url: '/pages/user-contract/user-contract'
      });
    },
    
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            store.logout();
            this.isLoggedIn = false;
            this.userInfo = {};
            uni.showToast({
              title: '已退出登录',
              icon: 'success'
            });
            
            setTimeout(() => {
              uni.switchTab({
                url: '/pages/index/index'
              });
            }, 1500);
          }
        }
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.my-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fff8 0%, #f0f9f0 50%, #e8f5e9 100%);
}

.top-space {
  height: 120rpx;
  background: linear-gradient(135deg, #f8fff8 0%, #f0f9f0 100%);
}

.user-info-section {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 25%, #07c160 50%, #05a050 75%, #048c48 100%);
  padding: 60rpx 40rpx 40rpx;
  display: flex;
  align-items: center;
  color: white;
  position: relative;
  overflow: hidden;
}

.user-info-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
  animation: shimmer 3s infinite linear;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-right: 30rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 20rpx rgba(0,0,0,0.2);
  position: relative;
  z-index: 2;
}

.avatar-text {
  font-size: 48rpx;
  font-weight: bold;
  color: white;
}

.user-details {
  flex: 1;
  position: relative;
  z-index: 2;
}

.username {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
  text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.2);
}

.school {
  display: block;
  font-size: 28rpx;
  opacity: 0.9;
  margin-bottom: 8rpx;
}

.school-id {
  display: block;
  font-size: 24rpx;
  opacity: 0.7;
  margin-bottom: 16rpx;
}

.user-tags {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.tag {
  font-size: 24rpx;
  opacity: 0.8;
}

.admin-tag {
  margin-top: 16rpx;
  background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%);
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  align-self: flex-start;
  backdrop-filter: blur(10rpx);
  border: 1rpx solid rgba(255,255,255,0.2);
}

.admin-text {
  font-size: 22rpx;
  font-weight: bold;
}

.login-prompt {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 25%, #07c160 50%, #05a050 75%, #048c48 100%);
  padding: 60rpx 40rpx 40rpx;
  display: flex;
  align-items: center;
  color: white;
  position: relative;
  overflow: hidden;
}

.login-prompt::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
  animation: shimmer 3s infinite linear;
}

.login-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-right: 30rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 20rpx rgba(0,0,0,0.2);
  position: relative;
  z-index: 2;
}

.login-text {
  flex: 1;
  position: relative;
  z-index: 2;
}

.login-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
  text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.2);
}

.login-desc {
  display: block;
  font-size: 26rpx;
  opacity: 0.9;
}

.login-btn {
  background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%);
  color: white;
  border: 2rpx solid rgba(255, 255, 255, 0.5);
  border-radius: 40rpx;
  padding: 16rpx 32rpx;
  font-size: 26rpx;
  backdrop-filter: blur(10rpx);
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.2);
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
}

.login-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.2);
}

.menu-section {
  padding: 30rpx 0;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40rpx;
  padding: 40rpx;
  background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
  margin-bottom: 20rpx;
  border-radius: 20rpx;
  margin: 0 30rpx 20rpx;
  box-shadow: 0 8rpx 30rpx rgba(7, 193, 96, 0.1);
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  transition: all 0.3s ease;
}

.menu-item:active {
  transform: scale(0.95);
}

.menu-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 25rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  box-shadow: 0 6rpx 20rpx rgba(7, 193, 96, 0.2);
  transition: all 0.3s ease;
}

.menu-item:active .menu-icon {
  transform: scale(0.9);
  box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.3);
}

.running-icon {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.date-icon {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.order-icon {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.school-icon {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.icon-text {
  font-size: 36rpx;
}

.menu-text {
  font-size: 24rpx;
  color: #333;
  font-weight: 500;
}

.menu-list {
  background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
  padding: 0 40rpx;
  border-radius: 20rpx;
  margin: 0 30rpx;
  box-shadow: 0 8rpx 30rpx rgba(7, 193, 96, 0.1);
  overflow: hidden;
}

.menu-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  transition: all 0.3s ease;
}

.menu-row:active {
  background-color: rgba(7, 193, 96, 0.05);
}

.menu-row:last-child {
  border-bottom: none;
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.row-icon {
  width: 50rpx;
  height: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}

.password-icon {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.info-icon {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.contract-icon {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.logout-icon {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
}

.row-icon-text {
  font-size: 24rpx;
}

.row-text {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.logout-text {
  color: #ff4444;
}

.arrow-icon {
  font-size: 36rpx;
  color: #07c160;
  font-weight: bold;
  transition: transform 0.3s ease;
}

.arrow-icon.rotated {
  transform: rotate(90deg);
}

.change-password-form {
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  margin: 0 -40rpx;
  padding-left: 40rpx;
  padding-right: 40rpx;
  border-radius: 0 0 20rpx 20rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.form-input {
  width: 100%;
  height: 80rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}

.form-input:focus {
  border-color: #07c160;
  box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.2);
}

.placeholder {
  color: #ccc;
  font-size: 28rpx;
}

.form-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  height: 80rpx;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}

.cancel-btn {
  background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
  color: #333;
}

.cancel-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
}

.confirm-btn {
  background: linear-gradient(135deg, #07c160 0%, #05a050 50%, #048c48 100%);
  color: white;
}

.confirm-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(7, 193, 96, 0.3);
}

.confirm-btn:disabled {
  background: linear-gradient(135deg, #ccc 0%, #bbb 100%);
  color: #999;
  box-shadow: none;
}

.login-reminder {
  background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
  padding: 60rpx 40rpx;
  text-align: center;
  border-radius: 20rpx;
  margin: 0 30rpx;
  box-shadow: 0 8rpx 30rpx rgba(7, 193, 96, 0.1);
}

.reminder-text {
  font-size: 28rpx;
  color: #07c160;
  font-weight: 500;
}
</style>