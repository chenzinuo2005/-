<template>
  <view class="sponsor-running-container">

    <!-- 主体内容 -->
    <scroll-view class="content" scroll-y>
      <!-- 登录提示 -->
      <view v-if="!userInfo.isLoggedIn" class="login-prompt">
        <text class="prompt-text">请先登录后再发起跑腿</text>
        <button class="login-btn" @click="goToLogin">前往登录</button>
      </view>

      <!-- 主体内容 - 仅当已登录时显示 -->
      <template v-else>
        <!-- 选择商家区域 -->
        <view class="section">
          <view class="section-title">
            <text>添加您愿取单的商家</text>
            <text class="tips">(至少选择1个商家)</text>
          </view>
          
          <!-- 商家搜索 -->
          <view class="search-box">
            <uni-icons type="search" size="16" color="#999"></uni-icons>
            <input 
              class="search-input" 
              placeholder="搜索商家" 
              v-model="merchantSearch"
              @input="handleMerchantSearch"
              @confirm="searchMerchants"
            ></input>
          </view>
          
          <!-- 商家搜索结果 -->
          <view class="search-results" v-if="merchantSearch && merchantResults.length > 0">
            <view 
              v-for="merchant in merchantResults" 
              :key="merchant.merchant_id"
              class="result-item"
              @click="selectMerchant(merchant)"
            >
              <text>{{ merchant.name }}</text>
              <uni-icons type="plus" size="16" color="#07c160"></uni-icons>
            </view>
          </view>

          <!-- 无搜索结果提示 -->
          <view v-if="merchantSearch && merchantResults.length === 0 && !searchingMerchants" class="no-results">
            <text class="no-results-text">未找到相关商家</text>
          </view>
          
          <!-- 默认商家列表 -->
          <view class="default-section" v-if="!merchantSearch && defaultMerchants.length > 0">
            <text class="default-title">推荐商家</text>
            <view class="default-list">
              <view 
                v-for="merchant in defaultMerchants" 
                :key="merchant.merchant_id"
                class="default-item"
                @click="selectMerchant(merchant)"
              >
                <text class="default-item-text">{{ merchant.name }}</text>
                <uni-icons type="plus" size="16" color="#07c160"></uni-icons>
              </view>
            </view>
          </view>
          
          <!-- 已选商家列表 -->
          <view class="selected-list" v-if="selectedMerchants.length > 0">
            <text class="selected-title">已选商家 ({{ selectedMerchants.length }})</text>
            <view class="selected-items">
              <view 
                v-for="(merchant, index) in selectedMerchants" 
                :key="merchant.merchant_id"
                class="selected-item"
              >
                <view class="selected-content">
                  <text class="selected-index">{{ index + 1 }}</text>
                  <text class="selected-name">{{ merchant.name }}</text>
                </view>
                <view class="delete-btn" @click="confirmRemoveMerchant(index)">
                  <uni-icons type="close" size="14" color="#ff4444"></uni-icons>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 选择跑腿范围区域 -->
        <view class="section">
          <view class="section-title">
            <text>添加跑腿范围</text>
            <text class="tips">(至少选择1个建筑物)</text>
          </view>
          
          <!-- 建筑物搜索 -->
          <view class="search-box">
            <uni-icons type="search" size="16" color="#999"></uni-icons>
            <input 
              class="search-input" 
              placeholder="搜索建筑物" 
              v-model="buildingSearch"
              @input="handleBuildingSearch"
              @confirm="searchBuildings"
            ></input>
          </view>
          
          <!-- 建筑物搜索结果 -->
          <view class="search-results" v-if="buildingSearch && buildingResults.length > 0">
            <view 
              v-for="building in buildingResults" 
              :key="building.building_id"
              class="result-item"
              @click="selectBuilding(building)"
            >
              <text>{{ building.name }}</text>
              <uni-icons type="plus" size="16" color="#07c160"></uni-icons>
            </view>
          </view>

          <!-- 无搜索结果提示 -->
          <view v-if="buildingSearch && buildingResults.length === 0 && !searchingBuildings" class="no-results">
            <text class="no-results-text">未找到相关建筑物</text>
          </view>
          
          <!-- 默认建筑物列表 -->
          <view class="default-section" v-if="!buildingSearch && defaultBuildings.length > 0">
            <text class="default-title">推荐建筑物</text>
            <view class="default-list">
              <view 
                v-for="building in defaultBuildings" 
                :key="building.building_id"
                class="default-item"
                @click="selectBuilding(building)"
              >
                <text class="default-item-text">{{ building.name }}</text>
                <uni-icons type="plus" size="16" color="#07c160"></uni-icons>
              </view>
            </view>
          </view>
          
          <!-- 已选建筑物列表 -->
          <view class="selected-list" v-if="selectedBuildings.length > 0">
            <text class="selected-title">已选建筑物 ({{ selectedBuildings.length }})</text>
            <view class="selected-items">
              <view 
                v-for="(building, index) in selectedBuildings" 
                :key="building.building_id"
                class="selected-item"
              >
                <view class="selected-content">
                  <text class="selected-index">{{ index + 1 }}</text>
                  <text class="selected-name">{{ building.name }}</text>
                </view>
                <view class="delete-btn" @click="confirmRemoveBuilding(index)">
                  <uni-icons type="close" size="14" color="#ff4444"></uni-icons>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 截止时间选择 -->
        <view class="section">
          <view class="form-item">
            <text class="label">截止时间</text>
            <view 
              class="input-area" 
              @click="openTimePicker"
            >
              <text v-if="deadline" class="time-text">{{ deadline }}</text>
              <text v-else class="placeholder">请选择截止时间</text>
              <uni-icons type="right" size="16" color="#999"></uni-icons>
            </view>
          </view>
          <text class="time-tip">截止时间后，用户不能再预订外卖了。您需到商家处领取外卖送给预订用户。</text>
          <text class="time-tip">时间只能选当天或第二天，时间必须晚于当前时间至少半小时</text>
        </view>

        <!-- 最大预订数量 -->
        <view class="section">
          <view class="form-item">
            <text class="label">最多预订总数量</text>
            <view class="input-with-stepper">
              <input 
                class="input" 
                type="number" 
                v-model="maxBooknum"
                placeholder="请输入数量"
                min="1"
                max="999"
                @input="validateBooknum"
                @blur="handleBooknumBlur"
              ></input>
              <view class="stepper">
                <view class="stepper-btn minus" @click="decreaseBooknum" :class="{ disabled: maxBooknum <= 1 }">
                  <uni-icons type="minus" size="12" color="#666"></uni-icons>
                </view>
                <view class="stepper-btn plus" @click="increaseBooknum" :class="{ disabled: maxBooknum >= 999 }">
                  <uni-icons type="plus" size="12" color="#666"></uni-icons>
                </view>
              </view>
            </view>
          </view>
          <text class="time-tip">这是您愿意为本次跑腿承担的最大总订单数量</text>
          <text class="time-tip">建议根据您的体力和时间合理安排，范围：1-999</text>
          
          <!-- 数量提示信息 -->
          <view v-if="maxBooknum" class="quantity-info">
            <text class="quantity-text">您最多将处理 {{ maxBooknum }} 个订单</text>
            <view class="quantity-progress">
              <view class="progress-bar">
                <view 
                  class="progress-fill" 
                  :style="{ width: calculateProgressWidth() }"
                ></view>
              </view>
              <text class="progress-text">{{ calculateProgressText() }}</text>
            </view>
          </view>
        </view>
      </template>
    </scroll-view>

    <!-- 底部按钮 -->
    <view class="bottom-btn-area" v-if="userInfo.isLoggedIn">
      <button 
        class="submit-btn" 
        @click="submitForm"
        :disabled="!canSubmit"
        :class="{ disabled: !canSubmit }"
      >
        立即发起
      </button>
    </view>

    <!-- 时间选择器 -->
    <view v-if="showTimePicker" class="time-picker-overlay" @click="closeTimePicker">
      <view class="time-picker-content" @click.stop>
        <view class="time-picker-header">
          <text class="cancel-btn" @click="closeTimePicker">取消</text>
          <text class="title">选择截止时间</text>
          <text class="confirm-btn" @click="confirmTime">确定</text>
        </view>
        <picker-view 
          class="time-picker" 
          :value="timeValue" 
          @change="handleTimeChange"
          indicator-style="height: 50px;"
        >
          <picker-view-column>
            <view class="picker-item" v-for="day in days" :key="day.value">{{ day.label }}</view>
          </picker-view-column>
          <picker-view-column>
            <view class="picker-item" v-for="hour in hours" :key="hour">{{ hour }}时</view>
          </picker-view-column>
          <picker-view-column>
            <view class="picker-item" v-for="minute in minutes" :key="minute">{{ minute }}分</view>
          </picker-view-column>
        </picker-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';

