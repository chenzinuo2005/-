<template>
  <view class="login-container">
    <!-- 顶部背景 -->
    <view class="header-bg">
      <text class="app-title">广商校园生活</text>
      <text class="app-subtitle">开启绿色校园之旅</text>
    </view>
    
    <!-- 登录卡片 -->
    <view class="login-card">
      <!-- 切换标签 -->
      <view class="tab-container">
        <view 
          class="tab-item" 
          :class="{ active: currentTab === 'login' }"
          @click="switchTab('login')"
        >
          登录
        </view>
        <view 
          class="tab-item" 
          :class="{ active: currentTab === 'register' }"
          @click="switchTab('register')"
        >
          注册
        </view>
      </view>
      
      <!-- 登录表单 -->
      <view class="form-container" v-if="currentTab === 'login'">
        <view class="input-group">
          <view class="input-item">
            <text class="label">用户名</text>
            <input 
              v-model="loginForm.username" 
              class="input" 
              placeholder="请输入用户名" 
              placeholder-class="placeholder"
            />
          </view>
          <view class="input-item">
            <text class="label">密码</text>
            <input 
              v-model="loginForm.password" 
              class="input" 
              password 
              placeholder="请输入密码" 
              placeholder-class="placeholder"
            />
          </view>
          <view class="input-item">
            <text class="label">选择学校</text>
            <view class="school-picker" @click="showSchoolPicker = true">
              <text class="school-text" :class="{ placeholder: !selectedSchool.name }">
                {{ selectedSchool.name || '请选择学校' }}
              </text>
              <text class="picker-arrow">▼</text>
            </view>
          </view>
        </view>
        
        <button class="login-btn" @click="handleLogin" :disabled="loading || !selectedSchool.id">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </view>
      
      <!-- 注册表单 -->
      <view class="form-container" v-else>
        <view class="input-group">
          <view class="input-item">
            <text class="label">用户名</text>
            <input 
              v-model="registerForm.username" 
              class="input" 
              placeholder="请输入用户名" 
              placeholder-class="placeholder"
            />
          </view>
          <view class="input-item">
            <text class="label">密码</text>
            <input 
              v-model="registerForm.password" 
              class="input" 
              password 
              placeholder="请输入密码" 
              placeholder-class="placeholder"
            />
          </view>
          <view class="input-item">
            <text class="label">确认密码</text>
            <input 
              v-model="registerForm.confirmPassword" 
              class="input" 
              password 
              placeholder="请再次输入密码" 
              placeholder-class="placeholder"
            />
          </view>
          <view class="input-item">
            <text class="label">选择学校</text>
            <view class="school-picker" @click="showSchoolPicker = true">
              <text class="school-text" :class="{ placeholder: !selectedSchool.name }">
                {{ selectedSchool.name || '请选择学校' }}
              </text>
              <text class="picker-arrow">▼</text>
            </view>
          </view>
        </view>
        
        <view class="agreement">
          <label class="checkbox">
            <checkbox 
              :checked="agreementChecked" 
              @click="agreementChecked = !agreementChecked" 
              style="transform:scale(0.7)"
            />
            <text class="agreement-text">我同意</text>
          </label>
          <text class="protocol-link" @click="showProtocolModal">《用户协议》</text>
        </view>
        
        <button 
          class="register-btn" 
          @click="handleRegister" 
          :disabled="loading || !agreementChecked || !selectedSchool.id"
          :class="{ disabled: !agreementChecked || !selectedSchool.id }"
        >
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </view>
    </view>
    
    <!-- 错误提示 -->
    <view class="error-message" v-if="errorMessage">
      {{ errorMessage }}
    </view>

    <!-- 学校选择器 -->
    <view class="modal-mask" v-if="showSchoolPicker" @click="showSchoolPicker = false">
      <view class="modal-content school-picker-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">选择学校</text>
          <text class="modal-close" @click="showSchoolPicker = false">×</text>
        </view>
        <view class="modal-body">
          <scroll-view class="school-list" scroll-y>
            <view 
              v-for="school in availableSchools" 
              :key="school.id"
              class="school-item"
              :class="{ selected: selectedSchool.id === school.id }"
              @click="selectSchool(school)"
            >
              <text class="school-name">{{ school.name }}</text>
              <text class="check-icon" v-if="selectedSchool.id === school.id">✓</text>
            </view>
          </scroll-view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn primary" @click="showSchoolPicker = false">确定</button>
        </view>
      </view>
    </view>

    <!-- 用户协议弹窗 -->
    <view class="modal-mask" v-if="showProtocolModalVisible" @click="hideProtocolModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">用户协议</text>
          <text class="modal-close" @click="hideProtocolModal">×</text>
        </view>
        <view class="modal-body">
          <scroll-view class="protocol-preview" scroll-y>
            <text class="protocol-text">
              欢迎使用广商校园生活应用！在使用本应用前，请您仔细阅读并理解以下用户协议。本协议涉及您的权利义务，特别是关于账号使用、隐私保护、责任限制等重要内容。
            </text>
            <text class="protocol-text">
              点击"查看完整协议"按钮可以阅读完整的用户协议内容。如果您同意本协议的所有条款，请勾选同意并完成注册。
            </text>
          </scroll-view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn secondary" @click="hideProtocolModal">取消</button>
          <button class="modal-btn primary" @click="goToFullProtocol">查看完整协议</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import store from '@/utils/store.js';

