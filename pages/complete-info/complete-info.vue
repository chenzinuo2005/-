<template>
  <view class="complete-info-container">

    <!-- 表单区域 -->
    <view class="form-container">
      <view class="form-card">
        <!-- 用户身份 -->
        <view class="form-item">
          <text class="form-label">用户身份</text>
          <view class="picker-item" @click="showUserTypePicker = true">
            <text class="picker-text" :class="{ placeholder: !formData.usertype }">
              {{ getUserTypeText(formData.usertype) || '请选择用户身份' }}
            </text>
            <text class="picker-arrow">›</text>
          </view>
        </view>

        <!-- 所属部门/院系 -->
        <view class="form-item">
          <text class="form-label">所属部门/院系</text>
          <input 
            v-model="formData.department" 
            class="form-input" 
            placeholder="请输入部门或院系"
            placeholder-class="placeholder"
          />
        </view>

        <!-- 性别 -->
        <view class="form-item">
          <text class="form-label">性别</text>
          <view class="picker-item" @click="showGenderPicker = true">
            <text class="picker-text" :class="{ placeholder: !formData.sex }">
              {{ getGenderText(formData.sex) || '请选择性别' }}
            </text>
            <text class="picker-arrow">›</text>
          </view>
        </view>

        <!-- 专业 -->
        <view class="form-item">
          <text class="form-label">专业</text>
          <input 
            v-model="formData.major" 
            class="form-input" 
            placeholder="请输入专业"
            placeholder-class="placeholder"
          />
        </view>

        <!-- 年级 -->
        <view class="form-item">
          <text class="form-label">年级</text>
          <input 
            v-model="formData.grade" 
            class="form-input" 
            placeholder="请输入年级"
            placeholder-class="placeholder"
          />
        </view>

        <!-- 姓名 -->
        <view class="form-item">
          <text class="form-label">姓名</text>
          <input 
            v-model="formData.name" 
            class="form-input" 
            placeholder="请输入姓名"
            placeholder-class="placeholder"
          />
        </view>

        <!-- 电话 -->
        <view class="form-item">
          <text class="form-label">电话</text>
          <input 
            v-model="formData.phone" 
            class="form-input" 
            placeholder="请输入电话"
            placeholder-class="placeholder"
            type="number"
          />
        </view>
      </view>

      <!-- 提交按钮 -->
      <button class="submit-btn" @click="handleSubmit" :disabled="loading">
        {{ loading ? '提交中...' : '提交' }}
      </button>
    </view>

    <!-- 用户身份选择器 -->
    <view class="modal-mask" v-if="showUserTypePicker" @click="showUserTypePicker = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">选择用户身份</text>
          <text class="modal-close" @click="showUserTypePicker = false">×</text>
        </view>
        <view class="modal-body">
          <scroll-view class="picker-list" scroll-y>
            <view 
              v-for="type in userTypes" 
              :key="type.value"
              class="picker-item"
              :class="{ selected: formData.usertype === type.value }"
              @click="selectUserType(type.value)"
            >
              <text class="picker-text">{{ type.label }}</text>
              <text class="check-icon" v-if="formData.usertype === type.value">✓</text>
            </view>
          </scroll-view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn primary" @click="showUserTypePicker = false">确定</button>
        </view>
      </view>
    </view>

    <!-- 性别选择器 -->
    <view class="modal-mask" v-if="showGenderPicker" @click="showGenderPicker = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">选择性别</text>
          <text class="modal-close" @click="showGenderPicker = false">×</text>
        </view>
        <view class="modal-body">
          <scroll-view class="picker-list" scroll-y>
            <view 
              v-for="gender in genders" 
              :key="gender.value"
              class="picker-item"
              :class="{ selected: formData.sex === gender.value }"
              @click="selectGender(gender.value)"
            >
              <text class="picker-text">{{ gender.label }}</text>
              <text class="check-icon" v-if="formData.sex === gender.value">✓</text>
            </view>
          </scroll-view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn primary" @click="showGenderPicker = false">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      showUserTypePicker: false,
      showGenderPicker: false,
      formData: {
        usertype: '',
        department: '',
        sex: '',
        major: '',
        grade: '',
        name: '',
        phone: ''
      },
      userTypes: [
        { value: 0, label: '普通用户' },
        { value: 1, label: '学生' },
        { value: 2, label: '教师' },
        { value: 3, label: '职工' },
        { value: 5, label: '管理员' }
      ],
      genders: [
        { value: '男', label: '男' },
        { value: '女', label: '女' },
        { value: '未知', label: '未知' }
      ]
    }
  },
  
  onLoad() {
    this.loadUserInfo();
  },
  
  methods: {
    // 加载用户信息
    loadUserInfo() {
      const userInfo = uni.getStorageSync('userInfo');
      if (userInfo) {
        console.log('加载用户信息:', userInfo);
        
        // 填充表单数据
        this.formData = {
          usertype: userInfo.usertype || '',
          department: userInfo.student?.depart || '',
          sex: userInfo.sex || '',
          major: userInfo.student?.major || '',
          grade: userInfo.student?.grade || '',
          name: userInfo.name || '',
          phone: userInfo.phone || ''
        };
      }
    },
    
    // 获取用户身份文本
    getUserTypeText(usertype) {
      const type = this.userTypes.find(item => item.value === usertype);
      return type ? type.label : '';
    },
    
    // 获取性别文本
    getGenderText(sex) {
      const gender = this.genders.find(item => item.value === sex);
      return gender ? gender.label : '';
    },
    
    // 选择用户身份
    selectUserType(usertype) {
      this.formData.usertype = usertype;
    },
    
    // 选择性别
    selectGender(sex) {
      this.formData.sex = sex;
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 处理提交
    async handleSubmit() {
      // 验证表单
      if (!this.validateForm()) {
        return;
      }
      
      this.loading = true;
      
      try {
        const userInfo = uni.getStorageSync('userInfo');
        const token = uni.getStorageSync('token');
        
        if (!userInfo || !token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          });
          return;
        }
        
        // 准备提交数据
        const submitData = {
          userid: userInfo.userid,
          name: this.formData.name,
          phone: this.formData.phone,
          usertype: this.formData.usertype.toString()
        };
        
        console.log('提交数据:', submitData);
        
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url: 'http://www.gongxiangfeng.com:12100/campusnav/modUserInfo',
            method: 'POST',
            data: submitData,
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
        
        console.log('修改用户信息响应:', result);
        
        if (result.data.code === 0) {
          uni.showToast({
            title: '信息修改成功',
            icon: 'success',
            duration: 2000
          });
          
          // 更新本地存储的用户信息
          const updatedUserInfo = {
            ...userInfo,
            name: this.formData.name,
            phone: this.formData.phone,
            usertype: this.formData.usertype,
            sex: this.formData.sex,
            student: {
              ...userInfo.student,
              depart: this.formData.department,
              major: this.formData.major,
              grade: this.formData.grade
            }
          };
          
          uni.setStorageSync('userInfo', updatedUserInfo);
          
          // 延迟返回
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
          
        } else {
          uni.showToast({
            title: result.data.message || '信息修改失败',
            icon: 'none',
            duration: 3000
          });
        }
      } catch (error) {
        console.error('修改用户信息错误:', error);
        uni.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    // 验证表单
    validateForm() {
      if (!this.formData.usertype) {
        uni.showToast({
          title: '请选择用户身份',
          icon: 'none'
        });
        return false;
      }
      
      if (!this.formData.name) {
        uni.showToast({
          title: '请输入姓名',
          icon: 'none'
        });
        return false;
      }
      
      if (!this.formData.phone) {
        uni.showToast({
          title: '请输入电话',
          icon: 'none'
        });
        return false;
      }
      
      // 简单的手机号验证
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(this.formData.phone)) {
        uni.showToast({
          title: '请输入正确的手机号码',
          icon: 'none'
        });
        return false;
      }
      
      return true;
    }
  }
}
</script>

