/// utils/store.js
class Store {
  constructor() {
    this._callbacks = [];
    this.isLoggedIn = false;
    this.userInfo = {};
    this.init();
  }
  
  init() {
    this.checkLoginStatus();
  }
  
  // 检查登录状态 - 修复版本
  checkLoginStatus() {
    try {
      const token = uni.getStorageSync('token');
      const userInfoStr = uni.getStorageSync('userInfo');
      const userid = uni.getStorageSync('userid');
      const schoolid = uni.getStorageSync('schoolid');
      
      console.log('Store - 检查登录状态:', { 
        token: !!token, 
        userInfoStr: !!userInfoStr,
        userid: userid,
        schoolid: schoolid
      });
      
      let userInfo = {};
      
      // 优先从userInfo字符串解析
      if (userInfoStr) {
        try {
          userInfo = typeof userInfoStr === 'string' ? JSON.parse(userInfoStr) : userInfoStr;
        } catch (e) {
          console.error('解析userInfo失败:', e);
        }
      }
      
      // 如果userInfo中没有必要字段，尝试从单独存储的字段补充
      if (!userInfo.userid && userid) {
        userInfo.userid = userid;
      }
      if (!userInfo.schoolid && schoolid) {
        userInfo.schoolid = schoolid;
      }
      if (!userInfo.schoolname) {
        userInfo.schoolname = uni.getStorageSync('schoolname') || '广州商学院';
      }
      
      if (token && userInfo.userid) {
        this.isLoggedIn = true;
        this.userInfo = userInfo;
        console.log('Store - 用户已登录:', userInfo);
        this._notify();
        return true;
      } else {
        this.isLoggedIn = false;
        this.userInfo = {};
        console.log('Store - 用户未登录');
        this._notify();
        return false;
      }
    } catch (error) {
      console.error('Store - 检查登录状态失败:', error);
      this.isLoggedIn = false;
      this.userInfo = {};
      this._notify();
      return false;
    }
  }
  
  // 登录 - 修复版本
  login(token, userInfo) {
    console.log('Store - 用户登录:', userInfo);
    
    try {
      // 确保userInfo包含必要字段
      const completeUserInfo = {
        ...userInfo,
        userid: userInfo.userid || uni.getStorageSync('userid'),
        schoolid: userInfo.schoolid || uni.getStorageSync('schoolid'),
        schoolname: userInfo.schoolname || uni.getStorageSync('schoolname') || '广州商学院'
      };
      
      // 保存到本地存储
      uni.setStorageSync('token', token);
      uni.setStorageSync('userInfo', completeUserInfo);
      uni.setStorageSync('userid', completeUserInfo.userid);
      uni.setStorageSync('schoolid', completeUserInfo.schoolid);
      uni.setStorageSync('schoolname', completeUserInfo.schoolname);
      
      this.isLoggedIn = true;
      this.userInfo = completeUserInfo;
      
      console.log('Store - 登录信息保存成功:', completeUserInfo);
      this._notify();
    } catch (error) {
      console.error('Store - 登录信息保存失败:', error);
    }
  }
  
  // 退出登录
  logout() {
    console.log('Store - 用户退出登录');
    try {
      uni.removeStorageSync('token');
      uni.removeStorageSync('userInfo');
      // 保留学校信息，下次登录可能还用同一个学校
      // uni.removeStorageSync('userid');
      // uni.removeStorageSync('schoolid');
      // uni.removeStorageSync('schoolname');
      
      this.isLoggedIn = false;
      this.userInfo = {};
      console.log('Store - 退出登录成功');
      this._notify();
    } catch (error) {
      console.error('Store - 退出登录失败:', error);
    }
  }
  
  // 更新用户信息
  updateUserInfo(userInfo) {
    console.log('Store - 更新用户信息:', userInfo);
    try {
      this.userInfo = { ...this.userInfo, ...userInfo };
      uni.setStorageSync('userInfo', this.userInfo);
      
      if (userInfo.schoolid) {
        uni.setStorageSync('schoolid', userInfo.schoolid);
      }
      if (userInfo.schoolname) {
        uni.setStorageSync('schoolname', userInfo.schoolname);
      }
      
      this._notify();
    } catch (error) {
      console.error('Store - 更新用户信息失败:', error);
    }
  }
  
  // 订阅状态变化
  subscribe(callback) {
    this._callbacks.push(callback);
    return () => {
      const index = this._callbacks.indexOf(callback);
      if (index > -1) {
        this._callbacks.splice(index, 1);
      }
    };
  }
  
  // 通知所有订阅者
  _notify() {
    this._callbacks.forEach(callback => {
      try {
        callback(this.isLoggedIn, this.userInfo);
      } catch (error) {
        console.error('Store通知错误:', error);
      }
    });
  }
}

// 创建全局单例
export default new Store();