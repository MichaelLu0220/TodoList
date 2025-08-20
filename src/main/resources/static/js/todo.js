console.log("Loaded todo.js @", new Date().toISOString());

// 🛠️ 開發者模式開關 - 設為 false 即可關閉所有開發者功能
const DEVELOPER_MODE = true;

const TodoApp = (() => {
    const API_URL = '/api/todos';

    const overdueTasksEl = document.getElementById('overdueTasks');
    const todayTasksEl = document.getElementById('todayTasks');
    const completedThisMonthTasksEl = document.getElementById('completedThisMonthTasks');
    const taskCountEl = document.getElementById('taskCount');
    const todayLabelEl = document.getElementById('todayLabel');
    const completedThisMonthLabelEl = document.getElementById('completedThisMonthLabel');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const addTaskForm = document.getElementById('addTaskForm');
    const taskTitleInput = document.getElementById('taskTitleInput');
    const taskDescInput = document.getElementById('taskDescInput');
    const cancelTaskBtn = document.getElementById('cancelTaskBtn');
    const submitTaskBtn = document.getElementById('submitTaskBtn');

    // 新增欄位
    const dateSelect = document.getElementById('dateSelect');
    const customDateInput = document.getElementById('customDateInput');
    const prioritySelect = document.getElementById('prioritySelect');
    const reminderSelect = document.getElementById('reminderSelect');
    const customReminderInput = document.getElementById('customReminderInput');

    function init() {
        todayLabelEl.textContent = new Date().toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', weekday: 'long'
        });

        // 設置當月完成任務的標題
        const currentMonth = new Date().toLocaleDateString('en-GB', {
            month: 'long', year: 'numeric'
        });
        completedThisMonthLabelEl.textContent = `Completed in ${currentMonth}`;

        loadTasks();
        setupAddTaskInput();
        setupSelectHandlers();
    }

    function setupSelectHandlers() {
        // 日期選擇
        dateSelect.addEventListener('change', () => {
            if (dateSelect.value === 'custom') {
                customDateInput.classList.remove('hidden');
                // 設定最小日期為今天，防止選擇過去日期
                const today = new Date().toISOString().split('T')[0];
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

    function setupAddTaskInput() {
        addTaskBtn.addEventListener('click', () => {
            addTaskBtn.style.display = 'none';
            addTaskForm.classList.remove('hidden');
            taskTitleInput.focus();
        });

        cancelTaskBtn.addEventListener('click', () => {
            resetAddTaskForm();
        });

        submitTaskBtn.addEventListener('click', () => {
            const title = taskTitleInput.value.trim();
            const description = taskDescInput.value.trim();

            // 日期計算
            let dueDate = null;
            const today = new Date().toISOString().split('T')[0]; // 今天的日期字串

            if (dateSelect.value === 'today') {
                dueDate = today;
            } else if (dateSelect.value === 'tomorrow') {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                dueDate = d.toISOString().split('T')[0];
            } else if (dateSelect.value === 'custom' && customDateInput.value) {
                const selectedDate = customDateInput.value;

                // 檢查是否選擇了過去的日期
                if (selectedDate < today) {
                    alert('無法設定過去的日期作為截止日期，請選擇今天或未來的日期。');
                    customDateInput.focus();
                    return; // 停止執行，不創建任務
                }

                dueDate = selectedDate;
            }

            // Reminder
            let reminder = '';
            if (reminderSelect.value === '1h') {
                const d = new Date();
                d.setHours(d.getHours() + 1);
                reminder = d.toISOString();
            } else if (reminderSelect.value === 'tomorrow9') {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                d.setHours(9, 0, 0, 0);
                reminder = d.toISOString();
            } else if (reminderSelect.value === 'custom' && customReminderInput.value) {
                const d = new Date();
                const [hh, mm] = customReminderInput.value.split(':');
                d.setHours(hh, mm, 0, 0);
                reminder = d.toISOString();
            }

            if (title) {
                addTask(title, description, dueDate, prioritySelect.value, reminder);
            }
        });
    }

    async function loadTasks() {
        const res = await fetch(API_URL);
        const tasks = await res.json();

        // 分類任務：過期但未完成、今天的任務、當月完成的任務
        const overdue = sortTasksByPriority(tasks.filter(t => t.overdue && !t.completed));
        const today = sortTasksByPriority(tasks.filter(t => !t.completed && t.dueToday));
        const completedThisMonth = sortTasksByPriority(tasks.filter(t => t.completedThisMonth));

        // 只有當有過期任務時才顯示 Overdue 區塊
        const overdueSection = overdueTasksEl.closest('section');
        if (overdue.length > 0) {
            overdueSection.style.display = 'block';
            renderTasks(overdueTasksEl, overdue);
        } else {
            overdueSection.style.display = 'none';
        }

        // 今天的任務
        renderTasks(todayTasksEl, today);

        // 當月完成的任務 - 只有當有已完成任務時才顯示區塊
        const completedThisMonthSection = completedThisMonthTasksEl.closest('section');
        if (completedThisMonth.length > 0) {
            completedThisMonthSection.style.display = 'block';
            renderTasks(completedThisMonthTasksEl, completedThisMonth);
        } else {
            completedThisMonthSection.style.display = 'none';
        }

        // 更新任務計數（只計算未完成的任務）
        const uncompletedTasks = tasks.filter(t => !t.completed);
        taskCountEl.textContent = `${uncompletedTasks.length} tasks`;
    }

    function sortTasksByPriority(tasks) {
        const order = { high: 1, medium: 2, normal: 4 };
        return tasks.sort((a, b) => (order[a.priority] || 99) - (order[b.priority] || 99));
    }

    function renderTasks(container, tasks) {
        container.innerHTML = '';
        tasks.forEach(task => {
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

            // 獲取優先級的視覺提示文字 (用於tooltip)
            const getPriorityText = (priority) => {
                const priorityMap = {
                    'normal': '普通',
                    'medium': '優先',
                    'high': '緊急'
                };
                return priorityMap[priority] || '';
            };

            // 處理描述顯示
            const description = task.description || '';
            const maxDescLength = 80;
            const truncatedDesc = description.length > maxDescLength
                ? description.substring(0, maxDescLength) + '...'
                : description;

            // 為已完成的任務顯示完成日期，未完成的任務顯示截止日期
            const dateText = task.completed && task.completedDate
                ? new Date(task.completedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                : (task.dueDate || '');

            div.innerHTML = `
                <input type="checkbox" ${task.completed ? 'checked' : ''}
                    onchange="TodoApp.toggleTask(${task.id})" ${task.completed ? 'disabled' : ''}>
                <div class="task-content">
                    <span class="task-title">${task.title}</span>
                    ${description ? `<div class="task-description">${truncatedDesc}</div>` : ''}
                </div>
                <small class="task-date" title="${getPriorityText(task.priority)}">
                    ${dateText}
                </small>
            `;

            // 為任務添加點擊事件（已完成的任務依然可以查看詳情）
            div.addEventListener('click', (e) => {
                if (e.target.tagName.toLowerCase() !== 'input') {
                    showTaskDetails(task);
                }
            });

            container.appendChild(div);
        });
    }

    // 更新 showTaskDetails 函數來支援 comment 功能
    function showTaskDetails(task) {
        const modal = document.createElement('div');
        modal.className = 'task-modal';

        // 獲取優先級的顯示名稱和顏色
        const getPriorityDisplay = (priority) => {
            const priorityMap = {
                'normal': { name: '普通', color: '#4CAF50', emoji: '🟢' },
                'medium': { name: '優先', color: '#FF9800', emoji: '🟡' },
                'high': { name: '緊急', color: '#FF5722', emoji: '🟠' }
            };
            return priorityMap[priority] || { name: '未設置', color: '#999', emoji: '⚪' };
        };

        const priorityInfo = getPriorityDisplay(task.priority);

        // 格式化完成時間
        const completedDateText = task.completedDate
            ? new Date(task.completedDate).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })
            : '—';

        modal.innerHTML = `
            <div class="task-modal-content two-column">
                <span class="close-btn">&times;</span>
                <div class="task-left">
                    <h2 id="taskTitle">${task.title}</h2>
                    <p class="task-desc">${task.description || 'No description'}</p>
                    <div class="sub-task-placeholder">+ Add sub-task</div>

                    <!-- 改進的 Comment 區域 -->
                    <div class="comment-section">
                        <div class="comment-header">
                            <strong>Notes</strong>
                            <span class="comment-status" id="commentStatus"></span>
                        </div>
                        <div class="comment-box">
                            <textarea id="commentTextarea" placeholder="Add notes about this task..." data-task-id="${task.id}">${task.comment || ''}</textarea>
                        </div>
                    </div>
                </div>
                <div class="task-right">
                    <div class="detail-item">
                        <strong>Due Date:</strong>
                        <span id="dueDateDisplay">${task.dueDate || '—'}</span>
                        ${DEVELOPER_MODE ? `<button id="editDateBtn" class="edit-small-btn">✏️</button>` : ''}
                    </div>
                    ${DEVELOPER_MODE ? `
                    <div id="dateEditSection" class="hidden" style="margin-top: 8px;">
                        <input type="date" id="editDueDate" value="${task.dueDate || ''}" class="edit-date-input">
                        <div style="margin-top: 5px;">
                            <button id="saveDateBtn" class="save-small-btn">保存</button>
                            <button id="cancelDateBtn" class="cancel-small-btn">取消</button>
                        </div>
                    </div>
                    ` : ''}

                    <div class="detail-item">
                        <strong>Priority:</strong>
                        <span style="color: ${priorityInfo.color};">
                            ${priorityInfo.emoji} ${priorityInfo.name}
                        </span>
                    </div>
                    <div class="detail-item"><strong>Reminder:</strong> ${task.reminder || '—'}</div>
                    <div class="detail-item"><strong>Status:</strong> ${task.completed ? '✅ 已完成' : '⏳ 進行中'}</div>
                    ${task.completed ? `<div class="detail-item"><strong>Completed:</strong> ${completedDateText}</div>` : ''}
                    <div class="detail-item"><strong>Labels:</strong> (none)</div>

                    ${task.completed ? `
                        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
                            <button id="resetTaskBtn" class="reset-btn">Reset to Incomplete</button>
                        </div>
                    ` : ''}

                    <!-- 開發者模式提示 -->
                    ${DEVELOPER_MODE ? `
                    <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #f0f0f0;">
                        <small style="color: #999; font-size: 11px;">💡 開發者模式：可編輯日期用於測試</small>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // 設置 comment 功能
        setupCommentFunctionality(task.id);

        modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());

        // 添加 Reset 按鈕事件監聽器
        if (task.completed) {
            const resetBtn = modal.querySelector('#resetTaskBtn');
            if (resetBtn) {
                resetBtn.addEventListener('click', async () => {
                    await resetTaskToIncomplete(task.id);
                    modal.remove();
                });
            }
        }

        // 添加編輯日期功能（僅開發者模式）
        if (DEVELOPER_MODE) {
            window.setupDateEditHandlers(task, modal);
        }
    }

    // 新增 comment 功能設置
    function setupCommentFunctionality(taskId) {
        const commentTextarea = document.getElementById('commentTextarea');
        const commentStatus = document.getElementById('commentStatus');
        let saveTimeout;

        // 顯示保存狀態
        function showSaveStatus(status, message) {
            commentStatus.textContent = message;
            commentStatus.className = `comment-status ${status}`;

            if (status === 'saved') {
                setTimeout(() => {
                    commentStatus.textContent = '';
                    commentStatus.className = 'comment-status';
                }, 2000);
            }
        }

        // 自動保存功能
        function autoSaveComment() {
            const comment = commentTextarea.value;
            showSaveStatus('saving', 'Saving...');

            fetch(`${API_URL}/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment: comment })
            })
            .then(response => response.json())
            .then(() => {
                showSaveStatus('saved', 'Saved');
            })
            .catch(error => {
                console.error('Error saving comment:', error);
                showSaveStatus('error', 'Save failed');
            });
        }

        // 監聽輸入事件，延遲自動保存
        commentTextarea.addEventListener('input', () => {
            showSaveStatus('typing', 'Typing...');

            // 清除之前的定時器
            clearTimeout(saveTimeout);

            // 設置新的定時器，1.5秒後自動保存
            saveTimeout = setTimeout(autoSaveComment, 1500);
        });

        // 監聽失去焦點事件，立即保存
        commentTextarea.addEventListener('blur', () => {
            clearTimeout(saveTimeout);
            if (commentTextarea.value !== (commentTextarea.dataset.originalValue || '')) {
                autoSaveComment();
            }
        });

        // 記錄原始值
        commentTextarea.dataset.originalValue = commentTextarea.value;
    }

    async function saveTaskEdit(task, modal) {
        await fetch(`${API_URL}/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        modal.remove();
        loadTasks();
    }

    async function toggleTask(id) {
        await fetch(`${API_URL}/${id}`, { method: 'PATCH' });
        loadTasks();
    }

    // 🛠️ 開發者模式功能
    if (DEVELOPER_MODE) {
        function setupDateEditHandlers(task, modal) {
            const editDateBtn = modal.querySelector('#editDateBtn');
            const dateEditSection = modal.querySelector('#dateEditSection');
            const dueDateDisplay = modal.querySelector('#dueDateDisplay');
            const editDueDate = modal.querySelector('#editDueDate');
            const saveDateBtn = modal.querySelector('#saveDateBtn');
            const cancelDateBtn = modal.querySelector('#cancelDateBtn');

            let originalDate = task.dueDate;

            // 點擊編輯按鈕
            editDateBtn.addEventListener('click', () => {
                dueDateDisplay.style.display = 'none';
                editDateBtn.style.display = 'none';
                dateEditSection.classList.remove('hidden');
                editDueDate.focus();
            });

            // 取消編輯
            cancelDateBtn.addEventListener('click', () => {
                editDueDate.value = originalDate || '';
                hideEditSection();
            });

            // 保存日期
            saveDateBtn.addEventListener('click', async () => {
                const newDate = editDueDate.value;
                if (newDate !== originalDate) {
                    await updateTaskDate(task.id, newDate);
                    modal.remove();
                } else {
                    hideEditSection();
                }
            });

            // 按 Enter 保存，按 Escape 取消
            editDueDate.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    saveDateBtn.click();
                } else if (e.key === 'Escape') {
                    cancelDateBtn.click();
                }
            });

            function hideEditSection() {
                dueDateDisplay.style.display = 'inline';
                editDateBtn.style.display = 'inline';
                dateEditSection.classList.add('hidden');
            }
        }

        async function updateTaskDate(taskId, newDate) {
            await fetch(`${API_URL}/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dueDate: newDate })
            });
            loadTasks();
        }

        // 將函數暴露到全域以供條件調用
        window.setupDateEditHandlers = setupDateEditHandlers;
        window.updateTaskDate = updateTaskDate;
    }

    async function resetTaskToIncomplete(id) {
        // 使用 PUT 方法直接設置任務為未完成狀態
        await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: false })
        });
        loadTasks();
    }

    async function addTask(title, description, dueDate, priority, reminder) {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, dueDate, priority, reminder })
        });
        resetAddTaskForm();
        loadTasks();
    }

    function resetAddTaskForm() {
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

        addTaskForm.classList.add('hidden');
        addTaskBtn.style.display = 'block';
    }

    return { init, toggleTask };
})();

document.addEventListener('DOMContentLoaded', TodoApp.init);