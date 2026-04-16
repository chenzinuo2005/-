<template>
	<view class="map-container">
		<!-- 顶部导航栏 -->
		<view class="navbar">
			<view class="nav-title">地图</view>
		</view>

		<!-- 地图容器 -->
		<view class="map-wrapper">
			<map 
				id="campusMap"
				:latitude="mapCenter.latitude"
				:longitude="mapCenter.longitude"
				:markers="markers"
				:polyline="polyline"
				:scale="scale"
				:show-location="true"
				@markertap="onMarkerTap"
				@regionchange="onRegionChange"
				class="map"
			>
			</map>
			
			<!-- 地图控制按钮 -->
			<view class="map-controls">
				<view class="control-btn" @click="zoomIn">
					<text class="control-icon">+</text>
				</view>
				<view class="control-btn" @click="zoomOut">
					<text class="control-icon">-</text>
				</view>

			</view>

			<!-- 搜索框 -->
			<view class="search-bar">
				<view class="search-input-wrapper">
					<text class="search-icon">🔍</text>
					<input 
						v-model="searchKeyword"
						class="search-input"
						placeholder="搜索建筑物、商家..."
						placeholder-class="placeholder"
						@confirm="handleSearch"
						@input="handleSearchInput"
					/>
					<text v-if="searchKeyword" class="clear-icon" @click="clearSearch">×</text>
				</view>
			</view>

			<!-- 搜索结果 -->
			<view v-if="showSearchResults && searchResults.length > 0" class="search-results">
				<scroll-view class="results-list" scroll-y>
					<view 
						v-for="item in searchResults" 
						:key="item.id"
						class="result-item"
						@click="selectSearchResult(item)"
					>
						<text class="result-name">{{ item.name }}</text>
						<text class="result-type">{{ item.type }}</text>
					</view>
				</scroll-view>
			</view>

			<!-- 底部商家列表 -->
			<view class="bottom-sheet" :class="{ 'sheet-collapsed': !showBottomSheet }">
				<view class="sheet-header" @click="toggleBottomSheet">
					<view class="drag-handle"></view>
					<text class="sheet-title">附近商家</text>
					<text class="sheet-toggle">{{ showBottomSheet ? '收起' : '展开' }}</text>
				</view>
				<scroll-view v-if="showBottomSheet" class="merchant-list" scroll-y>
					<view 
						v-for="merchant in nearbyMerchants" 
						:key="merchant.merchant_id"
						class="merchant-item"
						@click="focusOnMerchant(merchant)"
					>
						<image 
							:src="getImageUrl(merchant.img)" 
							class="merchant-image"
							mode="aspectFill"
							@error="handleImageError"
						></image>
						<view class="merchant-info">
							<text class="merchant-name">{{ merchant.name }}</text>
							<text class="merchant-category">{{ merchant.subcategory }}</text>
							<text class="merchant-building">{{ merchant.building_name }}</text>
							<view class="merchant-tags">
								<text v-if="merchant.has_groupbuy" class="tag groupbuy">团购</text>
								<text v-if="merchant.has_date" class="tag date">邀约</text>
								<text v-if="merchant.has_running" class="tag running">跑腿</text>
							</view>
						</view>
						<view class="merchant-distance">
							<text class="distance">{{ merchant.distance }}</text>
							<text class="navigate-btn" @click.stop="navigateToMerchant(merchant)">导航</text>
						</view>
					</view>
					<view v-if="nearbyMerchants.length === 0 && !loading" class="empty-state">
						<text class="empty-text">暂无附近商家</text>
					</view>
				</scroll-view>
			</view>
		</view>

		<!-- 商家详情弹窗 -->
		<view v-if="selectedMerchant" class="merchant-modal" @click="closeMerchantModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">{{ selectedMerchant.name }}</text>
					<text class="modal-close" @click="closeMerchantModal">×</text>
				</view>
				<view class="modal-body">
					<image 
						:src="getImageUrl(selectedMerchant.img)" 
						class="modal-image"
						mode="aspectFill"
						@error="handleImageError"
					></image>
					<view class="merchant-details">
						<view class="detail-item">
							<text class="label">分类：</text>
							<text class="value">{{ selectedMerchant.subcategory }}</text>
						</view>
						<view class="detail-item">
							<text class="label">位置：</text>
							<text class="value">{{ selectedMerchant.building_name }}</text>
						</view>
						<view class="detail-item">
							<text class="label">距离：</text>
							<text class="value">{{ selectedMerchant.distance }}</text>
						</view>
						<view class="detail-item">
							<text class="label">人均：</text>
							<text class="value">￥{{ selectedMerchant.per_cap_consumption }}</text>
						</view>
						<view class="detail-item">
							<text class="label">评分：</text>
							<text class="value">{{ selectedMerchant.average_rating }}分</text>
						</view>
					</view>
					<view class="action-buttons">
						<button class="btn secondary" @click="closeMerchantModal">取消</button>
						<button class="btn primary" @click="goToMerchantDetail(selectedMerchant)">查看详情</button>
					</view>
				</view>
			</view>
		</view>

		<!-- 权限引导弹窗 -->
		<view v-if="showPermissionGuide" class="permission-guide-modal" @click="closePermissionGuide">
			<view class="permission-content" @click.stop>
				<view class="permission-header">
					<text class="permission-title">开启定位权限</text>
				</view>
				<view class="permission-body">
					<text class="permission-desc">为了更好地为您提供地图导航服务，需要获取您的位置信息</text>
					<view class="permission-steps">
						<view class="step-item">
							<text class="step-number">1</text>
							<text class="step-text">点击右上角 ··· 按钮</text>
						</view>
						<view class="step-item">
							<text class="step-number">2</text>
							<text class="step-text">选择「设置」</text>
						</view>
						<view class="step-item">
							<text class="step-number">3</text>
							<text class="step-text">开启「位置信息」权限</text>
						</view>
					</view>
				</view>
				<view class="permission-actions">
					<button class="btn secondary" @click="closePermissionGuide">取消</button>
					<button class="btn primary" @click="openSetting">前往设置</button>
				</view>
			</view>
		</view>

		<!-- 加载状态 -->
		<view v-if="loading" class="loading-overlay">
			<view class="loading-spinner"></view>
			<text class="loading-text">加载中...</text>
		</view>
	</view>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue';

