<script setup>
import { ref } from 'vue'
import Modal from './Modal.vue'
import { showTotp } from '../totp.js'

const props = defineProps({
  todo: {
    type: Object,
    required: true
  }
})
const emit = defineEmits(['show-totp'])


const handleItemClick = (event) => {
  // 如果点击的是checkbox、按钮或确认对话框，不显示弹窗
  if (event.target.type === 'checkbox') {
    return
  }
  emit('show-totp', props.todo)
}


const handleCheckboxChange = () => {
  props.todo.completed = !props.todo.completed
}
</script>

<template>
  <li class="todo-item" @click="handleItemClick">
    <div class="todo-checkboxes">
      <input
        type="checkbox"
        class="complete-checkbox"
        :checked="todo.completed"
        @change="handleCheckboxChange"
      />
    </div>
    <span :class="{ completed: todo.completed }">{{ showTotp(props.todo) }}</span>
  </li>
</template>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.todo-item:last-child {
  border-bottom: none;
}
.todo-input {
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 16px;
}
.todo-checkboxes {
  display: flex;
  align-items: center;
  margin-right: 5px;
}

.complete-checkbox {
  margin-right: 10px;
  cursor: pointer;
}

span {
  flex-grow: 1;
  margin-right: 10px;
}

.completed {
  text-decoration: line-through;
  color: #888;
}

/* 弹出框内容样式 */
.todo-detail {
  min-width: 250px;
}

.todo-detail h3 {
  margin-top: 0;
  color: #42b983;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.todo-detail p {
  margin: 8px 0;
  line-height: 1.5;
}
</style>