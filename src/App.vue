<script setup>
import TodoList from './components/TodoList.vue'
</script>

<template>
  <div class="app">
    <TodoList />
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, 
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.5;
  background-color: #f5f5f5;
  color: #333;
  padding: 0px;
}

.app {
  max-width: 800px;
  margin: 0 auto;
}
</style>