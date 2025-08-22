/*
 * ===== Todo App - 主載入檔案 =====
 *
 * 這個檔案負責按正確順序載入所有 JavaScript 模組
 * 確保依賴關係正確建立
 *
 * 載入順序很重要：
 * 1. 配置和常數
 * 2. 工具函數
 * 3. API 模組
 * 4. UI 組件模組
 * 5. 主應用程式
 */

console.log("===== Todo App Starting =====");
console.log("Loading main.js @", new Date().toISOString());

// 檢查必要的全域變數是否存在
function checkDependencies() {
    const requiredGlobals = [
        'DEVELOPER_MODE',
        'API_CONFIG',
        'PRIORITY_CONFIG',
        'DATE_CONFIG',
        'SELECTORS',
        'Utils',
        'API',
        'TaskRenderer',
        'TaskForm',
        'TaskModal',
        'DescriptionEditor',
        'CommentEditor',
        'TodoApp'
    ];

    const missing = requiredGlobals.filter(name => typeof window[name] === 'undefined');

    if (missing.length > 0) {
        console.error('❌ 缺少必要的模組:', missing);
        return false;
    }

    console.log('✅ 所有必要模組已載入');
    return true;
}

// 應用程式啟動檢查
function startupCheck() {
    console.log('🚀 進行啟動檢查...');

    // 檢查瀏覽器支援
    if (!window.fetch) {
        console.error('❌ 瀏覽器不支援 fetch API');
        alert('您的瀏覽器版本過舊，請升級瀏覽器');
        return false;
    }

    if (!window.localStorage) {
        console.warn('⚠️ 瀏覽器不支援 localStorage');
    }

    // 檢查 DOM 是否準備就緒
    if (document.readyState === 'loading') {
        console.log('📄 DOM 正在載入中...');
        return false;
    }

    // 檢查必要的 DOM 元素
    const requiredElements = [
        'overdueTasks',
        'todayTasks',
        'completedThisMonthTasks',
        'taskCount',
        'addTaskBtn',
        'addTaskForm'
    ];

    const missingElements = requiredElements.filter(id => !document.getElementById(id));

    if (missingElements.length > 0) {
        console.error('❌ 缺少必要的 DOM 元素:', missingElements);
        return false;
    }

    console.log('✅ 啟動檢查通過');
    return true;
}

// 顯示載入狀態
function showLoadingState(show = true) {
    const taskCount = document.getElementById('taskCount');
    if (taskCount) {
        taskCount.textContent = show ? 'Loading...' : '0 tasks';
    }
}

// 顯示錯誤狀態
function showErrorState(error) {
    console.error('💥 應用程式啟動失敗:', error);

    const container = document.querySelector('.container');
    if (container) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            background: #ffebee;
            border: 1px solid #f44336;
            color: #c62828;
            padding: 20px;
            border-radius: 4px;
            margin: 20px 0;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <h3>⚠️ 應用程式啟動失敗</h3>
            <p>請重新整理頁面或聯絡技術支援</p>
            <small>錯誤信息: ${error.message}</small>
        `;
        container.insertBefore(errorDiv, container.firstChild);
    }
}

// 主要啟動函數
async function bootstrap() {
    try {
        console.log('🔧 開始啟動 Todo App...');

        // 顯示載入狀態
        showLoadingState(true);

        // 檢查依賴
        if (!checkDependencies()) {
            throw new Error('模組依賴檢查失敗');
        }

        // 啟動檢查
        if (!startupCheck()) {
            throw new Error('啟動環境檢查失敗');
        }

        // 初始化應用程式
        console.log('🎯 初始化 TodoApp...');
        await TodoApp.init();

        // 隱藏載入狀態
        showLoadingState(false);

        console.log('🎉 Todo App 啟動成功!');

        // 開發者模式提示
        if (DEVELOPER_MODE) {
            console.log('🛠️ 開發者模式已啟用');
            console.log('可用的開發者指令:');
            console.log('- TodoApp.getAppStats() // 獲取應用統計');
            console.log('- TodoApp.exportTasks() // 匯出任務');
            console.log('- TodoDevMode.clearCompletedTasks() // 清除已完成任務');
            console.log('- TodoDevMode.createTestTasks() // 創建測試任務');
        }

    } catch (error) {
        showErrorState(error);
        throw error;
    }
}

// 等待 DOM 載入完成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    // DOM 已經載入完成，直接啟動
    bootstrap();
}

// 錯誤處理
window.addEventListener('error', (event) => {
    console.error('💥 全域錯誤:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('💥 未處理的 Promise 拒絕:', event.reason);
});

// 暴露一些有用的全域函數供除錯使用
if (DEVELOPER_MODE) {
    window.TodoAppDebug = {
        checkDependencies,
        startupCheck,
        bootstrap,
        showLoadingState,
        showErrorState
    };
}

console.log("main.js loaded successfully");