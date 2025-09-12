<template>

  <el-dialog
      v-model="visible"
      title="设置"
      width="1300px"
      center
  >

    <div class="theme-item">

      <div v-for="(item, index) in themeItem">
        <img :src="item.img" alt="">
        <div class="title">{{item.title}}</div>
      </div>

    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" size="large">取消</el-button>
      </div>
    </template>

  </el-dialog>
</template>
<script setup>
import {ElDialog} from "element-plus";
import {computed} from "vue";
const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})


const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const handleCancel = () => {
  visible.value = false
}

const themeItem = [
  {
    title: "AI老头",
    img: "/images/background22.jpg"
  },
  {
    title: "争鲜经典",
    img: "/images/background1.jpg"
  },
  {
    title: "蜡笔小新",
    img: "/images/background2.jpg"
  },
]

</script>

<style lang="scss">
.theme-item {
  display: flex;
  gap: 30px;
  align-content: center;
  flex-flow: wrap;
  img {
    width: 200px;
    height: 140px;
  }
  .title{
    text-align: center;
    font-size: 18px;
  }
}
</style>
