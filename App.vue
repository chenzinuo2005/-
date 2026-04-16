<script>
import store from '@/utils/store.js'; // 直接导入 store

export default {
  onLaunch: function() {
    console.log('App Launch');
    this.checkLoginStatus();
  },
  onShow: function() {
    console.log('App Show');
  },
  onHide: function() {
    console.log('App Hide');
  },
  methods: {
    checkLoginStatus() {
      // 获取本地存储的token和用户信息
      const token = uni.getStorageSync('token');
      const userInfo = uni.getStorageSync('userInfo');
      const userid = uni.getStorageSync('userid');
      const schoolid = uni.getStorageSync('schoolid');
      
      console.log('检查登录状态:', { 
        token: !!token, 
        userInfo: !!userInfo,
        userid: userid,
        schoolid: schoolid
      });
      
      // 检查必要的登录信息
      const hasValidLogin = token && userid && schoolid;
      
      if (!hasValidLogin) {
        console.log('未登录或登录信息不完整，跳转到登录页');
        // 使用setTimeout避免onLaunch期间跳转问题
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/login/login',
            fail: (err) => {
              console.error('跳转到登录页失败:', err);
              // 备用跳转方案
              uni.navigateTo({
                url: '/pages/login/login'
              });
            }
          });
        }, 100);
      } else {
        console.log('已登录，用户信息:', { userid, schoolid });
        
        // 初始化store状态 - 直接使用导入的store
        store.checkLoginStatus();
      }
    }
  }
};
</script>

<style>
/*每个页面公共css */
page {
  background-color: #f8f8f8;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, 
               'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 
               SimSun, sans-serif;
}

/* 统一按钮样式 */
button {
  border-radius: 8rpx;
}

/* 统一输入框样式 */
input {
  border-radius: 8rpx;
}
</style>