// ===== API 交互模組 =====
console.log("Loaded api.js @", new Date().toISOString());

const API = (() => {
    const BASE_URL = API_CONFIG.BASE_URL;
    const HEADERS = API_CONFIG.HEADERS;

    /**
     * 獲取所有任務
     */
    async function getAllTasks() {
        try {
            const response = await fetch(BASE_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }
    }

    /**
     * 根據ID獲取單個任務
     */
    async function getTaskById(id) {
        try {
            const response = await fetch(`${BASE_URL}/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching task:', error);
            throw error;
        }
    }

    /**
     * 創建新任務
     */
    async function createTask(taskData) {
        try {
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: HEADERS,
                body: JSON.stringify(taskData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }

    /**
     * 切換任務完成狀態
     */
    async function toggleTask(id) {
        try {
            const response = await fetch(`${BASE_URL}/${id}`, {
                method: 'PATCH'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error toggling task:', error);
            throw error;
        }
    }

    /**
     * 更新任務
     */
    async function updateTask(id, updateData) {
        try {
            const response = await fetch(`${BASE_URL}/${id}`, {
                method: 'PUT',
                headers: HEADERS,
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    }

    /**
     * 刪除任務
     */
    async function deleteTask(id) {
        try {
            const response = await fetch(`${BASE_URL}/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    }

    /**
     * 更新任務的評論
     */
    async function updateTaskComment(id, comment) {
        return await updateTask(id, { comment });
    }

    /**
     * 更新任務的描述
     */
    async function updateTaskDescription(id, description) {
        return await updateTask(id, { description });
    }

    /**
     * 更新任務的截止日期
     */
    async function updateTaskDate(id, dueDate) {
        return await updateTask(id, { dueDate });
    }

    /**
     * 重置任務為未完成狀態
     */
    async function resetTaskToIncomplete(id) {
        return await updateTask(id, { completed: false });
    }

    // 返回公開方法
    return {
        getAllTasks,
        getTaskById,
        createTask,
        toggleTask,
        updateTask,
        deleteTask,
        updateTaskComment,
        updateTaskDescription,
        updateTaskDate,
        resetTaskToIncomplete
    };
})();

// 全域匯出
window.API = API;