// 地图中心点（广州商学院坐标）
const mapCenter = reactive({
	latitude: 23.394765,
	longitude: 113.366687
});

// 地图缩放级别
const scale = ref(16);

// 搜索关键词
const searchKeyword = ref('');

// 搜索结果显示控制
const showSearchResults = ref(false);

// 搜索结果
const searchResults = ref([]);

// 底部商家列表显示状态
const showBottomSheet = ref(true);

// 选中的商家
const selectedMerchant = ref(null);

// 权限引导状态
const showPermissionGuide = ref(false);

// 控制变量
const mapContext = ref(null);
const isProgrammaticMove = ref(false);
const isRegionChanging = ref(false);
const mapReady = ref(false);
const loading = ref(false);

// 获取当前实例
const instance = getCurrentInstance();

// 商家数据（从接口获取）
const nearbyMerchants = ref([]);

// 地图标记点
const markers = ref([]);

// 路径规划线
const polyline = ref([]);

// 基础图片URL
const baseImgUrl = ref('');

// 建筑物坐标映射表
const buildingCoords = {
	'8舍': { latitude: 23.395, longitude: 113.367 },
	'9舍': { latitude: 23.3945, longitude: 113.3672 },
	'38栋': { latitude: 23.3952, longitude: 113.3668 },
	'图书馆': { latitude: 23.394, longitude: 113.366 },
	'教学楼A': { latitude: 23.3935, longitude: 113.3675 },
	'食堂': { latitude: 23.3948, longitude: 113.3658 }
};

// 获取图片完整URL
const getImageUrl = (imgPath) => {
	if (!imgPath) return '/static/images/default-merchant.png';
	if (imgPath.startsWith('http')) return imgPath;
	return baseImgUrl.value ? `${baseImgUrl.value}${imgPath}` : imgPath;
};

// 图片加载失败处理
const handleImageError = (e) => {
	console.log('图片加载失败:', e);
	// 可以设置默认图片
};

// 组件挂载时初始化
onMounted(() => {
	initMap();
});