<style scoped>
.complete-info-container {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 导航栏样式 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  height: 88rpx;
  background: white;
  border-bottom: 1rpx solid #f0f0f0;
}

.nav-back {
  display: flex;
  align-items: center;
  font-size: 32rpx;
  color: #007AFF;
}

.back-icon {
  font-size: 48rpx;
  margin-right: 8rpx;
}

.nav-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.nav-placeholder {
  width: 120rpx;
}

/* 表单容器 */
.form-container {
  padding: 30rpx;
}

.form-card {
  background: white;
  border-radius: 20rpx;
  padding: 0 30rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.form-item:last-child {
  border-bottom: none;
}

.form-label {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
  min-width: 200rpx;
}

.form-input {
  flex: 1;
  text-align: right;
  font-size: 32rpx;
  color: #333;
  padding: 0 20rpx;
  height: 48rpx;
}

.picker-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20rpx;
  height: 48rpx;
}

.picker-text {
  font-size: 32rpx;
  color: #333;
}

.picker-text.placeholder {
  color: #ccc;
}

.picker-arrow {
  font-size: 36rpx;
  color: #999;
  font-weight: bold;
}

.placeholder {
  color: #ccc;
  font-size: 32rpx;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #007AFF, #0056CC);
  color: white;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.submit-btn:disabled {
  background: #ccc;
  color: #999;
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 40rpx;
}

.modal-content {
  background: white;
  border-radius: 20rpx;
  width: 100%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 40rpx;
  color: #999;
  line-height: 1;
}

.modal-body {
  flex: 1;
  overflow: hidden;
}

.picker-list {
  height: 400rpx;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background-color 0.3s;
}

.picker-item:active {
  background-color: #f5f5f5;
}

.picker-item.selected {
  background-color: #f0f7ff;
}

.check-icon {
  color: #007AFF;
  font-size: 28rpx;
  font-weight: bold;
}

.modal-footer {
  padding: 20rpx 30rpx 30rpx;
}

.modal-btn {
  width: 100%;
  height: 80rpx;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 500;
}

.modal-btn.primary {
  background: linear-gradient(135deg, #007AFF, #0056CC);
  color: white;
}
</style>