// ===== 任務渲染模組 =====
console.log("Loaded task-renderer.js @", new Date().toISOString());

const TaskRenderer = (() => {

    /**
     * 渲染任務列表
     */
    function renderTasks(container, tasks) {
        container.innerHTML = '';
        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            container.appendChild(taskElement);
        });
    }

    /**
     * 創建單個任務元素
     */
    function createTaskElement(task) {
        const div = document.createElement('div');

        // 構建任務的 CSS 類名
        let taskClasses = 'task';
        if (task.completed) {
            taskClasses += ' completed';
        }
        // 只有未完成的任務才顯示優先級特效
        if (task.priority && !task.completed) {
            taskClasses += ` priority-${task.priority}`;
        }

        div.className = taskClasses;

        // 處理描述顯示
        const description = task.description || '';
        const truncatedDesc = Utils.truncateText(description, 80);

        // 為已完成的任務顯示完成日期，未完成的任務顯示截止日期
        const dateText = task.completed && task.completedDate
            ? Utils.formatDate(task.completedDate, { day: '2-digit', month: 'short' })
            : (task.dueDate || '');

        div.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''}
                onchange="TodoApp.toggleTask(${task.id})" ${task.completed ? 'disabled' : ''}>
            <div class="task-content">
                <span class="task-title">${task.title}</span>
                ${description ? `<div class="task-description">${truncatedDesc}</div>` : ''}
            </div>
            <small class="task-date" title="${Utils.getPriorityText(task.priority)}">
                ${dateText}
            </small>
        `;

        // 為任務添加點擊事件（已完成的任務依然可以查看詳情）
        div.addEventListener('click', (e) => {
            if (e.target.tagName.toLowerCase() !== 'input') {
                TaskModal.showTaskDetails(task);
            }
        });

        return div;
    }

    /**
     * 更新任務計數
     */
    function updateTaskCount(tasks) {
        const taskCountEl = document.getElementById(SELECTORS.taskCountEl);
        const uncompletedTasks = tasks.filter(t => !t.completed);
        taskCountEl.textContent = `${uncompletedTasks.length} tasks`;
    }

    /**
     * 設置今天的標籤
     */
    function setTodayLabel() {
        const todayLabelEl = document.getElementById(SELECTORS.todayLabelEl);
        todayLabelEl.textContent = Utils.formatDate(new Date(), DATE_CONFIG.options);
    }

    /**
     * 設置當月完成任務的標籤
     */
    function setCompletedThisMonthLabel() {
        const completedThisMonthLabelEl = document.getElementById(SELECTORS.completedThisMonthLabelEl);
        const currentMonth = Utils.formatDate(new Date(), {
            month: 'long', year: 'numeric'
        });
        completedThisMonthLabelEl.textContent = `Completed in ${currentMonth}`;
    }

    /**
     * 顯示或隱藏區塊
     */
    function toggleSection(sectionElement, shouldShow) {
        if (shouldShow) {
            sectionElement.style.display = 'block';
        } else {
            sectionElement.style.display = 'none';
        }
    }

    /**
     * 渲染任務到各個區塊
     */
    function renderTasksToSections(tasks) {
        // 分類任務：過期但未完成、今天的任務、當月完成的任務
        const overdue = Utils.sortTasksByPriority(tasks.filter(t => t.overdue && !t.completed));
        const today = Utils.sortTasksByPriority(tasks.filter(t => !t.completed && t.dueToday));
        const completedThisMonth = Utils.sortTasksByPriority(tasks.filter(t => t.completedThisMonth));

        // 獲取容器元素
        const overdueTasksEl = document.getElementById(SELECTORS.overdueTasksEl);
        const todayTasksEl = document.getElementById(SELECTORS.todayTasksEl);
        const completedThisMonthTasksEl = document.getElementById(SELECTORS.completedThisMonthTasksEl);

        // 只有當有過期任務時才顯示 Overdue 區塊
        const overdueSection = overdueTasksEl.closest('section');
        if (overdue.length > 0) {
            toggleSection(overdueSection, true);
            renderTasks(overdueTasksEl, overdue);
        } else {
            toggleSection(overdueSection, false);
        }

        // 今天的任務
        renderTasks(todayTasksEl, today);

        // 當月完成的任務 - 只有當有已完成任務時才顯示區塊
        const completedThisMonthSection = completedThisMonthTasksEl.closest('section');
        if (completedThisMonth.length > 0) {
            toggleSection(completedThisMonthSection, true);
            renderTasks(completedThisMonthTasksEl, completedThisMonth);
        } else {
            toggleSection(completedThisMonthSection, false);
        }

        // 更新任務計數
        updateTaskCount(tasks);
    }

    // 返回公開方法
    return {
        renderTasks,
        createTaskElement,
        updateTaskCount,
        setTodayLabel,
        setCompletedThisMonthLabel,
        toggleSection,
        renderTasksToSections
    };
})();

// 全域匯出
window.TaskRenderer = TaskRenderer;