<template>
	<view class="user-contract-container">

		<!-- 协议内容区域 -->
		<scroll-view class="contract-content" scroll-y="true">
			<!-- 加载状态 -->
			<view class="loading-state" v-if="loading">
				<text class="loading-text">加载中...</text>
			</view>
			
			<!-- 空状态 -->
			<view class="empty-state" v-if="!loading && contractData.length === 0">
				<text class="empty-text">暂无用户协议内容</text>
			</view>
			
			<!-- 协议内容 -->
			<view class="contract-section" v-for="(section, index) in contractData" :key="index">
				<view class="section-title">{{ section.title }}</view>
				<view class="section-content">
					<view 
						class="content-item" 
						v-for="(item, itemIndex) in section.content" 
						:key="itemIndex"
					>
						<view v-if="item.subitem" class="subitem">
							<text class="subitem-text">{{ item.subitem }}</text>
						</view>
						<view v-else-if="item.item" class="item">
							<text class="item-text">{{ item.item }}</text>
						</view>
						<view v-else-if="typeof item === 'string'" class="item">
							<text class="item-text">{{ item }}</text>
						</view>
						<view v-else-if="item.content" class="item">
							<text class="item-text">{{ item.content }}</text>
						</view>
						<view v-else class="unknown-item">
							<text class="unknown-text">{{ JSON.stringify(item) }}</text>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { uniRequest } from '@/utils/request'

// 响应式数据
const contractData = ref([])
const loading = ref(false)

// 返回上一页
const goBack = () => {
	uni.navigateBack()
}

// 获取用户协议数据
const getUserContract = async () => {
	loading.value = true
	try {
		console.log('开始调用 getUserContract 接口...')
		
		const res = await uniRequest({
			url: '/getUserContract',
			method: 'GET',
			showError: true
		})
		
		console.log('用户协议接口响应:', res)
		
		if (res.code === 0) {
			const data = res.data
			console.log('接口返回的数据:', data)
			
			// 根据接口文档中的数据结构处理
			// 根据接口文档，getUserContract 应该返回数组格式的数据
			if (Array.isArray(data) && data.length > 0) {
				console.log('数据是数组格式，直接使用')
				contractData.value = normalizeContent(data)
			} else if (data && typeof data === 'object') {
				// 如果是对象，尝试提取协议内容
				console.log('数据是对象格式，尝试提取协议内容')
				contractData.value = extractContractFromObject(data)
			} else {
				console.warn('数据格式不符合预期，使用默认数据')
				contractData.value = getDefaultContractData()
			}
			
			console.log('最终协议数据:', contractData.value)
		} else {
			throw new Error(res.message || '获取用户协议失败')
		}
		
	} catch (error) {
		console.error('获取用户协议失败:', error)
		uni.showToast({
			title: error.message || '获取用户协议失败',
			icon: 'none',
			duration: 3000
		})
		contractData.value = getDefaultContractData()
	} finally {
		loading.value = false
	}
}

// 标准化内容格式
const normalizeContent = (data) => {
	return data.map(section => {
		if (section.content && Array.isArray(section.content)) {
			return {
				title: section.title || '未命名章节',
				content: section.content.map(item => {
					// 处理不同的内容格式
					if (typeof item === 'string') {
						return { item }
					} else if (item.subitem) {
						return { subitem: item.subitem }
					} else if (item.item) {
						return { item: item.item }
					} else if (item.content) {
						return { item: item.content }
					} else {
						return { item: JSON.stringify(item) }
					}
				})
			}
		} else {
			return {
				title: section.title || '未命名章节',
				content: [{ item: '暂无内容' }]
			}
		}
	})
}

