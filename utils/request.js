// utils/request.js

// 创建独立的获取用户信息函数，避免循环依赖
const getUserInfoForRequest = () => {
  try {
    // 直接从本地存储获取，避免依赖 store
    const userInfoStr = uni.getStorageSync('userInfo');
    const userid = uni.getStorageSync('userid');
    const schoolid = uni.getStorageSync('schoolid');
    
    if (userInfoStr) {
      return typeof userInfoStr === 'string' ? JSON.parse(userInfoStr) : userInfoStr;
    } else if (userid && schoolid) {
      return {
        userid: userid,
        schoolid: schoolid,
        schoolname: uni.getStorageSync('schoolname') || '广州商学院'
      };
    }
    
    return null;
  } catch (error) {
    console.error('获取请求用户信息失败:', error);
    return null;
  }
};

export const uniRequest = (options) => {
  const baseUrl = 'http://www.gongxiangfeng.com:12100/campusnav';
  
  // 完整的请求URL
  const fullUrl = baseUrl + options.url;
  
  // 准备请求数据 - 确保参数类型正确
  const prepareRequestData = (data) => {
    const userInfo = getUserInfoForRequest();
    const preparedData = { ...data };
    
    // 自动添加必要的用户参数，但优先使用传入的参数
    if (userInfo) {
      if (preparedData.userid === undefined && userInfo.userid) {
        preparedData.userid = userInfo.userid;
      }
      if (preparedData.schoolid === undefined && userInfo.schoolid) {
        preparedData.schoolid = userInfo.schoolid;
      }
    }
    
    // 确保数值类型参数正确转换
    if (preparedData.userid) {
      preparedData.userid = Number(preparedData.userid) || preparedData.userid;
    }
    if (preparedData.schoolid) {
      preparedData.schoolid = Number(preparedData.schoolid) || preparedData.schoolid;
    }
    
    // 移除undefined值
    Object.keys(preparedData).forEach(key => {
      if (preparedData[key] === undefined) {
        delete preparedData[key];
      }
    });
    
    return preparedData;
  };
  
  const requestData = prepareRequestData(options.data || {});
  
  // 记录请求详情
  console.log('[Request Debug] 请求详情:', {
    url: fullUrl,
    method: options.method || 'GET',
    data: requestData,
    timeout: options.timeout || 10000, // 缩短超时时间
    header: {
      'Content-Type': 'application/json',
      'token': uni.getStorageSync('token') || ''
    }
  });

  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      url: fullUrl,
      data: requestData,
      timeout: options.timeout || 10000,
      header: {
        'Content-Type': 'application/json',
        'token': uni.getStorageSync('token') || '',
        ...options.header
      },
      success: (res) => {
        // 记录响应详情
        console.log('[Response Debug] 完整响应数据:', res);
        console.log('[Response Debug] 响应状态码:', res.statusCode);
        console.log('[Response Debug] 响应数据:', res.data);
        
        // HTTP 层面成功（网络请求成功）
        if (res.statusCode === 200) {
          // 检查响应数据结构
          if (res.data && typeof res.data === 'object') {
            // 业务层面成功 - 检查是否有 code 字段
            if (res.data.hasOwnProperty('code')) {
              if (res.data.code === 0) {
                resolve(res.data);
              } else {
                // 业务层面失败，但HTTP请求是成功的
                const errorMsg = res.data?.message || `业务错误，错误码：${res.data.code}`;
                console.error('[Request Error] 业务错误:', errorMsg);
                
                // 显示错误提示
                if (options.showError !== false) {
                  uni.showToast({ 
                    title: errorMsg, 
                    icon: 'none',
                    duration: 2000
                  });
                }
                
                reject({ 
                  code: res.data.code, 
                  message: errorMsg,
                  data: res.data
                });
              }
            } else {
              // 没有 code 字段，构造标准格式返回
              console.warn('[Request Warning] 响应数据没有code字段，构造标准格式返回');
              
              const normalizedResponse = {
                code: 0,
                message: 'success',
                data: res.data
              };
              resolve(normalizedResponse);
            }
          } else {
            // 响应数据不是对象，构造标准格式返回
            console.warn('[Request Warning] 响应数据不是对象:', res.data);
            
            const normalizedResponse = {
              code: 0,
              message: 'success',
              data: res.data
            };
            resolve(normalizedResponse);
          }
        } else {
          // HTTP 层面失败
          const errorMsg = `HTTP错误，状态码：${res.statusCode}`;
          console.error('[Request Error] HTTP错误:', errorMsg);
          
          // 显示更详细的错误信息
          let userMsg = errorMsg;
          if (res.statusCode === 400) {
            userMsg = '请求参数错误，请检查登录状态';
          } else if (res.statusCode === 401) {
            userMsg = '未授权，请重新登录';
          } else if (res.statusCode === 500) {
            userMsg = '服务器内部错误';
          }
          
          uni.showToast({ 
            title: userMsg, 
            icon: 'none',
            duration: 2000
          });
          reject({ 
            code: res.statusCode, 
            message: errorMsg,
            userMessage: userMsg
          });
        }
      },
      fail: (error) => {
        // 细化错误类型（超时、网络断开等）
        const errorDetail = {
          errMsg: error.errMsg,
          isTimeout: error.errMsg.includes('timeout'),
          isNetworkError: error.errMsg.includes('network')
        };
        
        console.error('[Request Error] 请求失败详情:', errorDetail);
        
        let userMsg = '网络异常，请检查连接';
        if (errorDetail.isTimeout) {
          userMsg = '请求超时，请重试';
        }
        
        uni.showToast({
          title: userMsg,
          icon: 'none',
          duration: 2000
        });
        
        reject(errorDetail);
      }
    });
  });
};
