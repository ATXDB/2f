<script setup>
import { ref, computed, watch } from 'vue'
import TodoItem from './TodoItem.vue'
import TodoForm from './TodoForm.vue'
import Modal from './Modal.vue'
import { getTOTP,addTotp } from '../totp.js'
import QrScanner from 'qr-scanner'
import githubIcon from '../assets/github.svg'
import cnbIcon from '../assets/cnb.svg'

const todos = ref([])
const todo = ref({})
const showSecret = ref(false)

const showDeleteConfirm = ref(false)
const showClearConfirm = ref(false)
const tips = ref('')
    const copied = ref(false);

// 复制当前验证码到剪贴板
const copyCurrentCode = () => {
  if (totp.value && totp.value.currentCode) {
    navigator.clipboard.writeText(totp.value.currentCode)
      .then(() => {
        copied.value = true;
        setTimeout(() => {
          copied.value = false;
        }, 2000);

      })
      .catch(err => {
        tips.value = `复制失败: ${err}`
      })
  }
}

    const showQrScanner = ref(false)
    const videoElem = ref(null)
    const qrScanner = ref(null)
    const qrResult = ref('')

    // 打开二维码扫描器
    const openQrScanner = () => {
      showQrScanner.value = true
      setTimeout(async () => {
        if (videoElem.value) {
          qrScanner.value = new QrScanner(
            videoElem.value,
            result => {
              handleQrResult(result)
            },
            { returnDetailedScanResult: true }
          )
          try {
            await qrScanner.value.start()            
          }catch (error) {
            closeQrScanner()
            tips.value = '无法启动二维码扫描器'+ error
          }
        }
      }, 100)
    }
   
    // 关闭二维码扫描器
    const closeQrScanner = () => {
      if (qrScanner.value) {
        qrScanner.value.stop()
        qrScanner.value.destroy()
        qrScanner.value = null
      }
      showQrScanner.value = false
    }
    let qrResultTimeout = null
    // 处理二维码扫描结果
    const handleQrResult = (result) => {
      closeQrScanner()      
      try {
        qrResult.value=result.data
        addTodo(qrResult.value)
        clearTimeout(qrResultTimeout)
        qrResultTimeout=setTimeout(() => {
          qrResult.value = '';
        }, 10000);
      } catch (error) {
        tips.value = '无法解析二维码'+result.data
      }
    }
    

const selectedCount = computed(() => {
  return todos.value.filter(todo => todo.completed).length
})

const showTOTP = ref(false)
const totp = ref({})
let updateInterval = null
const renderAccounts =async () => {
  totp.value=await getTOTP(todo.value.secret)
}
const renderTOTP =async (todo_) => {
  if(!todo_){
    if(!showTOTP.value)return
    showTOTP.value = false
    clearInterval(updateInterval);  
  }else{
    if(showTOTP.value)return
    todo.value=todo_
    renderAccounts();
    showTOTP.value = true
    updateInterval = setInterval(() => {
          renderAccounts();
      }, 1000);
  }
}
const handleItemClose = () => {
  renderTOTP()
}
const toggleTodo = (id) => {
  const todo = todos.value.find(todo => todo.id === id)
  if (todo) {
    todo.completed = !todo.completed
  }
}
const addTodo =(text) => {
    try {
      const res=addTotp(text)
    todos.value.unshift(...res)
    if(res.length==1)renderTOTP(todos.value[0])
  } catch (err) {
    tips.value ='添加错误:'+ err
  }
}

const todos_file='todos_2fa_v1'
    // 监听 todos 的变化
    watch(todos, (newTodos) => {
      // 在这里执行保存操作，例如保存到本地存储
      localStorage.setItem(todos_file, JSON.stringify(newTodos));
    }, { deep: true });
    try {
      const val = JSON.parse(localStorage.getItem(todos_file));
      if(!Array.isArray(val))throw ''
      todos.value=val
    } catch (err) {
      addTodo('otpauth://totp/test?secret=JBSWY3DPEHPK3PXP&issuer=2f')
    }


const deleteSelected = () => {
  todos.value = todos.value.filter(todo => !todo.completed)
  showDeleteConfirm.value = false
}

const clearAllTodos = () => {
  todos.value = []
  showClearConfirm.value = false
}

const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    addTodo(text)
  } catch (err) {
    tips.value ='剪贴板访问错误:'+ err
  }
}

const exportTodos = () => {
  // 生成导出内容
  const content = todos.value.map(todo => todo.otpauth).join('\n')

  // 创建 Blob 对象
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  
  // 创建下载链接
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  
  // 设置文件名（使用当前日期时间）
  const date = new Date()
  const fileName = `totp_${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}.txt`
  link.download = fileName
  
  // 触发下载
  document.body.appendChild(link)
  link.click()
  
  // 清理
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}
</script>

