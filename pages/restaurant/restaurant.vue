<template>
    <view class="merchant">
        <!-- 商家基本信息 -->
        <view class="name">{{ merchant.name }}</view>
        <view class="first-container">
            <view class="score">评分: {{ merchant.average_rating }}</view>
            <view class="sum">{{ merchant.dpnum }}条</view>
            <view class="money_one_people">{{ merchant.per_cap_consumption }}/人</view>
        </view>
        <view class="second-container">
            <view class="block2">口味：{{ merchant.taste_rating }}</view>
            <view class="block2">环境：{{ merchant.environ_rating }}</view>
            <view class="block2">服务：{{ merchant.service_rating }}</view>
            <view class="block2">食材：{{ merchant.ingredients_rating }}</view>
        </view>
        <view class="three-container">
            <view class="block1">营业中</view>
            <view class="block1">{{ merchant.business_hours ? merchant.business_hours.from + '-' + merchant.business_hours.to : '暂无营业时间信息' }}</view>
            <view class="block1">{{ merchant.has_box ? '有包厢' : '无包厢' }}</view>
            <view class="block1">{{ merchant.subcategory }}</view>
            <view class="block1">{{ merchant.building_name }}</view>
        </view>

        <!-- 选项卡 -->
        <view class="tab-container">
            <view 
                class="tab-item {{currentTab === 0 ? 'active' : ''}}" 
                @click="currentTab = 0; getTabData(1)"
            >邀约</view>
            <view 
                class="tab-item {{currentTab === 1 ? 'active' : ''}}" 
                @click="currentTab = 1; getTabData(2)"
            >团购</view>
            <view 
                class="tab-item {{currentTab === 2 ? 'active' : ''}}" 
                @click="currentTab = 2; getTabData(3)"
            >跑腿</view>
            <view 
                class="tab-item {{currentTab === 3 ? 'active' : ''}}" 
                @click="currentTab = 3; getTabData(4)"
            >菜品</view>
            <view 
                class="tab-item {{currentTab === 4 ? 'active' : ''}}" 
                @click="currentTab = 4; getTabData(5)"
            >评价</view>
        </view>

        <!-- 选项卡内容 -->
        <!-- 邀约 -->
        <view v-if="currentTab === 0" class="tab-content">
            <view class="investion_list">
                <navigator 
                    :url="'/pages/investion/investion?date_id=' + item.date_id" 
                    class="investion-item" 
                    v-for="item in tabData" 
                    :key="item.date_id"
                >
                    <image :src="baseImgUrl + item.img" mode="aspectFill"></image>
                    <view class="investion-details">
                        <view class="investion-title">{{ item.title }}</view>
                        <view class="investion-time">时间：{{ item.time }}</view>
                        <view class="investion-deadline">报名截止：{{ item.deadline }}</view>
                        <view class="investion-attendance">
                            最多：{{ item.maxpersons }} 报名：{{ item.signups }} 确认：{{ item.confirms }}
                        </view>
                        <view class="investion-order">
                            <view class="order-left">点单</view>
                            <view class="order-right">人均预算：{{ item.av_fee }}元</view>
                        </view>
                    </view>
                </navigator>
            </view>
        </view>

        <!-- 团购 -->
        <view v-if="currentTab === 1" class="tab-content">
            <view class="investion_list">
                <navigator 
                    :url="`/pages/buy/buy?groupbuy_id=${item.groupbuy_id}`" 
                    class="investion-item" 
                    v-for="item in tabData" 
                    :key="item.groupbuy_id"
                >
                    <image :src="baseImgUrl + item.img" mode="aspectFill"></image>
                    <view class="investion-details">
                        <view class="investion-title">{{ item.title }}</view>
                        <view class="investion-attendance">已售：{{ item.sold_totalnum }}</view>
                        <view class="investion-attendance">
                            当前价：{{ item.price }}元 差{{ item.num_in_short }}件{{ item.next_price }}元
                        </view>
                    </view>
                </navigator>
            </view>
        </view>

        <!-- 跑腿 -->
        <view v-if="currentTab === 2" class="tab-content">
            <view class="investion_list">
                <!-- 修复：确保传递正确的 running_id 和 merchant_id -->
                <navigator 
                    :url="`/pages/runner/runner?running_id=${item.running_id}&merchant_id=${merchantId}`" 
                    class="investion-item" 
                    v-for="item in tabData" 
                    :key="item.running_id"
                >
                    <image :src="baseImgUrl + item.img" mode="aspectFill"></image>
                    <view class="investion-details">
                        <view class="investion-title">{{ item.title }}</view>
                        <view class="investion-attendance">已售：{{ item.sold_num }}</view>
                        <view class="investion-attendance">
                            当前价：{{ item.price }}元 差{{ item.num_in_short }}件{{ item.next_price }}元
                        </view>
                    </view>
                </navigator>
            </view>
        </view>

        <!-- 菜品 -->
        <view v-if="currentTab === 3" class="tab-content">
            <view class="investion_list">
                <navigator 
                    :url="'/pages/dish/dish?dish_id=' + item.dish_id" 
                    class="investion-item" 
                    v-for="item in tabData" 
                    :key="item.dish_id"
                >
                    <image :src="baseImgUrl + item.img" mode="aspectFill"></image>
                    <view class="investion-details">
                        <view class="investion-title">{{ item.title }}</view>
                        <view class="investion-attendance">价格：{{ item.price }}元</view>
                        <view class="investion-attendance">点赞：{{ item.dzs }}</view>
                    </view>
                </navigator>
            </view>
        </view>

        <!-- 评价 -->
        <view v-if="currentTab === 4" class="tab-content">
            <view class="review-list">
                <view class="review-item" v-for="(item, index) in tabData" :key="item.comment_id">
                    <view class="review-header">
                        <image :src="baseImgUrl + item.headimg" class="user-avatar"></image>
                        <view class="user-info">
                            <view class="review-user">{{ item.username }}</view>
                            <view class="review-rating">评分：{{ item.rating }}</view>
                        </view>
                    </view>
                    <view class="review-content">{{ item.content }}</view>
                    <view class="review-date">{{ item.date }}</view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { uniRequest } from '@/utils/request';