const currentTab = ref('login');
const loading = ref(false);
const errorMessage = ref('');
const agreementChecked = ref(false);
const showProtocolModalVisible = ref(false);
const showSchoolPicker = ref(false);

// 学校列表 - 根据实际情况可能需要从API获取
const availableSchools = ref([
  { id: 281474976710657, name: '广州商学院' }
  // 可以添加更多学校
]);

// 选择的学校
const selectedSchool = reactive({
  id: null,
  name: ''
});

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
});

// 注册表单数据
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
});

// 组件挂载时检查本地存储的学校信息
onMounted(() => {
  // 尝试从本地存储读取之前选择的学校
  const savedSchoolId = uni.getStorageSync('schoolid');
  const savedSchoolName = uni.getStorageSync('schoolname');
  
  if (savedSchoolId && savedSchoolName) {
    selectedSchool.id = savedSchoolId;
    selectedSchool.name = savedSchoolName;
  } else if (availableSchools.value.length > 0) {
    // 默认选择第一个学校
    selectSchool(availableSchools.value[0]);
  }
  
  console.log('登录页面初始化 - 选择的学校:', selectedSchool);
});

// 选择学校
const selectSchool = (school) => {
  selectedSchool.id = school.id;
  selectedSchool.name = school.name;
  
  // 立即保存到本地存储
  uni.setStorageSync('schoolid', school.id);
  uni.setStorageSync('schoolname', school.name);
  
  console.log('学校选择更新:', school);
};

// 切换登录/注册标签
const switchTab = (tab) => {
  currentTab.value = tab;
  errorMessage.value = '';
};

// 显示用户协议弹窗
const showProtocolModal = () => {
  showProtocolModalVisible.value = true;
};

// 隐藏用户协议弹窗
const hideProtocolModal = () => {
  showProtocolModalVisible.value = false;
};

// 跳转到完整用户协议页面
const goToFullProtocol = () => {
  hideProtocolModal();
  uni.navigateTo({
    url: '/pages/user-contract/user-contract'
  });
};

// 处理登录
const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    errorMessage.value = '请输入用户名和密码';
    return;
  }

  if (!selectedSchool.id) {
    errorMessage.value = '请选择学校';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await uni.request({
      url: 'http://www.gongxiangfeng.com:12100/campusnav/login',
      method: 'POST',
      data: {
        username: loginForm.username,
        password: loginForm.password
      },
      header: {
        'content-type': 'application/json'
      }
    });

    console.log('登录响应:', result);

    if (result.data.code === 0) {
      const { token, data: userInfo } = result.data;
      
      console.log('登录成功，用户信息:', userInfo);
      
      // 验证必要字段
      if (!userInfo.userid) {
        console.error('登录响应中缺少必要字段 userid:', userInfo);
        errorMessage.value = '登录信息不完整，请联系管理员';
        loading.value = false;
        return;
      }
      
      // 使用用户选择的学校ID覆盖API返回的schoolid
      // 确保用户绑定到他们选择的学校
      const finalUserInfo = {
        ...userInfo,
        schoolid: selectedSchool.id,
        schoolname: selectedSchool.name
      };
      
      console.log('最终用户信息（包含选择的学校）:', finalUserInfo);
      
      // 保存到本地存储
      uni.setStorageSync('userid', finalUserInfo.userid);
      uni.setStorageSync('token', token);
      uni.setStorageSync('schoolid', selectedSchool.id);
      uni.setStorageSync('schoolname', selectedSchool.name);
      uni.setStorageSync('userInfo', JSON.stringify(finalUserInfo));
      
      // 更新store状态
      store.login(token, finalUserInfo);
      
      // 显示成功提示
      uni.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 2000
      });
      
      // 延迟跳转，确保数据保存完成
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/my/my',
          success: () => {
            console.log('跳转到我的页面成功，学校ID:', selectedSchool.id);
          },
          fail: (err) => {
            console.error('跳转失败:', err);
          }
        });
      }, 1500);
      
    } else {
      errorMessage.value = result.data.message || '登录失败，请检查用户名和密码';
    }
  } catch (error) {
    console.error('登录错误:', error);
    errorMessage.value = '网络错误，请重试';
  } finally {
    loading.value = false;
  }
};