// 初始化地图
const initMap = () => {
	loading.value = true;
	
	// 延迟初始化地图上下文，确保组件完全加载
	setTimeout(() => {
		try {
			mapContext.value = uni.createMapContext('campusMap', instance);
			mapReady.value = true;
			console.log('地图初始化完成');
			
			// 确保地图稳定显示
			setTimeout(() => {
				stabilizeMap();
			}, 500);
		} catch (error) {
			console.error('地图上下文创建失败:', error);
		}
	}, 800);
	
	// 获取基本配置和商家数据
	fetchBaseSetting();
};

// 稳定地图显示
const stabilizeMap = () => {
	if (!mapContext.value) return;
	
	// 确保地图位置稳定
	mapContext.value.moveToLocation({
		latitude: mapCenter.latitude,
		longitude: mapCenter.longitude,
		scale: scale.value,
		success: () => {
			console.log('地图稳定成功');
		},
		fail: (err) => {
			console.warn('地图稳定失败:', err);
		}
	});
};

// 获取基本配置
const fetchBaseSetting = async () => {
	try {
		const userInfo = uni.getStorageSync('userInfo');
		if (!userInfo) {
			console.log('未找到用户信息');
			// 即使没有用户信息，也尝试获取商家数据
			fetchFoodShops();
			return;
		}
		
		const res = await uni.request({
			url: 'http://www.gongxiangfeng.com:12100/campusnav/getBaseSetting',
			method: 'GET',
			data: { userid: userInfo.userid }
		});
		
		if (res.data.code === 0 && res.data.data) {
			baseImgUrl.value = res.data.data.baseImgUrl || '';
			console.log('获取基本配置成功:', baseImgUrl.value);
		}
		
		// 获取商家数据
		fetchFoodShops();
	} catch (error) {
		console.error('获取基本配置失败:', error);
		// 即使失败也尝试获取商家数据
		fetchFoodShops();
	}
};

// 获取校园美食商家数据
const fetchFoodShops = async () => {
	try {
		loading.value = true;
		
		const userInfo = uni.getStorageSync('userInfo');
		const schoolid = userInfo ? userInfo.schoolid : 281474976710657; // 默认学校ID
		
		const res = await uni.request({
			url: 'http://www.gongxiangfeng.com:12100/campusnav/getFoodShops',
			method: 'GET',
			data: { 
				userid: userInfo ? userInfo.userid : 0,
				schoolid: schoolid
			}
		});
		
		if (res.data.code === 0 && res.data.data) {
			// 处理商家数据
			processMerchantData(res.data.data);
			console.log('获取商家数据成功:', res.data.data.length, '个商家');
		} else {
			console.error('获取商家数据失败:', res.data.message);
			uni.showToast({
				title: '获取商家数据失败',
				icon: 'none'
			});
		}
	} catch (error) {
		console.error('获取商家数据失败:', error);
		uni.showToast({
			title: '网络错误，请重试',
			icon: 'none'
		});
	} finally {
		loading.value = false;
	}
};

// 处理商家数据
const processMerchantData = (merchants) => {
	// 更新商家列表
	nearbyMerchants.value = merchants.map(merchant => {
		// 获取建筑物坐标
		const buildingCoord = buildingCoords[merchant.building_name] || 
							buildingCoords[merchant.name] || 
							{ latitude: mapCenter.latitude + (Math.random() - 0.5) * 0.01, 
							  longitude: mapCenter.longitude + (Math.random() - 0.5) * 0.01 };
		
		return {
			...merchant,
			latitude: buildingCoord.latitude,
			longitude: buildingCoord.longitude
		};
	});
	
	// 更新地图标记点
	updateMarkers();
};

// 更新地图标记点
const updateMarkers = () => {
	markers.value = nearbyMerchants.value.map((merchant, index) => {
		return {
			id: merchant.merchant_id,
			latitude: merchant.latitude,
			longitude: merchant.longitude,
			title: merchant.name,
			iconPath: '/static/map/food.png',
			width: 30,
			height: 30,
			callout: {
				content: `${merchant.name}\n${merchant.subcategory}`,
				color: '#333',
				fontSize: 12,
				borderRadius: 4,
				bgColor: '#fff',
				padding: 8,
				display: 'ALWAYS'
			}
		};
	});
};