const currentTab = ref(0);
const merchant = ref({});
const tabData = ref([]);
const merchantId = ref(null); // 确保 merchantId 存在
const baseImgUrl = ref('');

const getBaseSetting = async () => {
    try {
        const res = await uniRequest({
            url: '/getBaseSetting',
            method: 'GET',
            data: { userid: uni.getStorageSync('userid') },
            header: { token: uni.getStorageSync('token') }
        });
        if (res.code === 0) baseImgUrl.value = res.data.baseImgUrl;
    } catch (error) {
        console.error('获取基础配置失败:', error);
    }
};

const getMerchantDetail = async () => {
    try {
        const response = await uniRequest({
            url: '/getShopDetail',
            method: 'GET',
            data: {
                userid: uni.getStorageSync('userid'),
                merchant_id: merchantId.value
            },
            header: { token: uni.getStorageSync('token') }
        });
        if (response.code === 0) merchant.value = response.data;
    } catch (error) {
        console.error('获取商家详情失败', error);
    }
};

const getTabData = async (type) => {
    try {
        const response = await uniRequest({
            url: '/getShopItemList',
            method: 'GET',
            data: {
                userid: uni.getStorageSync('userid'),
                merchant_id: merchantId.value,
                type: type,
                pageno: 1,
                pagesize: 20
            },
            header: { token: uni.getStorageSync('token') }
        });
        if (response.code === 0) tabData.value = response.data;
    } catch (error) {
        console.error('获取数据失败', error);
    }
};

onLoad((options) => {
    // 确保从页面参数获取 merchantId
    merchantId.value = options.merchantId;
    
    if (!merchantId.value) {
        uni.showToast({
            title: '缺少商家ID',
            icon: 'none'
        });
        uni.navigateBack();
        return;
    }
    
    getBaseSetting();
    getMerchantDetail();
    getTabData(1);
});
</script>

<style lang="scss" scoped>
.merchant {
    padding: 20rpx;
    .name {
        font-size: 40rpx;
        font-weight: bold;
        margin-bottom: 20rpx;
    }
    .first-container, .second-container, .three-container {
        display: flex;
        flex-wrap: wrap;
        gap: 20rpx;
        margin-bottom: 30rpx;
        .block1, .block2 {
            padding: 10rpx 20rpx;
            background: #f5f5f5;
            border-radius: 8rpx;
            font-size: 28rpx;
        }
    }

    .tab-container {
        display: flex;
        justify-content: space-around;
        margin: 30rpx 0;
        .tab-item {
            padding: 15rpx 30rpx;
            border-radius: 8rpx;
            background: #f5f5f5;
            &.active {
                background: #1aad19;
                color: white;
            }
        }
    }

    .investion_list {
        .investion-item {
            display: flex;
            margin-bottom: 30rpx;
            padding: 20rpx;
            background: white;
            border-radius: 12rpx;
            box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
            image {
                width: 200rpx;
                height: 200rpx;
                border-radius: 8rpx;
                margin-right: 20rpx;
            }
            .investion-details {
                flex: 1;
                .investion-title {
                    font-size: 32rpx;
                    font-weight: bold;
                    margin-bottom: 10rpx;
                }
                .investion-attendance {
                    font-size: 24rpx;
                    color: #666;
                    margin-bottom: 6rpx;
                }
                .investion-order {
                    display: flex;
                    justify-content: space-between;
                    font-size: 24rpx;
                    color: #f90;
                }
            }
        }
    }

    .review-list {
        .review-item {
            padding: 20rpx;
            background: white;
            border-radius: 12rpx;
            margin-bottom: 20rpx;
            .review-header {
                display: flex;
                align-items: center;
                margin-bottom: 15rpx;
                .user-avatar {
                    width: 80rpx;
                    height: 80rpx;
                    border-radius: 50%;
                    margin-right: 20rpx;
                }
                .user-info {
                    .review-user {
                        font-weight: bold;
                        margin-bottom: 6rpx;
                    }
                    .review-rating {
                        color: #f90;
                        font-size: 24rpx;
                    }
                }
            }
            .review-content {
                color: #333;
                margin-bottom: 10rpx;
            }
            .review-date {
                color: #999;
                font-size: 24rpx;
            }
        }
    }
}
</style>