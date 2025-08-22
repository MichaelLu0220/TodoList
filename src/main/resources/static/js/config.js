// ===== 配置和常數 =====
console.log("Loaded config.js @", new Date().toISOString());

// 🛠️ 開發者模式開關 - 設為 false 即可關閉所有開發者功能
const DEVELOPER_MODE = true;

// API 配置
const API_CONFIG = {
    BASE_URL: '/api/todos',
    HEADERS: {
        'Content-Type': 'application/json'
    }
};

// 優先級配置
const PRIORITY_CONFIG = {
    order: { high: 1, medium: 2, normal: 4 },
    display: {
        'normal': { name: '普通', color: '#4CAF50', emoji: '🟢' },
        'medium': { name: '優先', color: '#FF9800', emoji: '🟡' },
        'high': { name: '緊急', color: '#FF5722', emoji: '🟠' }
    }
};

// 日期格式配置
const DATE_CONFIG = {
    locale: 'en-GB',
    options: {
        day: '2-digit',
        month: 'short',
        weekday: 'long'
    },
    completedOptions: {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }
};

// DOM 元素選擇器
const SELECTORS = {
    // 主要容器
    overdueTasksEl: 'overdueTasks',
    todayTasksEl: 'todayTasks',
    completedThisMonthTasksEl: 'completedThisMonthTasks',
    taskCountEl: 'taskCount',
    todayLabelEl: 'todayLabel',
    completedThisMonthLabelEl: 'completedThisMonthLabel',

    // 新增任務表單
    addTaskBtn: 'addTaskBtn',
    addTaskForm: 'addTaskForm',
    taskTitleInput: 'taskTitleInput',
    taskDescInput: 'taskDescInput',
    cancelTaskBtn: 'cancelTaskBtn',
    submitTaskBtn: 'submitTaskBtn',

    // 新增欄位
    dateSelect: 'dateSelect',
    customDateInput: 'customDateInput',
    prioritySelect: 'prioritySelect',
    reminderSelect: 'reminderSelect',
    customReminderInput: 'customReminderInput'
};

// 將配置暴露到全域
window.DEVELOPER_MODE = DEVELOPER_MODE;
window.API_CONFIG = API_CONFIG;
window.PRIORITY_CONFIG = PRIORITY_CONFIG;
window.DATE_CONFIG = DATE_CONFIG;
window.SELECTORS = SELECTORS;