// 使用地图上下文的方法来移动
const moveToLocation = (latitude, longitude, scaleLevel = 16) => {
	if (!mapReady.value) {
		console.warn('地图未准备好，忽略移动请求');
		return;
	}
	
	isProgrammaticMove.value = true;
	
	if (mapContext.value) {
		mapContext.value.moveToLocation({
			latitude,
			longitude,
			scale: scaleLevel,
			success: () => {
				console.log('地图移动成功');
				// 同时更新中心点坐标，确保同步
				mapCenter.latitude = latitude;
				mapCenter.longitude = longitude;
				scale.value = scaleLevel;
			},
			fail: (err) => {
				console.error('地图移动失败:', err);
				// 降级方案：直接修改中心点
				mapCenter.latitude = latitude;
				mapCenter.longitude = longitude;
				scale.value = scaleLevel;
			},
			complete: () => {
				setTimeout(() => {
					isProgrammaticMove.value = false;
				}, 500);
			}
		});
	} else {
		// 降级方案
		mapCenter.latitude = latitude;
		mapCenter.longitude = longitude;
		scale.value = scaleLevel;
		setTimeout(() => {
			isProgrammaticMove.value = false;
		}, 500);
	}
};

// 地图标记点击事件
const onMarkerTap = (e) => {
	const markerId = e.detail.markerId;
	const merchant = nearbyMerchants.value.find(m => m.merchant_id === markerId);
	if (merchant) {
		selectedMerchant.value = merchant;
	}
};

// 地图区域变化事件
const onRegionChange = (e) => {
	// 如果是程序触发的移动，忽略regionchange事件
	if (isProgrammaticMove.value) {
		return;
	}
	
	if (e.type === 'end' && !isRegionChanging.value) {
		// 只有用户手动拖动结束时才处理
		isRegionChanging.value = true;
		
		// 可以在这里处理地图区域变化时的逻辑
		console.log('用户手动移动地图:', e);
		
		// 重置标志位
		setTimeout(() => {
			isRegionChanging.value = false;
		}, 100);
	}
};

// 放大地图
const zoomIn = () => {
	if (scale.value < 20) {
		scale.value += 1;
	}
};

// 缩小地图
const zoomOut = () => {
	if (scale.value > 3) {
		scale.value -= 1;
	}
};

// 定位到当前位置
const locateMe = () => {
	// 先检查定位权限
	checkLocationPermission().then(hasPermission => {
		if (hasPermission) {
			performLocation();
		} else {
			// 如果没有权限，引导用户授权
			showLocationPermissionGuide();
		}
	}).catch(err => {
		console.error('检查定位权限失败:', err);
		uni.showToast({
			title: '定位服务不可用',
			icon: 'none'
		});
	});
};

// 检查定位权限
const checkLocationPermission = () => {
	return new Promise((resolve, reject) => {
		// 在uniapp中可以使用以下方式检查权限
		if (uni.authorize) {
			uni.authorize({
				scope: 'scope.userLocation',
				success: () => {
					resolve(true);
				},
				fail: () => {
					resolve(false);
				}
			});
		} else {
			// 兼容处理
			uni.getSetting({
				success: (res) => {
					if (res.authSetting['scope.userLocation']) {
						resolve(true);
					} else {
						resolve(false);
					}
				},
				fail: reject
			});
		}
	});
};

// 执行定位操作
const performLocation = () => {
	isProgrammaticMove.value = true;
	loading.value = true;
	
	uni.getLocation({
		type: 'gcj02',
		success: (res) => {
			moveToLocation(res.latitude, res.longitude, 16);
			loading.value = false;
		},
		fail: (err) => {
			console.error('获取位置失败:', err);
			let errorMsg = '定位失败';
			
			switch (err.errMsg) {
				case 'getLocation:fail auth deny':
					errorMsg = '定位权限被拒绝';
					break;
				case 'getLocation:fail system permission denied':
					errorMsg = '系统定位权限未开启';
					break;
				case 'getLocation:fail':
					errorMsg = '定位服务不可用';
					break;
			}
			
			uni.showToast({
				title: errorMsg,
				icon: 'none',
				duration: 3000
			});
			
			isProgrammaticMove.value = false;
			loading.value = false;
		}
	});
};

