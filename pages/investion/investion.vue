<template>
	<view class="investion-container">

		<!-- 未登录提示 -->
		<view v-if="!isLoggedIn" class="login-prompt">
			<view class="prompt-content">
				<text class="prompt-text">您还未登录，请先登录查看邀约详情</text>
				<button class="login-btn" @click="goToLogin">立即登录</button>
			</view>
		</view>

		<scroll-view v-else class="content" scroll-y>
			<view class="investion-content">
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
				<view v-else-if="dateDetail">
					<!-- 标题区域 -->
					<view class="title-section">
						<text class="main-title">标题：{{ dateDetail.title }}</text>
					</view>

					<!-- 邀约者信息 -->
					<view class="invitor-section">
						<view class="section-header">邀约者简介：</view>
						<view class="invitor-info">
							<!-- 修改：使用文字头像，类似my界面 -->
							<view class="invitor-avatar">
								<text class="avatar-text">{{ getAvatarText(dateDetail.invitor_username) }}</text>
							</view>
							<view class="invitor-details">
								<text class="invitor-name">{{ dateDetail.invitor_username || '未知用户' }}</text>
								<text class="invitor-intro">{{ dateDetail.invitor_intro || '暂无简介' }}</text>
							</view>
						</view>
					</view>

					<!-- 选我的理由和报名费 -->
					<view class="reason-section">
						<view class="section-header">选我的理由</view>
						<view class="signup-fee">报名费{{ dateDetail.signup_fee || 1 }}元 {{ dateDetail.confirms || 0 }}/{{ dateDetail.maxpersons || 0 }}</view>
					</view>

					<!-- 事由 -->
					<view class="section">
						<view class="section-header">事由：</view>
						<view class="section-content">{{ dateDetail.reason || '暂无说明' }}</view>
					</view>

					<!-- 请吃内容 -->
					<view class="section">
						<view class="section-header">请吃：</view>
						<view class="section-content highlight">{{ dateDetail.feed || '暂无说明' }}</view>
					</view>

					<!-- 人均消费 -->
					<view class="section">
						<view class="section-header">预计人均消费：</view>
						<view class="section-content price">￥{{ dateDetail.av_fee || 0 }}</view>
					</view>

					<!-- 参与者要求 -->
					<view class="section">
						<view class="section-header">希望参与者：</view>
						<view class="section-content">{{ dateDetail.demands || '无特定要求' }}</view>
					</view>

					<!-- 基本信息 -->
					<view class="info-grid">
						<view class="info-item">
							<text class="info-label">时间：</text>
							<text class="info-value">{{ dateDetail.time || '未设置' }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">地点：</text>
							<text class="info-value">{{ dateDetail.name || '未设置' }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">报名截止时间：</text>
							<text class="info-value">{{ dateDetail.deadline || '未设置' }}</text>
						</view>
					</view>

					<!-- 人数统计 -->
					<view class="stats-section">
						<text class="stats-text">
							预计人数：{{ dateDetail.maxpersons || 0 }}人 
							报名：{{ dateDetail.signups || 0 }}人 
							确定：{{ dateDetail.confirms || 0 }}人
						</text>
					</view>

					<!-- 用户输入区域 -->
					<view class="input-section">
						<view class="input-header">
							<text>请输入你的简况、对本主题的一些看法或观点...</text>
						</view>
						<textarea 
							class="input-area"
							v-model="userInput"
							placeholder="请简要介绍自己并说明对本次邀约的看法..."
							maxlength="500"
							:show-confirm-bar="false"
						></textarea>
						<view class="input-counter">{{ userInput.length }}/500</view>
					</view>

					<!-- 报名提示 -->
					<view class="tip-section">
						<text class="tip-text">
							注：报名后，由发起人进行选择是否参加邀约聚会。为避免用户随意报名，设置了少量报名费。报名后，不论用户是否被选择参加邀约聚会，报名费均不退还。
						</text>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 底部报名按钮 -->
		<view v-if="isLoggedIn && !loading && !error" class="bottom-action">
			<button 
				class="submit-btn" 
				@click="handleSignUp"
				:disabled="!userInput.trim()"
				:class="{ disabled: !userInput.trim() }"
			>
				我要报名
			</button>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

// 邀约详情数据
const dateDetail = ref(null);
const userInput = ref('');
const dateId = ref(null);
const baseImgUrl = ref('');
const loading = ref(false);
const error = ref('');

// 计算属性：检查登录状态
const isLoggedIn = computed(() => {
  const token = uni.getStorageSync('token');
  const userInfo = uni.getStorageSync('userInfo');
  return !!(token && userInfo);
});

// 获取头像文本 - 新增函数
const getAvatarText = (username) => {
  if (!username) return '?';
  return username.charAt(0).toUpperCase();
};

// 获取当前用户ID
const getUserId = () => {
  const userInfo = uni.getStorageSync('userInfo');
  return userInfo ? userInfo.userid : null;
};

// 获取当前用户学校ID - 从login.vue设置的selectedSchoolId获取
const getSchoolId = () => {
  const userInfo = uni.getStorageSync('userInfo');
  // 优先使用selectedSchoolId，如果没有则使用schoolid
  if (userInfo) {
    if (userInfo.selectedSchoolId) {
      return userInfo.selectedSchoolId;
    } else if (userInfo.schoolid) {
      return userInfo.schoolid;
    }
  }
  return null;
};

// 获取当前用户学校名称
const getSchoolName = () => {
  const userInfo = uni.getStorageSync('userInfo');
  return userInfo ? (userInfo.selectedSchoolName || userInfo.schoolname) : null;
};

// 跳转到登录页面
const goToLogin = () => {
  uni.reLaunch({
    url: '/pages/login/login'
  });
};

// 获取路由参数中的date_id
onLoad((options) => {
	console.log('邀约详情页面加载，参数:', options);
	
	if (options && options.date_id) {
		dateId.value = options.date_id;
		checkAndLoadData();
	} else {
		error.value = '参数错误，缺少邀约ID';
	}
});

// 检查登录状态并加载数据
const checkAndLoadData = () => {
	if (isLoggedIn.value) {
		console.log('用户已登录，开始加载数据');
		console.log('用户信息:', uni.getStorageSync('userInfo'));
		console.log('学校ID:', getSchoolId());
		console.log('学校名称:', getSchoolName());
		fetchBaseSetting();
		fetchDateDetail();
	} else {
		console.log('用户未登录，显示登录提示');
	}
};

// 获取基本配置
const fetchBaseSetting = async () => {
	try {
		const userid = getUserId();
		if (!userid) {
			console.log('用户未登录，跳过获取基本配置');
			return;
		}
		
		const res = await uni.request({
			url: `http://www.gongxiangfeng.com:12100/campusnav/getBaseSetting`,
			method: 'GET',
			data: { userid }
		});
		
		console.log('获取基本配置响应:', res.data);
		
		if (res.data.code === 0 && res.data.data) {
			baseImgUrl.value = res.data.data.baseImgUrl || '';
		}
	} catch (error) {
		console.error('获取基本配置失败:', error);
	}
};

// 获取邀约详情API
const fetchDateDetail = async () => {
	if (!isLoggedIn.value) {
		console.log('用户未登录，跳过获取邀约详情');
		return;
	}

	loading.value = true;
	error.value = '';
	
	try {
		const userid = getUserId();
		const schoolid = getSchoolId();
		
		if (!userid) {
			error.value = '用户未登录';
			return;
		}
		
		if (!schoolid) {
			error.value = '未找到学校信息，请检查用户信息';
			return;
		}
		
		// 确保参数是数字类型
		const params = {
			userid: Number(userid),
			date_id: Number(dateId.value),
			schoolid: Number(schoolid)
		};
		
		console.log('请求邀约详情参数:', params);
		
		// 使用GET请求，参数放在URL中
		const res = await uni.request({
			url: `http://www.gongxiangfeng.com:12100/campusnav/getDateDetail`,
			method: 'GET',
			data: params
		});
		
		console.log('获取邀约详情响应:', res.data);
		
		if (res.data.code === 0) {
			dateDetail.value = {
				...res.data.data,
				av_fee: Number(res.data.data.av_fee) || 0,
				maxpersons: Number(res.data.data.maxpersons) || 0,
				signups: Number(res.data.data.signups) || 0,
				confirms: Number(res.data.data.confirms) || 0,
				signup_fee: Number(res.data.data.signup_fee) || 1
			};
		} else {
			error.value = res.data.message || '获取详情失败';
			uni.showToast({ 
				title: res.data.message || '获取详情失败', 
				icon: 'none' 
			});
		}
	} catch (err) {
		console.error('获取邀约详情失败:', err);
		error.value = '网络错误，请重试';
		uni.showToast({ 
			title: '网络错误，请重试', 
			icon: 'none' 
		});
	} finally {
		loading.value = false;
	}
};

// 返回上一页
const navigateBack = () => {
	uni.navigateBack();
};

// 处理报名
const handleSignUp = async () => {
	if (!userInput.value.trim()) {
		uni.showToast({ title: '请填写报名信息', icon: 'none' });
		return;
	}

	try {
		const userid = getUserId();
		const schoolid = getSchoolId();
		
		if (!userid) {
			uni.showToast({ title: '请先登录', icon: 'none' });
			return;
		}
		
		if (!schoolid) {
			uni.showToast({ title: '未找到学校信息', icon: 'none' });
			return;
		}
		
		// 确保参数是数字类型
		const params = {
			userid: Number(userid),
			date_id: Number(dateId.value),
			message: userInput.value,
			schoolid: Number(schoolid)
		};
		
		console.log('报名参数:', params);
		
		const res = await uni.request({
			url: `http://www.gongxiangfeng.com:12100/campusnav/signUpForDate`,
			method: 'POST',
			header: { 
				'Content-Type': 'application/json'
			},
			data: params
		});
		
		console.log('报名响应:', res.data);
		
		if (res.data.code === 0) {
			uni.showToast({ 
				title: '报名成功', 
				icon: 'success',
				duration: 2000
			});
			
			// 返回上一页并更新数据
			setTimeout(() => {
				uni.navigateBack();
			}, 1500);
		} else {
			uni.showToast({ 
				title: res.data.message || '报名失败', 
				icon: 'none' 
			});
		}
	} catch (err) {
		console.error('报名失败:', err);
		uni.showToast({ title: '网络错误，请重试', icon: 'none' });
	}
};
</script>

<style lang="scss" scoped>
.investion-container {
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
			display: flex;
			align-items: center;
			margin-right: 16px;
			color: #007AFF;
			
			.back-icon {
				font-size: 24px;
				margin-right: 4px;
			}
			
			.back-text {
				font-size: 16px;
			}
		}

		.title {
			flex: 1;
			text-align: center;
			font-size: 18px;
			font-weight: 500;
		}
	}

	/* 未登录提示样式 */
	.login-prompt {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 40rpx;
		
		.prompt-content {
			text-align: center;
			background: white;
			padding: 60rpx 40rpx;
			border-radius: 20rpx;
			box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
			
			.prompt-text {
				display: block;
				font-size: 32rpx;
				color: #666;
				margin-bottom: 40rpx;
			}
			
			.login-btn {
				background: linear-gradient(135deg, #007AFF, #0056CC);
				color: white;
				border: none;
				border-radius: 44rpx;
				padding: 20rpx 60rpx;
				font-size: 28rpx;
				font-weight: bold;
			}
		}
	}

	.content {
		flex: 1;
	}

	.investion-content {
		padding: 20rpx 30rpx;

		/* 加载状态 */
		.loading-container {
			display: flex;
			justify-content: center;
			align-items: center;
			height: 200rpx;
			
			.loading-text {
				font-size: 28rpx;
				color: #999;
			}
		}

		/* 错误状态 */
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
				background: #007AFF;
				color: white;
				border: none;
				border-radius: 20rpx;
				padding: 16rpx 40rpx;
				font-size: 28rpx;
			}
		}

		.title-section {
			margin-bottom: 30rpx;
			
			.main-title {
				display: block;
				font-size: 36rpx;
				font-weight: bold;
				color: #333;
				margin-bottom: 10rpx;
			}
			
			.sub-title {
				display: block;
				font-size: 32rpx;
				color: #666;
			}
		}

		.invitor-section {
			background: #fff;
			border-radius: 12rpx;
			padding: 30rpx;
			margin-bottom: 20rpx;

			.section-header {
				font-size: 28rpx;
				font-weight: bold;
				margin-bottom: 20rpx;
				color: #333;
			}

			.invitor-info {
				display: flex;
				align-items: flex-start;

				/* 修改：使用文字头像样式，类似my界面 */
				.invitor-avatar {
					width: 80rpx;
					height: 80rpx;
					border-radius: 50%;
					margin-right: 20rpx;
					flex-shrink: 0;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					display: flex;
					align-items: center;
					justify-content: center;
					border: 2rpx solid rgba(255, 255, 255, 0.3);
				}

				.avatar-text {
					font-size: 32rpx;
					font-weight: bold;
					color: white;
				}

				.invitor-details {
					flex: 1;
					display: flex;
					flex-direction: column;

					.invitor-name {
						font-size: 28rpx;
						font-weight: bold;
						color: #333;
						margin-bottom: 10rpx;
					}

					.invitor-intro {
						font-size: 24rpx;
						color: #666;
						line-height: 1.5;
					}
				}
			}
		}

		.reason-section {
			background: #fff;
			border-radius: 12rpx;
			padding: 30rpx;
			margin-bottom: 20rpx;
			display: flex;
			justify-content: space-between;
			align-items: center;

			.section-header {
				font-size: 28rpx;
				font-weight: bold;
				color: #333;
			}

			.signup-fee {
				font-size: 26rpx;
				color: #e64340;
				font-weight: bold;
			}
		}

		.section {
			background: #fff;
			border-radius: 12rpx;
			padding: 30rpx;
			margin-bottom: 20rpx;

			.section-header {
				font-size: 28rpx;
				font-weight: bold;
				margin-bottom: 15rpx;
				color: #333;
			}

			.section-content {
				font-size: 26rpx;
				color: #666;
				line-height: 1.6;

				&.highlight {
					color: #07c160;
					font-weight: 500;
				}

				&.price {
					color: #e64340;
					font-weight: bold;
					font-size: 32rpx;
				}
			}
		}

		.info-grid {
			background: #fff;
			border-radius: 12rpx;
			padding: 30rpx;
			margin-bottom: 20rpx;

			.info-item {
				display: flex;
				align-items: center;
				padding: 15rpx 0;
				border-bottom: 1rpx solid #f0f0f0;

				&:last-child {
					border-bottom: none;
				}

				.info-label {
					font-size: 28rpx;
					font-weight: bold;
					color: #333;
					width: 200rpx;
					flex-shrink: 0;
				}

				.info-value {
					font-size: 26rpx;
					color: #666;
					flex: 1;
				}
			}
		}

		.stats-section {
			background: #fff;
			border-radius: 12rpx;
			padding: 30rpx;
			margin-bottom: 20rpx;
			text-align: center;

			.stats-text {
				font-size: 28rpx;
				font-weight: bold;
				color: #333;
			}
		}

		.input-section {
			background: #fff;
			border-radius: 12rpx;
			padding: 30rpx;
			margin-bottom: 20rpx;

			.input-header {
				font-size: 28rpx;
				font-weight: bold;
				color: #333;
				margin-bottom: 20rpx;
			}

			.input-area {
				width: 100%;
				height: 200rpx;
				background: #f8f8f8;
				border-radius: 8rpx;
				padding: 20rpx;
				font-size: 26rpx;
				color: #333;
				box-sizing: border-box;
				border: 1rpx solid #e0e0e0;
			}

			.input-counter {
				text-align: right;
				font-size: 24rpx;
				color: #999;
				margin-top: 10rpx;
			}
		}

		.tip-section {
			background: #fff8e1;
			border-radius: 12rpx;
			padding: 30rpx;
			margin-bottom: 20rpx;

			.tip-text {
				font-size: 24rpx;
				color: #666;
				line-height: 1.6;
			}
		}
	}

	.bottom-action {
		padding: 20rpx 30rpx;
		background: #fff;
		border-top: 1rpx solid #eee;

		.submit-btn {
			width: 100%;
			height: 80rpx;
			background: #07c160;
			color: #fff;
			border-radius: 40rpx;
			font-size: 32rpx;
			font-weight: bold;
			display: flex;
			align-items: center;
			justify-content: center;
			border: none;

			&.disabled {
				background: #ccc;
				color: #999;
			}
		}
	}
}
</style>