// 状态管理
const selectedMerchants = ref([]);
const selectedBuildings = ref([]);
const deadline = ref('');
const maxBooknum = ref('');
const showTimePicker = ref(false);

// 搜索相关
const merchantSearch = ref('');
const buildingSearch = ref('');
const merchantResults = ref([]);
const buildingResults = ref([]);
const searchingMerchants = ref(false);
const searchingBuildings = ref(false);

// 默认商家和建筑物列表
const defaultMerchants = ref([]);
const defaultBuildings = ref([]);

// 用户信息 - 从本地存储获取
const userInfo = ref({
  userid: '',
  token: '',
  schoolid: '',
  isLoggedIn: false
});

// 时间选择器相关
const timeValue = ref([0, 12, 0]);
const days = ref([
  { label: '今天', value: 0 },
  { label: '明天', value: 1 }
]);
const hours = ref(Array.from({ length: 24 }, (_, i) => i));
const minutes = ref([0, 10, 20, 30, 40, 50]);

// 防抖函数
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 创建防抖搜索函数
let debouncedSearchMerchants, debouncedSearchBuildings;

// 计算是否可提交
const canSubmit = computed(() => {
  return selectedMerchants.value.length > 0 && 
         selectedBuildings.value.length > 0 && 
         !!deadline.value && 
         !!maxBooknum.value &&
         maxBooknum.value >= 1 &&
         maxBooknum.value <= 999;
});