// 显示定位权限引导
const showLocationPermissionGuide = () => {
	showPermissionGuide.value = true;
};

// 关闭权限引导
const closePermissionGuide = () => {
	showPermissionGuide.value = false;
};

// 打开设置页面
const openSetting = () => {
	closePermissionGuide();
	openSettingPage();
};

// 打开设置页面
const openSettingPage = () => {
	if (uni.openSetting) {
		uni.openSetting({
			success: (res) => {
				if (res.authSetting['scope.userLocation']) {
					// 用户授权成功，重新尝试定位
					performLocation();
				}
			}
		});
	} else {
		// 兼容处理，直接跳转到设置
		uni.navigateTo({
			url: '/pages/settings/settings'
		});
	}
};

// 处理搜索输入
const handleSearchInput = () => {
	if (searchKeyword.value.trim()) {
		showSearchResults.value = true;
		handleSearch();
	} else {
		showSearchResults.value = false;
		searchResults.value = [];
	}
};

// 处理搜索
const handleSearch = () => {
	if (!searchKeyword.value.trim()) {
		searchResults.value = [];
		showSearchResults.value = false;
		return;
	}
	
	// 从商家数据中搜索
	const results = nearbyMerchants.value
		.filter(merchant => 
			merchant.name.includes(searchKeyword.value) || 
			merchant.building_name.includes(searchKeyword.value) ||
			merchant.subcategory.includes(searchKeyword.value)
		)
		.map(merchant => ({
			id: merchant.merchant_id,
			name: merchant.name,
			type: '商家',
			latitude: merchant.latitude,
			longitude: merchant.longitude
		}));
	
	// 添加建筑物搜索结果
	const buildingResults = Object.keys(buildingCoords)
		.filter(building => building.includes(searchKeyword.value))
		.map(building => ({
			id: `building_${building}`,
			name: building,
			type: '建筑物',
			latitude: buildingCoords[building].latitude,
			longitude: buildingCoords[building].longitude
		}));
	
	searchResults.value = [...results, ...buildingResults];
	showSearchResults.value = true;
};

// 清空搜索
const clearSearch = () => {
	searchKeyword.value = '';
	searchResults.value = [];
	showSearchResults.value = false;
};

// 选择搜索结果
const selectSearchResult = (item) => {
	moveToLocation(item.latitude, item.longitude, 18);
	searchKeyword.value = '';
	searchResults.value = [];
	showSearchResults.value = false;
};

// 切换底部商家列表显示
const toggleBottomSheet = () => {
	showBottomSheet.value = !showBottomSheet.value;
};

// 聚焦到商家位置
const focusOnMerchant = (merchant) => {
	moveToLocation(merchant.latitude, merchant.longitude, 18);
	selectedMerchant.value = merchant;
};

// 导航到商家
const navigateToMerchant = (merchant) => {
	// 这里可以调用导航API
	uni.showToast({
		title: `开始导航到${merchant.name}`,
		icon: 'none'
	});
	
	// 模拟路径规划
	polyline.value = [{
		points: [
			{ latitude: mapCenter.latitude, longitude: mapCenter.longitude },
			{ latitude: merchant.latitude, longitude: merchant.longitude }
		],
		color: '#007AFF',
		width: 6,
		dottedLine: false
	}];
};

// 关闭商家详情弹窗
const closeMerchantModal = () => {
	selectedMerchant.value = null;
};

// 跳转到商家详情页面
const goToMerchantDetail = (merchant) => {
	closeMerchantModal();
	uni.navigateTo({
		url: `/pages/shop-detail/shop-detail?merchant_id=${merchant.merchant_id}`
	});
};
</script>

<style lang="scss" scoped>
/* 样式部分保持不变，与之前相同 */
.map-container {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background-color: #f5f5f5;
	position: relative;
	overflow: hidden;
}

.navbar {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 35px 16px;
	background-color: #fff;
	border-bottom: 1px solid #eee;
	position: relative;
	z-index: 10;

	.nav-title {
		font-size: 18px;
		font-weight: 500;
		color: #333;
		font-weight: bold;
	}
}

