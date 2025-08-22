// ===== 主應用程式 =====
console.log("Loaded main-app.js @", new Date().toISOString());

const TodoApp = (() => {

    /**
     * 初始化應用程式
     */
    function init() {
        console.log("TodoApp initializing...");

        // 設置日期標籤
        TaskRenderer.setTodayLabel();
        TaskRenderer.setCompletedThisMonthLabel();

        // 初始化各模組
        TaskForm.init();

        // 載入任務
        loadTasks();

        console.log("TodoApp initialized successfully");
    }

    /**
     * 載入所有任務
     */
    async function loadTasks() {
        try {
            const tasks = await API.getAllTasks();
            TaskRenderer.renderTasksToSections(tasks);
        } catch (error) {
            console.error('載入任務失敗:', error);
            // 可以在這裡顯示錯誤訊息給使用者
            showErrorMessage('載入任務失敗，請重新整理頁面');
        }
    }

    /**
     * 切換任務完成狀態
     */
    async function toggleTask(id) {
        try {
            await API.toggleTask(id);
            await loadTasks();
        } catch (error) {
            console.error('切換任務狀態失敗:', error);
            showErrorMessage('操作失敗，請重試');
        }
    }

    /**
     * 顯示錯誤訊息
     */
    function showErrorMessage(message) {
        // 創建一個簡單的錯誤提示
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        errorDiv.textContent = message;

        document.body.appendChild(errorDiv);

        // 3秒後自動移除
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 3000);
    }

    /**
     * 顯示成功訊息
     */
    function showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        successDiv.textContent = message;

        document.body.appendChild(successDiv);

        // 2秒後自動移除
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 2000);
    }

    /**
     * 應用程式狀態管理
     */
    const AppState = {
        isLoading: false,
        currentTasks: [],

        setLoading(loading) {
            this.isLoading = loading;
            // 可以在這裡顯示/隱藏載入指示器
        },

        setTasks(tasks) {
            this.currentTasks = tasks;
        },

        getTaskById(id) {
            return this.currentTasks.find(task => task.id === id);
        }
    };

    /**
     * 重新載入任務（帶載入狀態）
     */
    async function reloadTasks() {
        AppState.setLoading(true);
        await loadTasks();
        AppState.setLoading(false);
    }

    /**
     * 獲取應用程式統計信息
     */
    function getAppStats() {
        const tasks = AppState.currentTasks;
        return {
            total: tasks.length,
            completed: tasks.filter(t => t.completed).length,
            pending: tasks.filter(t => !t.completed).length,
            overdue: tasks.filter(t => t.overdue && !t.completed).length,
            dueToday: tasks.filter(t => t.dueToday && !t.completed).length
        };
    }

    /**
     * 匯出任務資料（JSON 格式）
     */
    function exportTasks() {
        const tasks = AppState.currentTasks;
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `todos_${new Date().toISOString().split('T')[0]}.json`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showSuccessMessage('任務資料已匯出');
    }

    /**
     * 開發者模式功能
     */
    const DevMode = {
        // 清除所有已完成任務
        async clearCompletedTasks() {
            if (!DEVELOPER_MODE) return;

            const completedTasks = AppState.currentTasks.filter(t => t.completed);
            if (completedTasks.length === 0) {
                alert('沒有已完成的任務可清除');
                return;
            }

            if (confirm(`確定要刪除 ${completedTasks.length} 個已完成的任務嗎？`)) {
                try {
                    for (const task of completedTasks) {
                        await API.deleteTask(task.id);
                    }
                    await loadTasks();
                    showSuccessMessage(`已清除 ${completedTasks.length} 個已完成任務`);
                } catch (error) {
                    console.error('清除任務失敗:', error);
                    showErrorMessage('清除任務失敗');
                }
            }
        },

        // 創建測試任務
        async createTestTasks() {
            if (!DEVELOPER_MODE) return;

            const testTasks = [
                { title: '測試任務 1', priority: 'high', dueDate: Utils.getTodayDateString() },
                { title: '測試任務 2', priority: 'medium', dueDate: Utils.getTodayDateString() },
                { title: '已完成測試', completed: true, priority: 'normal' }
            ];

            try {
                for (const taskData of testTasks) {
                    await API.createTask(taskData);
                }
                await loadTasks();
                showSuccessMessage('測試任務已創建');
            } catch (error) {
                console.error('創建測試任務失敗:', error);
                showErrorMessage('創建測試任務失敗');
            }
        }
    };

    // 如果是開發者模式，將功能暴露到全域
    if (DEVELOPER_MODE) {
        window.TodoDevMode = DevMode;
        console.log('🛠️ 開發者模式已啟用');
        console.log('可用指令: TodoDevMode.clearCompletedTasks(), TodoDevMode.createTestTasks()');
    }

    // 返回公開方法
    return {
        init,
        loadTasks,
        reloadTasks,
        toggleTask,
        showErrorMessage,
        showSuccessMessage,
        getAppStats,
        exportTasks,
        AppState
    };
})();

// 全域匯出
window.TodoApp = TodoApp;

// 注意：初始化由 main.js 負責，這裡不需要重複初始化