// 初始化
onMounted(() => {
  initTimePicker();
  loadUserInfo();
  // 创建防抖搜索函数
  debouncedSearchMerchants = debounce(searchMerchants, 300);
  debouncedSearchBuildings = debounce(searchBuildings, 300);
  
  // 加载默认商家和建筑物
  loadDefaultMerchants();
  loadDefaultBuildings();
});

// 页面显示时重新加载用户信息
onShow(() => {
  console.log('gorun.vue onShow - 检查存储状态');
  console.log('userid:', uni.getStorageSync('userid'));
  console.log('token:', uni.getStorageSync('token'));
  console.log('schoolid:', uni.getStorageSync('schoolid'));
  loadUserInfo();
});

// 加载默认商家列表
const loadDefaultMerchants = async () => {
  try {
    const params = getRequestParams();
    
    if (!params.userid || !params.token || !params.schoolid) {
      console.log('用户未登录，无法加载默认商家');
      return;
    }
    
    console.log('加载默认商家列表');
    
    // 使用空字符串搜索来获取默认商家列表
    const res = await uni.request({
      url: 'http://www.gongxiangfeng.com:12100/campusnav/searchShops',
      method: 'GET',
      header: {
        'token': params.token
      },
      data: {
        userid: params.userid,
        schoolid: params.schoolid,
        searchstr: ''
      }
    });
    
    console.log('默认商家列表结果:', res);
    
    if (res.data.code === 0 && res.data.data) {
      // 限制默认商家数量，避免显示过多
      defaultMerchants.value = res.data.data.slice(0, 10).map(item => ({
        name: item.name,
        merchant_id: item.merchant_id
      }));
      console.log('加载默认商家成功:', defaultMerchants.value.length);
    } else {
      console.log('加载默认商家失败:', res.data.message);
      // 如果API失败，使用一些示例数据
      defaultMerchants.value = [
        { name: '韵江南', merchant_id: 1 },
        { name: '信天游', merchant_id: 2 },
        { name: '湘知园', merchant_id: 3 }
      ];
    }
  } catch (error) {
    console.error('加载默认商家失败:', error);
    // 如果API失败，使用一些示例数据
    defaultMerchants.value = [
      { name: '韵江南', merchant_id: 1 },
      { name: '信天游', merchant_id: 2 },
      { name: '湘知园', merchant_id: 3 }
    ];
  }
};

// 加载默认建筑物列表
const loadDefaultBuildings = async () => {
  try {
    const params = getRequestParams();
    
    if (!params.userid || !params.token || !params.schoolid) {
      console.log('用户未登录，无法加载默认建筑物');
      return;
    }
    
    console.log('加载默认建筑物列表');
    
    // 使用空字符串搜索来获取默认建筑物列表
    const res = await uni.request({
      url: 'http://www.gongxiangfeng.com:12100/campusnav/searchBuildings',
      method: 'GET',
      header: {
        'token': params.token
      },
      data: {
        userid: params.userid,
        schoolid: params.schoolid,
        searchstr: ''
      }
    });
    
    console.log('默认建筑物列表结果:', res);
    
    if (res.data.code === 0 && res.data.data) {
      // 限制默认建筑物数量，避免显示过多
      defaultBuildings.value = res.data.data.slice(0, 10).map(item => ({
        name: item.name,
        building_id: item.building_id
      }));
      console.log('加载默认建筑物成功:', defaultBuildings.value.length);
    } else {
      console.log('加载默认建筑物失败:', res.data.message);
      // 如果API失败，使用一些示例数据
      defaultBuildings.value = [
        { name: '8舍', building_id: 1 },
        { name: '9舍', building_id: 2 },
        { name: '38栋', building_id: 3 }
      ];
    }
  } catch (error) {
    console.error('加载默认建筑物失败:', error);
    // 如果API失败，使用一些示例数据
    defaultBuildings.value = [
      { name: '8舍', building_id: 1 },
      { name: '9舍', building_id: 2 },
      { name: '38栋', building_id: 3 }
    ];
  }
};

// 加载用户信息 - 从本地存储获取
const loadUserInfo = () => {
  try {
    // 从本地存储获取用户信息
    const userid = uni.getStorageSync('userid') || '';
    const token = uni.getStorageSync('token') || '';
    const schoolid = uni.getStorageSync('schoolid') || '';
    
    // 如果基础信息为空，尝试从完整的userInfo中获取
    if ((!userid || !schoolid) && token) {
      console.log('基础信息缺失，尝试从完整用户信息中获取');
      const userInfoStr = uni.getStorageSync('userInfo');
      if (userInfoStr) {
        try {
          const fullUserInfo = JSON.parse(userInfoStr);
          const resolvedUserid = userid || fullUserInfo.userid || '';
          const resolvedSchoolid = schoolid || fullUserInfo.schoolid || '';
          
          // 重新存储正确的基础信息
          if (resolvedUserid) uni.setStorageSync('userid', resolvedUserid);
          if (resolvedSchoolid) uni.setStorageSync('schoolid', resolvedSchoolid);
          
          userInfo.value = {
            userid: resolvedUserid,
            token,
            schoolid: resolvedSchoolid,
            isLoggedIn: !!(token)
          };
          
          console.log('从完整用户信息恢复:', userInfo.value);
        } catch (parseError) {
          console.error('解析用户信息失败:', parseError);
        }
      }
    } else {
      userInfo.value = {
        userid,
        token,
        schoolid,
        // 修改登录状态判断逻辑：只要有 token 就认为是已登录
        isLoggedIn: !!(token) // 主要根据 token 判断登录状态
      };
    }
    
    console.log('加载用户信息:', userInfo.value);
    
    if (!userInfo.value.isLoggedIn) {
      console.warn('用户未登录或信息不完整');
    } else {
      console.log('用户已登录，token:', token);
    }
  } catch (error) {
    console.error('加载用户信息失败:', error);
  }
};