.map-wrapper {
	flex: 1;
	position: relative;
	overflow: hidden;
	
	.map {
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
	}
}

/* 地图控制按钮 */
.map-controls {
	position: absolute;
	right: 16px;
	top: 80px;
	display: flex;
	flex-direction: column;
	gap: 8px;
	z-index: 100;
	
	.control-btn {
		width: 44px;
		height: 44px;
		background: #fff;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		border: 1px solid #eee;
		
		.control-icon {
			font-size: 18px;
			color: #333;
		}
		
		&:active {
			background: #f0f0f0;
		}
	}
}

/* 搜索框 */
.search-bar {
	position: absolute;
	top: 16px;
	left: 16px;
	right: 16px;
	z-index: 100;
	
	.search-input-wrapper {
		display: flex;
		align-items: center;
		background: #fff;
		border-radius: 20px;
		padding: 8px 16px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		border: 1px solid #e0e0e0;
		
		.search-icon {
			margin-right: 8px;
			font-size: 16px;
			color: #999;
		}
		
		.search-input {
			flex: 1;
			font-size: 14px;
			height: 32px;
			color: #333;
		}
		
		.clear-icon {
			font-size: 20px;
			color: #999;
			padding: 4px;
			line-height: 1;
		}
		
		.placeholder {
			color: #999;
			font-size: 14px;
		}
	}
}

/* 搜索结果 */
.search-results {
	position: absolute;
	top: 70px;
	left: 16px;
	right: 16px;
	background: #fff;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	max-height: 200px;
	overflow: hidden;
	z-index: 100;
	border: 1px solid #e0e0e0;
	
	.results-list {
		max-height: 200px;
		
		.result-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 12px 16px;
			border-bottom: 1px solid #f0f0f0;
			
			&:last-child {
				border-bottom: none;
			}
			
			.result-name {
				font-size: 14px;
				color: #333;
				font-weight: 500;
			}
			
			.result-type {
				font-size: 12px;
				color: #999;
				background: #f5f5f5;
				padding: 2px 6px;
				border-radius: 4px;
			}
			
			&:active {
				background: #f8f8f8;
			}
		}
	}
}

/* 底部商家列表 */
.bottom-sheet {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background: #fff;
	border-radius: 16px 16px 0 0;
	box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
	z-index: 90;
	transition: transform 0.3s ease;
	
	&.sheet-collapsed {
		transform: translateY(calc(100% - 60px));
	}
	
	.sheet-header {
		padding: 16px;
		border-bottom: 1px solid #f0f0f0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #fff;
		border-radius: 16px 16px 0 0;
		
		.drag-handle {
			width: 40px;
			height: 4px;
			background: #e0e0e0;
			border-radius: 2px;
		}
		
		.sheet-title {
			font-size: 16px;
			font-weight: 500;
			color: #333;
			flex: 1;
			text-align: center;
		}
		
		.sheet-toggle {
			font-size: 14px;
			color: #007AFF;
		}
	}
	
	.merchant-list {
		height: 300px;
		padding: 0 16px;
		
		.merchant-item {
			display: flex;
			padding: 12px 0;
			border-bottom: 1px solid #f0f0f0;
			
			&:last-child {
				border-bottom: none;
			}
			
			.merchant-image {
				width: 60px;
				height: 60px;
				border-radius: 8px;
				margin-right: 12px;
				background-color: #f0f0f0;
			}
			
			.merchant-info {
				flex: 1;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
				
				.merchant-name {
					font-size: 14px;
					font-weight: 500;
					color: #333;
				}
				
				.merchant-category {
					font-size: 12px;
					color: #666;
				}
				
				.merchant-building {
					font-size: 12px;
					color: #999;
				}
				
				.merchant-tags {
					display: flex;
					gap: 4px;
					margin-top: 4px;
					
					.tag {
						font-size: 10px;
						padding: 2px 6px;
						border-radius: 4px;
						
						&.groupbuy {
							background: #ffeaea;
							color: #e64340;
						}
						
						&.date {
							background: #e6f7ff;
							color: #1890ff;
						}
						
						&.running {
							background: #f6ffed;
							color: #52c41a;
						}
					}
				}
			}
			
			.merchant-distance {
				display: flex;
				flex-direction: column;
				align-items: flex-end;
				justify-content: space-between;
				
				.distance {
					font-size: 12px;
					color: #666;
				}
				
				.navigate-btn {
					font-size: 12px;
					color: #007AFF;
					padding: 4px 8px;
					background: #f0f7ff;
					border-radius: 4px;
				}
			}
			
			&:active {
				background: #f8f8f8;
			}
		}
		
		.empty-state {
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100px;
			
			.empty-text {
				font-size: 14px;
				color: #999;
			}
		}
	}
}