<template>
  <div class="todo-container">
    <div class="header-container">
      <h1>2-Factor Authentication</h1>
      <a href="https://cnb.cool/atxdb/2f" target="_blank" rel="noopener noreferrer" class="cnb-link">
        <img :src="cnbIcon" alt="cnb" class="github-icon" />
      </a>
      <a href="https://github.com/atxdb/2f" target="_blank" rel="noopener noreferrer" class="github-link">
        <img :src="githubIcon" alt="GitHub" class="github-icon" />
      </a>
    </div>
    <TodoForm @add-todo="addTodo" />
    <div class="todo-actions">
      <div class="action-group">
        <button 
          class="paste-btn" 
          @click="pasteFromClipboard"
        >
          粘贴
        </button>
        <button  
          class="scan-btn"
          @click="openQrScanner"
        >
          扫码
        </button>
        <button 
          class="export-btn" 
          @click="exportTodos"
          :disabled="todos.length === 0"
        >
          导出
        </button>
      </div>
      <div v-if="todos.length > 0" class="action-group">
        <button 
          class="delete-selected-btn" 
          @click="showDeleteConfirm = true"
          :disabled="selectedCount === 0"
        >
          删除 ({{ selectedCount }})
        </button>
        <button 
          class="clear-all-btn" 
          @click="showClearConfirm = true"
        >
          清空
        </button>
      </div>
    </div>
        <div>{{qrResult}}</div>
  
    <Modal :show="showDeleteConfirm" @close="showDeleteConfirm = false">
      <div class="confirm-dialog">
        <p>确定删除选中的 {{ selectedCount }} 项?</p>
        <div class="confirm-actions">
          <button class="confirm-btn" @click="deleteSelected">是</button>
          <button class="cancel-btn" @click="showDeleteConfirm=false">不删除</button>
        </div>
      </div>
    </Modal>
    <Modal :show="showTOTP" @close="handleItemClose">
      <div class="todo-detail">
        <h3>二次验证码</h3>
        <div class="totp-codes">
          <div class="code-block previous">
            <span class="code-label">上个验证码</span>
            <span class="code">{{ totp.previousCode }}</span>
          </div>
          <div class="code-block current">
            <span class="countdown">剩 {{ totp.countdown }} 秒</span>
            <div class="code-with-copy">
              <span class="code">{{ totp.currentCode }}</span>
            </div>
              <button class="copy-btn" @click="copyCurrentCode" :class="{ 'copied': copied }">
                <span v-if="!copied">复制</span>
                <span v-else>已复制</span>
              </button>
          </div>
          <div class="code-block next">
            <span class="code-label">下个验证码</span>
            <span class="code">{{ totp.nextCode }}</span>
          </div>
        </div>
        <div class="account-info">
          <div class="info-row">
            <strong>账户</strong>
            <input type="text" v-model="todo.account" class="editable-input" />
          </div>
          <div class="info-row">
            <strong>服务</strong>
            <input type="text" v-model="todo.issuer" class="editable-input" />
          </div>
          <div class="info-row">
            <strong>创建</strong>
            <span>{{  new Date(todo.id).toLocaleString()}}</span>
          </div>
          <div class="info-row">
            <strong>密钥</strong>
            <div class="secret-field">
              <input 
                :type="showSecret ? 'text' : 'password'" 
                v-model="todo.secret" 
                readonly
                @focus="showSecret=true" @blur="showSecret=false"
                class="secret-input"
              />
            </div>
          </div>
          <div class="info-row">
            <strong>协议</strong>
            <div class="secret-field">
              <input 
                :type="showSecret ? 'text' : 'password'" 
                v-model="todo.otpauth" 
                readonly
                @focus="showSecret=true" @blur="showSecret=false"
                class="secret-input"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>    
    <Modal :show="showClearConfirm" @close="showClearConfirm = false">
      <div class="confirm-dialog">
        <p>确定清空所有密钥不可恢复?</p>
        <div class="confirm-actions">
          <button class="confirm-btn" @click="clearAllTodos">是</button>
          <button class="cancel-btn" @click="showClearConfirm=false">不清空</button>
        </div>
      </div>
    </Modal>
    <Modal :show="!!tips" @close="tips = ''">
      <div class="confirm-dialog">
        <p>{{tips}}</p>
        <div class="confirm-actions">
          <button class="cancel-btn" @click="tips=''">关闭</button>
        </div>
      </div>
    </Modal> 

     <!-- QR扫描模态框 -->
     <Modal :show="showQrScanner" @close="closeQrScanner">
              <video ref="videoElem" class="qr-video"></video>
              <div class="scanner-overlay">
                <div class="scanner-frame"></div>
              </div>
        </Modal> 


    <ul class="todo-list">
      <TodoItem
        v-for="todo in todos"
        :key="todo.id"
        :todo="todo"
        @show-totp="renderTOTP"
      />
    </ul>
  </div>
        <footer class="app-footer">
        <p>安全的本地验证码生成器 | 数据仅存储在您的设备上</p>
      </footer>