// 从对象中提取协议内容
const extractContractFromObject = (data) => {
	// 根据接口文档，用户协议数据应该是数组格式
	// 但如果返回的是对象，我们尝试提取可能的协议内容
	
	// 方法1: 查找包含协议内容的数组字段
	const possibleArrays = ['agreements', 'contracts', 'clauses', 'sections', 'content', 'data']
	for (const key of possibleArrays) {
		if (data[key] && Array.isArray(data[key])) {
			console.log(`从字段 ${key} 找到协议数据`)
			return normalizeContent(data[key])
		}
	}
	
	// 方法2: 如果对象有 title 和 content 字段，作为单个章节
	if (data.title && data.content) {
		console.log('对象包含 title 和 content，作为单个章节')
		return normalizeContent([data])
	}
	
	// 方法3: 将对象的所有属性转换为章节
	console.log('将对象属性转换为章节')
	const result = []
	Object.keys(data).forEach(key => {
		const value = data[key]
		if (value && typeof value === 'object') {
			if (value.title && value.content) {
				result.push({
					title: value.title,
					content: Array.isArray(value.content) ? value.content : [value.content]
				})
			} else if (Array.isArray(value)) {
				result.push({
					title: key,
					content: value
				})
			} else {
				result.push({
					title: key,
					content: [value]
				})
			}
		} else {
			result.push({
				title: key,
				content: [{ item: String(value) }]
			})
		}
	})
	
	return result.length > 0 ? normalizeContent(result) : getDefaultContractData()
}

// 默认用户协议数据
const getDefaultContractData = () => {
	return [
		{
			title: "用户协议",
			content: [
				{
					item: "欢迎使用校园生活平台！"
				},
				{
					item: "请仔细阅读以下用户协议内容。"
				}
			]
		},
		{
			title: "一、服务条款",
			content: [
				{
					subitem: "1.您在使用本平台服务时，应遵守相关法律法规。"
				},
				{
					subitem: "2.平台有权根据业务需要调整服务内容。"
				}
			]
		},
		{
			title: "二、隐私政策",
			content: [
				{
					subitem: "1.我们重视您的隐私，会保护您的个人信息。"
				},
				{
					subitem: "2.未经您同意，我们不会向第三方透露您的信息。"
				}
			]
		},
		{
			title: "三、用户责任",
			content: [
				{
					subitem: "1.您应妥善保管账号信息，不得转让、出借或分享给他人使用。"
				},
				{
					subitem: "2.您在使用平台服务过程中发布的信息应真实、准确、合法。"
				}
			]
		}
	]
}

// 页面加载时获取数据
onLoad(() => {
	getUserContract()
})
</script>

<style lang="scss" scoped>
.user-contract-container {
	height: 100vh;
	background-color: #f8f8f8;
	display: flex;
	flex-direction: column;
}

.nav-bar {
	height: 88rpx;
	background-color: #ffffff;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 30rpx;
	border-bottom: 1rpx solid #e5e5e5;
	position: sticky;
	top: 0;
	z-index: 100;
	
	.nav-back {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		
		.back-icon {
			font-size: 48rpx;
			color: #333;
			line-height: 1;
		}
	}
	
	.nav-title {
		font-size: 36rpx;
		font-weight: 600;
		color: #333;
	}
	
	.nav-placeholder {
		width: 60rpx;
	}
}

.contract-content {
	flex: 1;
	padding: 30rpx;
	background-color: #fff;
}

.contract-section {
	margin-bottom: 50rpx;
	
	&:last-child {
		margin-bottom: 0;
	}
	
	.section-title {
		font-size: 34rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 25rpx;
		line-height: 1.4;
		padding-bottom: 15rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}
	
	.section-content {
		.content-item {
			margin-bottom: 20rpx;
			
			&:last-child {
				margin-bottom: 0;
			}
			
			.subitem {
				margin-bottom: 15rpx;
				padding-left: 20rpx;
				
				.subitem-text {
					font-size: 28rpx;
					color: #666;
					line-height: 1.7;
					text-align: justify;
				}
			}
			
			.item {
				margin-bottom: 15rpx;
				
				.item-text {
					font-size: 28rpx;
					color: #666;
					line-height: 1.7;
					text-align: justify;
				}
			}
			
			.unknown-item {
				margin-bottom: 15rpx;
				padding: 10rpx;
				background-color: #f9f9f9;
				border-radius: 8rpx;
				
				.unknown-text {
					font-size: 24rpx;
					color: #999;
					font-family: monospace;
				}
			}
		}
	}
}

.loading-state {
	text-align: center;
	padding: 100rpx 0;
	
	.loading-text {
		font-size: 28rpx;
		color: #999;
	}
}

.empty-state {
	text-align: center;
	padding: 150rpx 0;
	
	.empty-text {
		font-size: 28rpx;
		color: #999;
	}
}
</style>