/* 商家详情弹窗 */
.merchant-modal {
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
	padding: 16px;
	
	.modal-content {
		background: #fff;
		border-radius: 12px;
		width: 100%;
		max-width: 400px;
		overflow: hidden;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
		
		.modal-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 16px;
			border-bottom: 1px solid #f0f0f0;
			
			.modal-title {
				font-size: 16px;
				font-weight: 500;
				color: #333;
			}
			
			.modal-close {
				font-size: 20px;
				color: #999;
				padding: 4px;
			}
		}
		
		.modal-body {
			padding: 16px;
			
			.modal-image {
				width: 100%;
				height: 150px;
				border-radius: 8px;
				margin-bottom: 16px;
				background-color: #f0f0f0;
			}
			
			.merchant-details {
				margin-bottom: 16px;
				
				.detail-item {
					display: flex;
					justify-content: space-between;
					padding: 8px 0;
					border-bottom: 1px solid #f5f5f5;
					
					&:last-child {
						border-bottom: none;
					}
					
					.label {
						font-size: 14px;
						color: #666;
					}
					
					.value {
						font-size: 14px;
						color: #333;
						font-weight: 500;
					}
				}
			}
			
			.action-buttons {
				display: flex;
				gap: 12px;
				
				.btn {
					flex: 1;
					height: 44px;
					border: none;
					border-radius: 8px;
					font-size: 14px;
					font-weight: 500;
					
					&.secondary {
						background: #f5f5f5;
						color: #333;
					}
					
					&.primary {
						background: #007AFF;
						color: #fff;
					}
					
					&:active {
						opacity: 0.8;
					}
				}
			}
		}
	}
}

/* 权限引导弹窗 */
.permission-guide-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 2000;
	padding: 16px;
	
	.permission-content {
		background: #fff;
		border-radius: 12px;
		width: 100%;
		max-width: 400px;
		overflow: hidden;
		
		.permission-header {
			padding: 20px 16px 0;
			text-align: center;
			
			.permission-title {
				font-size: 18px;
				font-weight: 500;
				color: #333;
			}
		}
		
		.permission-body {
			padding: 16px;
			
			.permission-desc {
				font-size: 14px;
				color: #666;
				line-height: 1.5;
				text-align: center;
				margin-bottom: 20px;
			}
			
			.permission-steps {
				.step-item {
					display: flex;
					align-items: center;
					margin-bottom: 12px;
					
					.step-number {
						width: 24px;
						height: 24px;
						background: #007AFF;
						color: #fff;
						border-radius: 50%;
						display: flex;
						align-items: center;
						justify-content: center;
						font-size: 12px;
						margin-right: 12px;
					}
					
					.step-text {
						font-size: 14px;
						color: #333;
					}
				}
			}
		}
		
		.permission-actions {
			display: flex;
			gap: 12px;
			padding: 16px;
			border-top: 1px solid #f0f0f0;
			
			.btn {
				flex: 1;
				height: 44px;
				border: none;
				border-radius: 8px;
				font-size: 14px;
				font-weight: 500;
				
				&.secondary {
					background: #f5f5f5;
					color: #333;
				}
				
				&.primary {
					background: #007AFF;
					color: #fff;
				}
			}
		}
	}
}

/* 加载状态 */
.loading-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(255, 255, 255, 0.8);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	z-index: 2000;
	
	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #f3f3f3;
		border-top: 3px solid #007AFF;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 16px;
	}
	
	.loading-text {
		font-size: 14px;
		color: #666;
	}
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}
</style>