// 检查登录状态
const checkLoginStatus = () => {
  if (!userInfo.value.isLoggedIn) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    return false;
  }
  
  // 修改验证逻辑：允许 schoolid 为 0，但必须有 userid
  if (!userInfo.value.userid) {
    console.warn('用户信息不完整，尝试重新加载');
    loadUserInfo();
    
    // 再次检查，如果仍然缺少必要信息
    if (!userInfo.value.userid) {
      console.error('用户信息仍然不完整，无法进行API调用');
      uni.showToast({
        title: '用户信息不完整，请重新登录',
        icon: 'none',
        duration: 3000
      });
      
      // 尝试强制重新登录
      setTimeout(() => {
        uni.navigateTo({
          url: '/pages/login/login'
        });
      }, 2000);
      
      return false;
    }
  }
  
  return true;
};

// 获取请求所需的用户参数
const getRequestParams = () => {
  return {
    userid: userInfo.value.userid,
    token: userInfo.value.token,
    schoolid: userInfo.value.schoolid
  };
};

// 初始化时间选择器
const initTimePicker = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // 确保 minutes 数组已正确初始化
  if (!minutes.value || minutes.value.length === 0) {
    minutes.value = [0, 10, 20, 30, 40, 50];
    console.log('重新初始化 minutes 数组:', minutes.value);
  }
  
  // 设置默认时间为当前时间+30分钟
  let defaultHour = currentHour;
  let defaultMinute = currentMinute + 30;
  
  if (defaultMinute >= 60) {
    defaultHour += 1;
    defaultMinute -= 60;
  }
  
  // 如果超过当天时间，则设置为第二天
  const dayIndex = defaultHour >= 24 ? 1 : 0;
  defaultHour = defaultHour % 24;
  
  // 找到最接近的分钟选项
  const minuteIndex = minutes.value.findIndex(m => m >= defaultMinute);
  const safeMinuteIndex = minuteIndex >= 0 ? minuteIndex : minutes.value.length - 1;
  
  timeValue.value = [dayIndex, defaultHour, safeMinuteIndex];
  
  console.log('时间选择器初始化完成:', {
    currentTime: `${currentHour}:${currentMinute}`,
    defaultTime: `${defaultHour}:${defaultMinute}`,
    timeValue: timeValue.value,
    minutes: minutes.value
  });
};

// 商家搜索输入处理
const handleMerchantSearch = () => {
  if (!merchantSearch.value.trim()) {
    merchantResults.value = [];
    searchingMerchants.value = false;
    return;
  }
  
  // 检查登录状态，如果信息不完整但token存在，尝试重新加载
  if (!userInfo.value.isLoggedIn && uni.getStorageSync('token')) {
    console.log('token存在但状态异常，重新加载用户信息');
    loadUserInfo();
  }
  
  // 检查登录状态
  if (!checkLoginStatus()) {
    return;
  }
  
  searchingMerchants.value = true;
  debouncedSearchMerchants();
};

// 建筑物搜索输入处理
const handleBuildingSearch = () => {
  if (!buildingSearch.value.trim()) {
    buildingResults.value = [];
    searchingBuildings.value = false;
    return;
  }
  
  // 检查登录状态，如果信息不完整但token存在，尝试重新加载
  if (!userInfo.value.isLoggedIn && uni.getStorageSync('token')) {
    console.log('token存在但状态异常，重新加载用户信息');
    loadUserInfo();
  }
  
  // 检查登录状态
  if (!checkLoginStatus()) {
    return;
  }
  
  searchingBuildings.value = true;
  debouncedSearchBuildings();
};