// 处理注册
const handleRegister = async () => {
  if (!registerForm.username || !registerForm.password) {
    errorMessage.value = '请输入用户名和密码';
    return;
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致';
    return;
  }

  if (!agreementChecked.value) {
    errorMessage.value = '请同意用户协议';
    return;
  }

  if (!selectedSchool.id) {
    errorMessage.value = '请选择学校';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await uni.request({
      url: 'http://www.gongxiangfeng.com:12100/campusnav/register',
      method: 'POST',
      data: {
        username: registerForm.username,
        password: registerForm.password
      },
      header: {
        'content-type': 'application/json'
      }
    });

    console.log('注册响应:', result);

    if (result.data.code === 0) {
      const { token, data: userInfo } = result.data;
      
      console.log('注册成功，用户信息:', userInfo);
      
      if (!userInfo.userid) {
        console.error('注册响应中缺少必要字段 userid:', userInfo);
        errorMessage.value = '注册信息不完整，请联系管理员';
        loading.value = false;
        return;
      }
      
      // 使用用户选择的学校ID
      const finalUserInfo = {
        ...userInfo,
        schoolid: selectedSchool.id,
        schoolname: selectedSchool.name
      };
      
      // 保存到本地存储
      uni.setStorageSync('userid', finalUserInfo.userid);
      uni.setStorageSync('token', token);
      uni.setStorageSync('schoolid', selectedSchool.id);
      uni.setStorageSync('schoolname', selectedSchool.name);
      uni.setStorageSync('userInfo', JSON.stringify(finalUserInfo));
      
      // 更新store状态
      store.login(token, finalUserInfo);
      
      uni.showToast({
        title: '注册成功',
        icon: 'success',
        duration: 2000
      });
      
      // 延迟跳转
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/my/my',
          success: () => {
            console.log('注册后跳转到我的页面成功，学校ID:', selectedSchool.id);
          }
        });
      }, 1500);
      
    } else {
      errorMessage.value = result.data.message || '注册失败，请重试';
    }
  } catch (error) {
    console.error('注册错误:', error);
    errorMessage.value = '网络错误，请重试';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 20%, #07c160 40%, #05a050 60%, #048c48 80%, #036c38 100%);
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(255,255,255,0.08) 0%, transparent 50%);
  animation: backgroundShift 10s ease-in-out infinite alternate;
}

@keyframes backgroundShift {
  0% { transform: scale(1) rotate(0deg); }
  100% { transform: scale(1.1) rotate(1deg); }
}

.header-bg {
  height: 280rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.app-title {
  font-size: 52rpx;
  font-weight: bold;
  color: white;
  text-shadow: 0 4rpx 12rpx rgba(0,0,0,0.3);
  margin-bottom: 16rpx;
}

.app-subtitle {
  font-size: 28rpx;
  color: rgba(255,255,255,0.9);
  text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.2);
}

.login-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
  margin: 0 40rpx;
  border-radius: 30rpx;
  padding: 50rpx 40rpx;
  box-shadow: 
    0 20rpx 60rpx rgba(0, 0, 0, 0.15),
    0 8rpx 30rpx rgba(7, 193, 96, 0.2);
  position: relative;
  z-index: 2;
  backdrop-filter: blur(20rpx);
  border: 1rpx solid rgba(255,255,255,0.2);
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,255,248,0.9) 100%);
  border-radius: 30rpx;
  z-index: -1;
}

.tab-container {
  display: flex;
  margin-bottom: 60rpx;
  border-bottom: 2rpx solid #f0f0f0;
  position: relative;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 32rpx;
  color: #999;
  position: relative;
  transition: all 0.3s ease;
  font-weight: 500;
}

