<script setup>
import { ref } from 'vue'

const text = ref('')
const emit = defineEmits(['add-todo'])

const handleSubmit = () => {
  if (text.value.trim()) {
    emit('add-todo', text.value.trim())
    text.value = ''
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="todo-form">
    <input
      type="text"
      v-model="text"
      placeholder="secret or otpauth://totp/test?secret="
      class="todo-input"
    />
    <button type="submit" class="add-button">添加</button>
  </form>
</template>

<style scoped>
.todo-form {
  display: flex;
  margin-bottom: 20px;
}

.todo-input {
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 16px;
}

.add-button {
  padding: 10px 15px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  font-size: 16px;
}

.add-button:hover {
  background-color: #369f6e;
}
</style>