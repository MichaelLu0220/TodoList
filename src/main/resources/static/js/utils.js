// ===== 工具函數 =====
console.log("Loaded utils.js @", new Date().toISOString());

const Utils = (() => {

    /**
     * HTML 轉義函數
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 按優先級排序任務
     */
    function sortTasksByPriority(tasks) {
        return tasks.sort((a, b) =>
            (PRIORITY_CONFIG.order[a.priority] || 99) -
            (PRIORITY_CONFIG.order[b.priority] || 99)
        );
    }

    /**
     * 獲取優先級顯示信息
     */
    function getPriorityDisplay(priority) {
        return PRIORITY_CONFIG.display[priority] ||
               { name: '未設置', color: '#999', emoji: '⚪' };
    }

    /**
     * 獲取優先級文字（用於tooltip）
     */
    function getPriorityText(priority) {
        const priorityMap = {
            'normal': '普通',
            'medium': '優先',
            'high': '緊急'
        };
        return priorityMap[priority] || '';
    }

    /**
     * 格式化日期
     */
    function formatDate(date, options = DATE_CONFIG.options) {
        return new Date(date).toLocaleDateString(DATE_CONFIG.locale, options);
    }

    /**
     * 獲取今天的日期字串
     */
    function getTodayDateString() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * 計算截止日期
     */
    function calculateDueDate(dateSelectValue, customDateValue = null) {
        const today = getTodayDateString();

        switch (dateSelectValue) {
            case 'today':
                return today;
            case 'tomorrow':
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                return tomorrow.toISOString().split('T')[0];
            case 'custom':
                if (customDateValue && customDateValue < today) {
                    throw new Error('無法設定過去的日期作為截止日期，請選擇今天或未來的日期。');
                }
                return customDateValue;
            default:
                return today;
        }
    }

    /**
     * 計算提醒時間
     */
    function calculateReminder(reminderSelectValue, customReminderValue = null) {
        switch (reminderSelectValue) {
            case '1h':
                const oneHourLater = new Date();
                oneHourLater.setHours(oneHourLater.getHours() + 1);
                return oneHourLater.toISOString();
            case 'tomorrow9':
                const tomorrow9AM = new Date();
                tomorrow9AM.setDate(tomorrow9AM.getDate() + 1);
                tomorrow9AM.setHours(9, 0, 0, 0);
                return tomorrow9AM.toISOString();
            case 'custom':
                if (customReminderValue) {
                    const today = new Date();
                    const [hh, mm] = customReminderValue.split(':');
                    today.setHours(hh, mm, 0, 0);
                    return today.toISOString();
                }
                return '';
            default:
                return '';
        }
    }

    /**
     * 截斷文字
     */
    function truncateText(text, maxLength = 80) {
        if (!text) return '';
        return text.length > maxLength
            ? text.substring(0, maxLength) + '...'
            : text;
    }

    /**
     * 將 Todo 轉換為包含各種狀態的 Map（給後端用）
     */
    function convertToMap(todo) {
        const map = new Map();
        map.set('id', todo.getId());
        map.set('title', todo.getTitle());
        map.set('description', todo.getDescription());
        map.set('comment', todo.getComment());
        map.set('commentUpdatedDate', todo.getCommentUpdatedDate());
        map.set('completed', todo.isCompleted());
        map.set('createdDate', todo.getCreatedDate());
        map.set('dueDate', todo.getDueDate());
        map.set('priority', todo.getPriority());
        map.set('reminder', todo.getReminder());
        map.set('completedDate', todo.getCompletedDate());
        map.set('overdue', todo.isOverdue());
        map.set('dueToday', todo.isDueToday());
        map.set('completedThisMonth', todo.isCompletedThisMonth());
        return map;
    }

    /**
     * 顯示保存狀態
     */
    function showSaveStatus(statusElement, status, message) {
        if (!statusElement) return;

        statusElement.textContent = message;
        statusElement.className = `comment-status ${status}`;

        if (status === 'saved') {
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'comment-status';
            }, 2000);
        }
    }

    // 返回公開方法
    return {
        escapeHtml,
        sortTasksByPriority,
        getPriorityDisplay,
        getPriorityText,
        formatDate,
        getTodayDateString,
        calculateDueDate,
        calculateReminder,
        truncateText,
        convertToMap,
        showSaveStatus
    };
})();

// 全域匯出
window.Utils = Utils;