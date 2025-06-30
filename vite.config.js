import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  server: { allowedHosts:true },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        // 删除 console
        drop_console: true,
        // 删除 debugger
        drop_debugger: true,
        // 兼容低版本浏览器
        ecma: 5
      },
      format: {
        // 删除注释
        comments: false,
        // 兼容低版本浏览器
        ecma: 5
      },
      ecma: 5, // 支持 ES5
      safari10: true, // 支持 Safari 10
      ie8: false, // 不支持 IE8
      keep_classnames: false,
      keep_fnames: false
    },
    target: 'es2015' // 设置构建目标为 ES2015，兼容 Chrome 49+
  }
})