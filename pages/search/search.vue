<template>
  <view class="search-container">
    <!-- 搜索框 -->
    <view class="search-box">
      <input 
        type="text" 
        v-model="searchKeyword" 
        placeholder="搜索美食或餐厅" 
        @input="handleSearch"
        @keydown.enter="handleSearch"
      >
      <button @click="handleSearch">搜索</button>
    </view>

  </view>
</template>

<script setup>
import { ref } from 'vue';



// 处理搜索事件
const handleSearch = () => {
  if (searchKeyword.value) {
    // 简单模拟搜索过滤
    searchResults.value = mockData.filter(item =>
      item.title.includes(searchKeyword.value) || item.description.includes(searchKeyword.value)
    );
  } else {
    searchResults.value = [];
  }
};
</script>

<style lang="scss" scoped>


.search-container {
  padding: 30rpx;

  .search-box {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;
	

    input {
      flex: 1;
      padding: 20rpx;
      border: 1px solid $uni-border-color;
      margin-right: 10rpx;
	  border-radius: 50px;
    }

    button {
      height: 100rpx;
      background-color: springgreen;
      color: white;
      border: 1px solid;
	  border-radius: 50px;
    }
  }

 

}
</style>    