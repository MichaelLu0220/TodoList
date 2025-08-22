// ===== 新增任務表單模組 =====
console.log("Loaded task-form.js @", new Date().toISOString());

const TaskForm = (() => {

    // DOM 元素
    let addTaskBtn, addTaskForm, taskTitleInput, taskDescInput;
    let cancelTaskBtn, submitTaskBtn, dateSelect, customDateInput;
    let prioritySelect, reminderSelect, customReminderInput;

    /**
     * 初始化表單
     */
    function init() {
        // 獲取 DOM 元素
        addTaskBtn = document.getElementById(SELECTORS.addTaskBtn);
        addTaskForm = document.getElementById(SELECTORS.addTaskForm);
        taskTitleInput = document.getElementById(SELECTORS.taskTitleInput);
        taskDescInput = document.getElementById(SELECTORS.taskDescInput);
        cancelTaskBtn = document.getElementById(SELECTORS.cancelTaskBtn);
        submitTaskBtn = document.getElementById(SELECTORS.submitTaskBtn);
        dateSelect = document.getElementById(SELECTORS.dateSelect);
        customDateInput = document.getElementById(SELECTORS.customDateInput);
        prioritySelect = document.getElementById(SELECTORS.prioritySelect);
        reminderSelect = document.getElementById(SELECTORS.reminderSelect);
        customReminderInput = document.getElementById(SELECTORS.customReminderInput);

        setupEventListeners();
        setupSelectHandlers();
    }

    /**
     * 設置事件監聽器
     */
    function setupEventListeners() {
        addTaskBtn.addEventListener('click', showForm);
        cancelTaskBtn.addEventListener('click', hideForm);
        submitTaskBtn.addEventListener('click', handleSubmit);
    }

    /**
     * 設置選擇器的處理邏輯
     */
    function setupSelectHandlers() {
        // 日期選擇
        dateSelect.addEventListener('change', () => {
            if (dateSelect.value === 'custom') {
                customDateInput.classList.remove('hidden');
                // 設定最小日期為今天，防止選擇過去日期
                const today = Utils.getTodayDateString();
                customDateInput.setAttribute('min', today);
                customDateInput.focus();
            } else {
                customDateInput.classList.add('hidden');
            }
        });

        // Reminder 選擇
        reminderSelect.addEventListener('change', () => {
            if (reminderSelect.value === 'custom') {
                customReminderInput.classList.remove('hidden');
                customReminderInput.focus();
            } else {
                customReminderInput.classList.add('hidden');
            }
        });
    }

    /**
     * 顯示表單
     */
    function showForm() {
        addTaskBtn.style.display = 'none';
        addTaskForm.classList.remove('hidden');
        taskTitleInput.focus();
    }

    /**
     * 隱藏表單
     */
    function hideForm() {
        resetForm();
    }

    /**
     * 處理表單提交
     */
    async function handleSubmit() {
        const title = taskTitleInput.value.trim();
        const description = taskDescInput.value.trim();

        if (!title) {
            alert('請輸入任務標題');
            taskTitleInput.focus();
            return;
        }

        try {
            // 計算截止日期
            const dueDate = Utils.calculateDueDate(
                dateSelect.value,
                customDateInput.value
            );

            // 計算提醒時間
            const reminder = Utils.calculateReminder(
                reminderSelect.value,
                customReminderInput.value
            );

            // 創建任務數據
            const taskData = {
                title,
                description,
                dueDate,
                priority: prioritySelect.value,
                reminder
            };

            // 調用 API 創建任務
            await API.createTask(taskData);

            // 重置表單並重新載入任務
            resetForm();
            await TodoApp.loadTasks();

        } catch (error) {
            if (error.message.includes('過去的日期')) {
                alert(error.message);
                customDateInput.focus();
            } else {
                console.error('創建任務失敗:', error);
                alert('創建任務失敗，請重試');
            }
        }
    }

    /**
     * 重置表單
     */
    function resetForm() {
        // 清空輸入欄位
        taskTitleInput.value = '';
        taskDescInput.value = '';
        customDateInput.value = '';
        customReminderInput.value = '';

        // 回歸預設值
        dateSelect.value = 'today';
        customDateInput.classList.add('hidden');
        prioritySelect.value = 'normal';
        reminderSelect.value = '';
        customReminderInput.classList.add('hidden');

        // 隱藏表單，顯示按鈕
        addTaskForm.classList.add('hidden');
        addTaskBtn.style.display = 'block';
    }

    /**
     * 獲取表單數據
     */
    function getFormData() {
        return {
            title: taskTitleInput.value.trim(),
            description: taskDescInput.value.trim(),
            dateSelect: dateSelect.value,
            customDate: customDateInput.value,
            priority: prioritySelect.value,
            reminderSelect: reminderSelect.value,
            customReminder: customReminderInput.value
        };
    }

    /**
     * 設置表單數據（用於編輯模式）
     */
    function setFormData(data) {
        taskTitleInput.value = data.title || '';
        taskDescInput.value = data.description || '';
        prioritySelect.value = data.priority || 'normal';

        if (data.dueDate) {
            // 根據日期設置選擇器
            const today = Utils.getTodayDateString();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            if (data.dueDate === today) {
                dateSelect.value = 'today';
            } else if (data.dueDate === tomorrowStr) {
                dateSelect.value = 'tomorrow';
            } else {
                dateSelect.value = 'custom';
                customDateInput.value = data.dueDate;
                customDateInput.classList.remove('hidden');
            }
        }

        // 設置提醒時間
        if (data.reminder) {
            reminderSelect.value = 'custom';
            const reminderDate = new Date(data.reminder);
            const timeStr = reminderDate.toTimeString().slice(0, 5);
            customReminderInput.value = timeStr;
            customReminderInput.classList.remove('hidden');
        }
    }

    // 返回公開方法
    return {
        init,
        showForm,
        hideForm,
        resetForm,
        getFormData,
        setFormData,
        handleSubmit
    };
})();

// 全域匯出
window.TaskForm = TaskForm;