.tab-item.active {
  color: #07c160;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -2rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 80rpx;
  height: 4rpx;
  background: linear-gradient(135deg, #07c160, #05a050);
  border-radius: 2rpx;
  box-shadow: 0 2rpx 8rpx rgba(7, 193, 96, 0.3);
}

.input-group {
  margin-bottom: 60rpx;
}

.input-item {
  margin-bottom: 40rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.input {
  width: 100%;
  height: 88rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  transition: all 0.3s ease;
  background: rgba(255,255,255,0.8);
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}

.input:focus {
  border-color: #07c160;
  box-shadow: 
    0 4rpx 16rpx rgba(7, 193, 96, 0.2),
    inset 0 0 0 2rpx rgba(7, 193, 96, 0.1);
  transform: translateY(-2rpx);
}

.placeholder {
  color: #ccc;
  font-size: 28rpx;
}

/* 学校选择器样式 */
.school-picker {
  width: 100%;
  height: 88rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  background: rgba(255,255,255,0.8);
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}

.school-picker:active {
  border-color: #07c160;
  box-shadow: 0 4rpx 16rpx rgba(7, 193, 96, 0.2);
}

.school-text {
  font-size: 28rpx;
  color: #333;
}

.school-text.placeholder {
  color: #ccc;
}

.picker-arrow {
  font-size: 24rpx;
  color: #999;
  transition: transform 0.3s ease;
}

.school-picker:active .picker-arrow {
  transform: rotate(180deg);
}

.login-btn, .register-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #07c160 0%, #05a050 50%, #048c48 100%);
  color: white;
  border: none;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 
    0 8rpx 30rpx rgba(7, 193, 96, 0.4),
    0 4rpx 12rpx rgba(7, 193, 96, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.login-btn::before, .register-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.login-btn:active::before, .register-btn:active::before {
  left: 100%;
}

.login-btn:active, .register-btn:active {
  transform: scale(0.98);
  box-shadow: 
    0 4rpx 15rpx rgba(7, 193, 96, 0.4),
    0 2rpx 8rpx rgba(7, 193, 96, 0.3);
}

.register-btn.disabled {
  background: linear-gradient(135deg, #ccc 0%, #bbb 100%);
  color: #999;
  box-shadow: none;
}

.agreement {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
  font-size: 26rpx;
  padding: 20rpx;
  background: rgba(7, 193, 96, 0.05);
  border-radius: 16rpx;
  border: 1rpx solid rgba(7, 193, 96, 0.1);
}

.checkbox {
  display: flex;
  align-items: center;
  margin-right: 10rpx;
}

.agreement-text {
  color: #666;
}

.protocol-link {
  color: #07c160;
  font-weight: 500;
  text-shadow: 0 1rpx 2rpx rgba(7, 193, 96, 0.2);
}

.error-message {
  margin: 30rpx 40rpx 0;
  padding: 24rpx;
  background: linear-gradient(135deg, #ffeaea 0%, #ffcdd2 100%);
  border: 1rpx solid #ffcdd2;
  border-radius: 16rpx;
  color: #d32f2f;
  font-size: 26rpx;
  text-align: center;
  box-shadow: 0 4rpx 12rpx rgba(211, 47, 47, 0.1);
}

/* 学校选择器弹窗样式 */
.school-picker-modal {
  max-width: 600rpx;
  max-height: 70vh;
  background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
  border: 1rpx solid rgba(7, 193, 96, 0.1);
}

.school-list {
  height: 400rpx;
}

.school-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: all 0.3s ease;
  background: rgba(255,255,255,0.8);
}

.school-item:active {
  background-color: rgba(7, 193, 96, 0.05);
  transform: scale(0.98);
}

.school-item.selected {
  background: linear-gradient(135deg, #f0f9f0 0%, #e8f5e9 100%);
  border-left: 4rpx solid #07c160;
}

.school-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.check-icon {
  color: #07c160;
  font-size: 28rpx;
  font-weight: bold;
  text-shadow: 0 1rpx 2rpx rgba(7, 193, 96, 0.3);
}

/* 弹窗通用样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 40rpx;
  backdrop-filter: blur(10rpx);
}

.modal-content {
  background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
  border-radius: 30rpx;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 
    0 25rpx 80rpx rgba(0, 0, 0, 0.25),
    0 10rpx 40rpx rgba(7, 193, 96, 0.2);
  border: 1rpx solid rgba(255,255,255,0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  background: linear-gradient(135deg, #f8fff8 0%, #f0f9f0 100%);
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #07c160;
}

.modal-close {
  font-size: 40rpx;
  color: #999;
  line-height: 1;
  transition: all 0.3s ease;
}

.modal-close:active {
  color: #07c160;
  transform: scale(1.2);
}

.modal-body {
  flex: 1;
  padding: 30rpx;
  overflow: hidden;
}

.protocol-preview {
  height: 300rpx;
}

.protocol-text {
  display: block;
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 20rpx;
}

.modal-footer {
  display: flex;
  padding: 20rpx 30rpx 30rpx;
  gap: 20rpx;
}

.modal-btn {
  flex: 1;
  height: 80rpx;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}

.modal-btn:active {
  transform: scale(0.98);
}

.modal-btn.secondary {
  background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
  color: #333;
}

.modal-btn.primary {
  background: linear-gradient(135deg, #07c160 0%, #05a050 50%, #048c48 100%);
  color: white;
  box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.3);
}
</style>