// 搜索商家
const searchMerchants = async () => {
  if (!merchantSearch.value.trim()) {
    merchantResults.value = [];
    searchingMerchants.value = false;
    return;
  }
  
  try {
    const params = getRequestParams();
    
    console.log('搜索商家前的参数检查:', {
      userid: params.userid,
      token: params.token,
      schoolid: params.schoolid,
      tokenExists: !!params.token,
      useridExists: !!params.userid,
      schoolidExists: !!params.schoolid
    });
    
    // 修改验证逻辑：允许 schoolid 为 0，但必须有 userid 和 token
    if (!params.userid || !params.token) {
      console.error('搜索商家参数缺失:', {
        userid: params.userid,
        token: params.token,
        schoolid: params.schoolid
      });
      
      uni.showToast({
        title: '用户信息不完整，请重新登录',
        icon: 'none'
      });
      searchingMerchants.value = false;
      
      // 跳转到登录页面
      setTimeout(() => {
        uni.navigateTo({
          url: '/pages/login/login'
        });
      }, 1500);
      
      return;
    }
    
    console.log('搜索商家参数:', { ...params, searchstr: merchantSearch.value.trim() });
    
    const res = await uni.request({
      url: 'http://www.gongxiangfeng.com:12100/campusnav/searchShops',
      method: 'GET',
      header: {
        'token': params.token
      },
      data: {
        userid: params.userid,
        schoolid: params.schoolid,
        searchstr: merchantSearch.value.trim()
      }
    });
    
    console.log('商家搜索结果:', res);
    
    if (res.data.code === 0 && res.data.data) {
      // 根据接口文档，返回的数据结构是 {name, merchant_id}
      // 前端过滤：确保返回的结果包含搜索关键词
      const searchTerm = merchantSearch.value.trim().toLowerCase();
      merchantResults.value = res.data.data
        .filter(item => item.name.toLowerCase().includes(searchTerm))
        .map(item => ({
          name: item.name,
          merchant_id: item.merchant_id
        }));
      
      console.log('过滤后的商家结果:', merchantResults.value);
    } else {
      merchantResults.value = [];
      console.log('搜索商家失败:', res.data.message);
      uni.showToast({
        title: res.data.message || '搜索失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('搜索商家失败:', error);
    merchantResults.value = [];
    uni.showToast({
      title: '搜索失败，请重试',
      icon: 'none'
    });
  } finally {
    searchingMerchants.value = false;
  }
};

// 搜索建筑物
const searchBuildings = async () => {
  if (!buildingSearch.value.trim()) {
    buildingResults.value = [];
    searchingBuildings.value = false;
    return;
  }
  
  try {
    const params = getRequestParams();
    
    // 修改验证逻辑：允许 schoolid 为 0，但必须有 userid 和 token
    if (!params.userid || !params.token) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      });
      searchingBuildings.value = false;
      return;
    }
    
    console.log('搜索建筑物参数:', { ...params, searchstr: buildingSearch.value.trim() });
    
    const res = await uni.request({
      url: 'http://www.gongxiangfeng.com:12100/campusnav/searchBuildings',
      method: 'GET',
      header: {
        'token': params.token
      },
      data: {
        userid: params.userid,
        schoolid: params.schoolid,
        searchstr: buildingSearch.value.trim()
      }
    });
    
    console.log('建筑物搜索结果:', res);
    
    if (res.data.code === 0 && res.data.data) {
      // 前端过滤：确保返回的结果包含搜索关键词
      const searchTerm = buildingSearch.value.trim().toLowerCase();
      buildingResults.value = res.data.data
        .filter(item => item.name.toLowerCase().includes(searchTerm))
        .map(item => ({
          name: item.name,
          building_id: item.building_id
        }));
      
      console.log('过滤后的建筑物结果:', buildingResults.value);
    } else {
      buildingResults.value = [];
      console.log('搜索建筑物失败:', res.data.message);
      uni.showToast({
        title: res.data.message || '搜索失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('搜索建筑物失败:', error);
    buildingResults.value = [];
    uni.showToast({
      title: '搜索失败，请重试',
      icon: 'none'
    });
  } finally {
    searchingBuildings.value = false;
  }
};

// 选择商家
const selectMerchant = (merchant) => {
  // 检查是否已选择
  const isSelected = selectedMerchants.value.some(
    m => m.merchant_id === merchant.merchant_id
  );
  
  if (!isSelected) {
    selectedMerchants.value.push(merchant);
    uni.showToast({
      title: `已选择商家: ${merchant.name}`,
      icon: 'success',
      duration: 1500
    });
  } else {
    uni.showToast({
      title: '该商家已选择',
      icon: 'none',
      duration: 1500
    });
  }
  
  // 清空搜索
  merchantSearch.value = '';
  merchantResults.value = [];
};

// 选择建筑物
const selectBuilding = (building) => {
  // 检查是否已选择
  const isSelected = selectedBuildings.value.some(
    b => b.building_id === building.building_id
  );
  
  if (!isSelected) {
    selectedBuildings.value.push(building);
    uni.showToast({
      title: `已选择建筑物: ${building.name}`,
      icon: 'success',
      duration: 1500
    });
  } else {
    uni.showToast({
      title: '该建筑物已选择',
      icon: 'none',
      duration: 1500
    });
  }
  
  // 清空搜索
  buildingSearch.value = '';
  buildingResults.value = [];
};

// 确认移除商家
const confirmRemoveMerchant = (index) => {
  const merchant = selectedMerchants.value[index];
  uni.showModal({
    title: '确认删除',
    content: `确定要删除商家"${merchant.name}"吗？`,
    confirmColor: '#ff4444',
    success: (res) => {
      if (res.confirm) {
        removeMerchant(index);
      }
    }
  });
};

// 确认移除建筑物
const confirmRemoveBuilding = (index) => {
  const building = selectedBuildings.value[index];
  uni.showModal({
    title: '确认删除',
    content: `确定要删除建筑物"${building.name}"吗？`,
    confirmColor: '#ff4444',
    success: (res) => {
      if (res.confirm) {
        removeBuilding(index);
      }
    }
  });
};

// 移除商家
const removeMerchant = (index) => {
  const removedMerchant = selectedMerchants.value[index];
  selectedMerchants.value.splice(index, 1);
  uni.showToast({
    title: `已移除商家: ${removedMerchant.name}`,
    icon: 'success',
    duration: 1500
    });
};

// 移除建筑物
const removeBuilding = (index) => {
  const removedBuilding = selectedBuildings.value[index];
  selectedBuildings.value.splice(index, 1);
  uni.showToast({
    title: `已移除建筑物: ${removedBuilding.name}`,
    icon: 'success',
    duration: 1500
  });
};

// 打开时间选择器
const openTimePicker = () => {
  showTimePicker.value = true;
};

// 关闭时间选择器
const closeTimePicker = () => {
  showTimePicker.value = false;
};

// 处理时间选择变化
const handleTimeChange = (e) => {
  console.log('时间选择变化:', e.detail.value);
  if (e.detail.value && Array.isArray(e.detail.value)) {
    timeValue.value = e.detail.value;
  } else {
    console.error('时间选择器返回异常数据:', e.detail);
  }
};

// 确认时间选择
const confirmTime = () => {
  console.log('确认时间选择，当前 timeValue:', timeValue.value);
  
  // 添加安全检查
  if (!timeValue.value || !Array.isArray(timeValue.value) || timeValue.value.length < 3) {
    console.error('时间选择器数据异常:', timeValue.value);
    uni.showToast({
      title: '时间选择异常，请重试',
      icon: 'none'
    });
    return;
  }

  if (!minutes.value || minutes.value.length === 0) {
    console.error('minutes 数组为空');
    minutes.value = [0, 10, 20, 30, 40, 50];
  }

  const dayIndex = timeValue.value[0];
  const hour = timeValue.value[1];
  const minuteIndex = timeValue.value[2];
  
  // 确保 minuteIndex 在有效范围内
  const safeMinuteIndex = Math.min(Math.max(minuteIndex, 0), minutes.value.length - 1);
  const minute = minutes.value[safeMinuteIndex];
  
  console.log('处理时间选择:', { dayIndex, hour, minuteIndex, safeMinuteIndex, minute });
  
  const now = new Date();
  const selectedDate = new Date();
  
  // 设置日期（今天或明天）
  if (dayIndex === 1) {
    selectedDate.setDate(now.getDate() + 1);
  }
  
  // 设置时间
  selectedDate.setHours(hour, minute, 0, 0);
  
  console.log('选择的时间:', selectedDate);
  console.log('当前时间:', now);
  
  // 验证时间是否有效
  if (selectedDate <= new Date(now.getTime() + 30 * 60 * 1000)) {
    uni.showToast({
      title: '截止时间必须晚于当前时间至少30分钟',
      icon: 'none',
      duration: 3000
    });
    return;
  }
  
  // 验证是否在当天或第二天
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);
  
  if (selectedDate > tomorrow) {
    uni.showToast({
      title: '时间只能选择当天或第二天',
      icon: 'none',
      duration: 3000
    });
    return;
  }
  
  // 格式化显示时间
  const year = selectedDate.getFullYear();
  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const day = String(selectedDate.getDate()).padStart(2, '0');
  const hoursStr = String(selectedDate.getHours()).padStart(2, '0');
  const minutesStr = String(selectedDate.getMinutes()).padStart(2, '0');
  
  deadline.value = `${year}-${month}-${day} ${hoursStr}:${minutesStr}`;
  showTimePicker.value = false;
  
  console.log('最终选择的截止时间:', deadline.value);
};

// 减少预订数量
const decreaseBooknum = () => {
  if (maxBooknum.value > 1) {
    maxBooknum.value = parseInt(maxBooknum.value) - 1;
    validateBooknum();
  }
};

// 增加预订数量
const increaseBooknum = () => {
  if (maxBooknum.value < 999) {
    maxBooknum.value = parseInt(maxBooknum.value || 0) + 1;
    validateBooknum();
  }
};

// 验证预订数量
const validateBooknum = () => {
  let value = parseInt(maxBooknum.value);
  
  if (isNaN(value)) {
    maxBooknum.value = '';
    return;
  }
  
  if (value < 1) {
    maxBooknum.value = 1;
  } else if (value > 999) {
    maxBooknum.value = 999;
    uni.showToast({
      title: '最大预订数量不能超过999',
      icon: 'none',
      duration: 2000
    });
  } else {
    maxBooknum.value = value;
  }
};

// 处理输入框失去焦点
const handleBooknumBlur = () => {
  if (!maxBooknum.value) {
    maxBooknum.value = 1;
    uni.showToast({
      title: '已设置为最小数量1',
      icon: 'none',
      duration: 1500
    });
  }
};

// 计算进度条宽度
const calculateProgressWidth = () => {
  if (!maxBooknum.value) return '0%';
  
  const value = parseInt(maxBooknum.value);
  // 将1-999映射到0%-100%，但设置上限为80%以避免过长
  const percentage = Math.min((value / 999) * 100, 80);
  return `${percentage}%`;
};

// 计算进度文本
const calculateProgressText = () => {
  if (!maxBooknum.value) return '请设置数量';
  
  const value = parseInt(maxBooknum.value);
  if (value <= 10) {
    return '轻松任务';
  } else if (value <= 30) {
    return '适中任务';
  } else if (value <= 50) {
    return '较重任务';
  } else {
    return '挑战任务';
  }
};

// 导航回上一页 - 添加安全检查
const navigateBack = () => {
  const pages = getCurrentPages();
  console.log('当前页面栈:', pages);
  
  if (pages.length > 1) {
    // 有上一页，可以返回
    uni.navigateBack();
  } else {
    // 没有上一页，跳转到广场页面
    uni.switchTab({
      url: '/pages/square/square'
    });
  }
};

// 前往登录页面
const goToLogin = () => {
  uni.navigateTo({
    url: '/pages/login/login'
  });
};

// 提交表单
const submitForm = async () => {
  if (selectedMerchants.value.length === 0) {
    uni.showToast({
      title: '请至少选择一个商家',
      icon: 'none'
    });
    return;
  }
  
  if (selectedBuildings.value.length === 0) {
    uni.showToast({
      title: '请至少选择一个跑腿范围',
      icon: 'none'
    });
    return;
  }
  
  if (!deadline.value) {
    uni.showToast({
      title: '请选择截止时间',
      icon: 'none'
    });
    return;
  }
  
  if (!maxBooknum.value || maxBooknum.value < 1) {
    uni.showToast({
      title: '请输入有效的预订数量',
      icon: 'none'
    });
    return;
  }
  
  // 最终验证数量
  validateBooknum();
  
  if (maxBooknum.value > 999) {
    uni.showToast({
      title: '最大预订数量不能超过999',
      icon: 'none'
    });
    return;
  }
  
  // 检查登录状态
  if (!checkLoginStatus()) {
    return;
  }
  
  try {
    const params = getRequestParams();
    
    const merchants = selectedMerchants.value.map(m => m.merchant_id).join(',');
    const buildings = selectedBuildings.value.map(b => b.building_id).join(',');
    
    console.log('提交跑腿参数:', {
      userid: params.userid,
      merchants,
      buildings,
      deadline: deadline.value,
      max_booknum: Number(maxBooknum.value)
    });
    
    uni.showLoading({
      title: '提交中...'
    });
    
    // 修改这里：使用 application/json 并发送 JSON 数据
    const res = await uni.request({
      url: 'http://www.gongxiangfeng.com:12100/campusnav/sponsorRunning',
      method: 'POST',
      header: {
        'token': params.token,
        'Content-Type': 'application/json'  // 改为 application/json
      },
      data: JSON.stringify({  // 将数据转换为 JSON 字符串
        userid: params.userid,
        merchants: merchants,
        buildings: buildings,
        deadline: deadline.value,
        max_booknum: Number(maxBooknum.value)
      })
    });
    
    uni.hideLoading();
    
    console.log('提交跑腿结果:', res);
    
    if (res.data.code === 0) {
      uni.showToast({
        title: '发起跑腿成功',
        icon: 'success'
      });
      
      // 新增：发送全局事件通知广场页面刷新数据
      uni.$emit('runningListShouldRefresh');
      
      // 清空表单
      selectedMerchants.value = [];
      selectedBuildings.value = [];
      deadline.value = '';
      maxBooknum.value = '';
      merchantSearch.value = '';
      buildingSearch.value = '';
      
      // 修改这里：使用安全的导航方式
      setTimeout(() => {
        // 检查页面栈，如果有上一页则返回，否则跳转到跑腿列表页面
        const pages = getCurrentPages();
        console.log('提交成功后的页面栈:', pages);
        
        if (pages.length > 1) {
          // 有上一页，可以返回
          uni.navigateBack({
            delta: 1,
            success: () => {
              // 导航完成后再次发送刷新事件
              setTimeout(() => {
                uni.$emit('runningListShouldRefresh');
              }, 500);
            }
          });
        } else {
          // 没有上一页，跳转到跑腿列表页面
          uni.redirectTo({
            url: '/pages/square/running'  // 根据你的实际路由调整
          });
        }
      }, 1500);
    } else {
      uni.showToast({
        title: res.data.message || '发起失败，请重试',
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('发起跑腿失败:', error);
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none'
    });
  }
};
</script>

<style lang="scss" scoped>
.sponsor-running-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;

  .navbar {
    display: flex;
    align-items: center;
    padding: 15px 16px;
    background-color: #fff;
    border-bottom: 1px solid #eee;

    .back-btn {
      margin-right: 16px;
    }

    .title {
      flex: 1;
      text-align: center;
      font-size: 18px;
      font-weight: 500;
    }
  }

  .content {
    flex: 1;
    padding: 16px;

    .login-prompt {
      background-color: #fff;
      border-radius: 8px;
      padding: 40px 20px;
      text-align: center;
      margin-bottom: 16px;

      .prompt-text {
        display: block;
        font-size: 16px;
        color: #666;
        margin-bottom: 20px;
      }

      .login-btn {
        background-color: #07c160;
        color: #fff;
        border-radius: 6px;
        border: none;
        padding: 10px 20px;
        font-size: 14px;
      }
    }

    .section {
      background-color: #fff;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;

      .section-title {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        font-size: 16px;
        font-weight: 500;

        .tips {
          font-size: 12px;
          color: #666;
          font-weight: normal;
          margin-left: 8px;
        }
      }

      .search-box {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        background-color: #f5f5f5;
        border-radius: 6px;
        margin-bottom: 12px;

        .search-input {
          flex: 1;
          margin-left: 8px;
          font-size: 14px;
        }
      }

      .search-results {
        max-height: 200px;
        overflow-y: auto;
        margin-bottom: 12px;
        border: 1px solid #eee;
        border-radius: 6px;
        background-color: #fff;
        position: relative;
        z-index: 10;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        .result-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid #f0f0f0;
          font-size: 14px;
          background-color: #fff;

          &:last-child {
            border-bottom: none;
          }

          &:active {
            background-color: #f8f8f8;
          }
        }
      }

      .no-results {
        padding: 12px 16px;
        text-align: center;
        color: #999;
        font-size: 14px;
        margin-bottom: 12px;
        
        .no-results-text {
          color: #999;
        }
      }

      .default-section {
        margin-bottom: 16px;
        
        .default-title {
          display: block;
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
          font-weight: 500;
        }
        
        .default-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          
          .default-item {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            background-color: #f0f7ff;
            border: 1px solid #d1e9ff;
            border-radius: 6px;
            font-size: 14px;
            transition: all 0.3s;
            
            .default-item-text {
              margin-right: 8px;
              color: #007AFF;
            }
            
            &:active {
              background-color: #e1f0ff;
            }
          }
        }
      }

      .selected-list {
        margin-top: 16px;
        
        .selected-title {
          display: block;
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
          font-weight: 500;
        }
        
        .selected-items {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .selected-item {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          font-size: 14px;
          min-height: 36px;
          width: calc(50% - 4px);
          box-sizing: border-box;
          transition: all 0.3s;
          
          .selected-content {
            display: flex;
            align-items: center;
            flex: 1;
          }
          
          .selected-index {
            width: 20px;
            height: 20px;
            background-color: #07c160;
            color: #fff;
            border-radius: 50%;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 8px;
            flex-shrink: 0;
          }
          
          .selected-name {
            flex: 1;
            color: #333;
          }
          
          .delete-btn {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: #fff;
            border: 1px solid #ff4444;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: all 0.3s;
            
            &:active {
              background-color: #ff4444;
              
              .uni-icons {
                color: #fff !important;
              }
            }
          }
          
          &:active {
            background-color: #e9ecef;
          }
        }
      }

      .form-item {
        display: flex;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #eee;

        &:last-child {
          border-bottom: none;
        }

        .label {
          width: 120px;
          font-size: 14px;
          color: #333;
          flex-shrink: 0;
        }

        .input-area {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #333;
          font-size: 14px;
          padding: 8px 0;

          .placeholder {
            color: #999;
          }

          .time-text {
            color: #333;
          }
        }

        .input-with-stepper {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          
          .input {
            flex: 1;
            height: 36px;
            padding: 0;
            font-size: 14px;
            color: #333;
            text-align: left;
          }
          
          .stepper {
            display: flex;
            align-items: center;
            margin-left: 12px;
            
            .stepper-btn {
              width: 28px;
              height: 28px;
              border: 1px solid #ddd;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: #f8f9fa;
              
              &.minus {
                border-radius: 4px 0 0 4px;
                border-right: none;
              }
              
              &.plus {
                border-radius: 0 4px 4px 0;
              }
              
              &.disabled {
                background-color: #f5f5f5;
                opacity: 0.5;
                
                .uni-icons {
                  color: #ccc !important;
                }
              }
              
              &:active:not(.disabled) {
                background-color: #e9ecef;
              }
            }
          }
        }
      }

      .time-tip {
        display: block;
        font-size: 12px;
        color: #999;
        margin-top: 8px;
        line-height: 1.4;
      }
      
      .quantity-info {
        margin-top: 16px;
        padding: 12px;
        background-color: #f8f9fa;
        border-radius: 6px;
        
        .quantity-text {
          display: block;
          font-size: 14px;
          color: #333;
          margin-bottom: 8px;
          text-align: center;
        }
        
        .quantity-progress {
          display: flex;
          flex-direction: column;
          align-items: center;
          
          .progress-bar {
            width: 100%;
            height: 6px;
            background-color: #e9ecef;
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 6px;
            
            .progress-fill {
              height: 100%;
              background: linear-gradient(90deg, #07c160, #5cd491);
              border-radius: 3px;
              transition: width 0.3s ease;
            }
          }
          
          .progress-text {
            font-size: 12px;
            color: #666;
          }
        }
      }
    }
  }

  .bottom-btn-area {
    padding: 16px;
    background-color: #fff;
    border-top: 1px solid #eee;

    .submit-btn {
      width: 100%;
      height: 48px;
      background-color: #07c160;
      color: #fff;
      border-radius: 8px;
      font-size: 16px;
      border: none;

      &.disabled {
        background-color: #ccc;
        color: #999;
      }
    }
  }

  .time-picker-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-end;
    z-index: 999;

    .time-picker-content {
      width: 100%;
      background-color: #fff;
      border-radius: 16px 16px 0 0;
      padding-bottom: env(safe-area-inset-bottom);

      .time-picker-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-bottom: 1px solid #eee;

        .cancel-btn, .confirm-btn {
          font-size: 16px;
          color: #07c160;
        }

        .title {
          font-size: 16px;
          font-weight: 500;
        }
      }

      .time-picker {
        height: 300px;
        width: 100%;

        .picker-item {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 50px;
          font-size: 16px;
        }
      }
    }
  }
}
</style>