</template>

<style scoped>
.todo-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
}

h1 {
  text-align: center;
  margin-bottom: 0;
  color: #333;
  flex-grow: 1;
}

.github-link {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}
.cnb-link {
  position: absolute;
  right: 36px;
  top: 50%;
  transform: translateY(-50%);
}
.github-icon {
  width: 24px;
  height: 24px;
  transition: opacity 0.3s ease;
}

.github-icon:hover {
  opacity: 0.7;
}
.app-footer {
  background-color: var(--footer-bg);
  padding: 1rem;
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-color);
  opacity: 0.8;
}
.todo-actions {
  display: flex;
  justify-content: flex-end;
  margin: 15px 0;
}

.delete-selected-btn, .clear-all-btn, .paste-btn, .export-btn, .scan-btn {
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 2px;
}

.paste-btn {
  background-color: #1890ff;
}

.scan-btn {
  background-color: #722ed1;
}

.scan-btn:hover {
  background-color: #531dab;
}

.export-btn {
  background-color: #52c41a;
}

.delete-selected-btn {
  background-color: #ff4444;
}

.clear-all-btn {
  background-color: #ff7875;
}

.paste-btn:hover {
  background-color: #40a9ff;
}

.export-btn:hover {
  background-color: #73d13d;
}

.delete-selected-btn:hover {
  background-color: #cc0000;
}

.clear-all-btn:hover {
  background-color: #ff5252;
}

.delete-selected-btn:disabled, .clear-all-btn:disabled, .export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.todo-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.action-group {
  display: flex;
  gap: 8px;
}

.confirm-dialog {
  padding: 20px;
  text-align: center;
}

.confirm-dialog p {
  margin-bottom: 15px;
  font-size: 16px;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.confirm-btn {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn:hover {
  background-color: #369f6e;
}

.cancel-btn {
  background-color: #666;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn:hover {
  background-color: #555;
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 20px 0 0;
}

/* 验证码布局样式 */
.totp-codes {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.code-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  width: 30%;
  text-align: center;
  transition: all 0.3s ease;
}

.code-label {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 5px;
}

.code-with-copy {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 5px 0;
}

.code {
  font-size: 1.2rem;
  font-weight: bold;
  letter-spacing: 1px;
  user-select: all;
}

.copy-btn {
  padding: 4px 12px;
  background-color: #18df38;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
}

.copy-btn:hover {
  background-color:rgb(16, 214, 49);
}

.copy-btn:active {
  background-color:rgb(9, 197, 41);
}

.copy-btn.copied {
  background-color: #10b981;
}

/* 当前验证码突出显示 */
.code-block.current {
  background-color: #e3f2fd;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2);
  transform: scale(1.1);
}

.code-block.current .code {
  font-size: 1.8rem;
  color: #18df38;
}

.countdown {
  margin-top: 5px;
  font-size: 1.1rem;
  color: #f44336;
  font-weight: bold;
}

/* 上一个和下一个验证码样式 */
.code-block.next {
  background-color: #f5f5f5;
  color: #007bff;
  opacity: 0.8;
}
.code-block.previous {
  background-color: #f5f5f5;
  color: #666;
  opacity: 0.8;
}

/* 账户信息样式 */
.account-info {
  margin-top: 20px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.info-row strong {
  display: inline-block;
  width: 40px;
  margin-right: 10px;
}

.editable-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.editable-input:focus {
  border-color: #2196f3;
  outline: none;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

/* 密钥字段样式 */
.secret-field {
  display: flex;
  flex: 1;
}

.secret-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 14px;
  font-family: monospace;
}

.qr-text {
  font-size: 12px;
  color: #666;
  word-break: break-all;
}

/* QR扫描样式 */
.qr-video {
  width: 100%;
  height: 300px;
  background-color: #000;
  border-radius: 12px;
  object-fit: cover;
}

.scanner-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  pointer-events: none;
}

.scanner-frame {
  width: 100%;
  height: 100%;
  border: 2px solid var(--accent-color);
  border-radius: 16px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
}

</style>