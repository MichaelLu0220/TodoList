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

        // 生成描述和評論區域 HTML
        const descriptionSectionHTML = generateDescriptionSectionHTML(task);
        const commentSectionHTML = generateCommentSectionHTML(task);

        modal.innerHTML = `
        <div class="task-modal-content two-column">
            <span class="close-btn">&times;</span>
            <div class="task-left">
                <h2 id="taskTitle">${task.title}</h2>

                <!-- 新的描述區域 -->
                <div class="description-section">
                    <div id="descriptionContainer" data-task-id="${task.id}">
                        ${descriptionSectionHTML}
                    </div>
                </div>

                <div class="sub-task-placeholder">+ Add sub-task</div>

                <!-- 評論區域 -->
                <div class="comment-section">
                    <div class="comment-header">
                        <strong>Notes</strong>
                        <span class="comment-status" id="commentStatus"></span>
                    </div>
                    <div id="commentContainer" data-task-id="${task.id}">
                        ${commentSectionHTML}
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

        // 設置描述和評論功能
        setupDescriptionFunctionality(task);
        setupNewCommentFunctionality(task);

        // 其他事件監聽器...
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

        if (!commentTextarea) {
            console.error('Comment textarea not found!');
            return;
        }

        let saveTimeout;

        // 記錄原始值 - 這次確保值已經正確設置
        const originalValue = commentTextarea.value;
        commentTextarea.dataset.originalValue = originalValue;
        console.log('Comment functionality initialized with value:', originalValue);

        // 顯示保存狀態
        function showSaveStatus(status, message) {
            if (commentStatus) {
                commentStatus.textContent = message;
                commentStatus.className = `comment-status ${status}`;

                if (status === 'saved') {
                    setTimeout(() => {
                        commentStatus.textContent = '';
                        commentStatus.className = 'comment-status';
                    }, 2000);
                }
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
                    commentTextarea.dataset.originalValue = comment; // 更新原始值

                    loadTasks();
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
            if (commentTextarea.value !== commentTextarea.dataset.originalValue) {
                autoSaveComment();
            }
        });
    }

    // async function saveTaskEdit(task, modal) {
    //     await fetch(`${API_URL}/${task.id}`, {
    //         method: 'PUT',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify(task)
    //     });
    //     modal.remove();
    //     loadTasks();
    // }

    async function toggleTask(id) {
        await fetch(`${API_URL}/${id}`, { method: 'PATCH' });
        loadTasks();
    }

    // 新的評論區域 HTML 生成函數
    function generateCommentSectionHTML(task) {
        const hasComment = task.comment && task.comment.trim() !== '';

        if (hasComment) {
            // 有評論時顯示評論內容
            const commentUpdatedDate = task.commentUpdatedDate
                ? new Date(task.commentUpdatedDate).toLocaleString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : '未知時間';

            return `
                <div class="comment-display" id="commentDisplay">
                    <div class="comment-text">${escapeHtml(task.comment)}</div>
                    <div class="comment-meta">
                        <span class="comment-timestamp">更新於 ${commentUpdatedDate}</span>
                    </div>
                </div>
            `;
        } else {
            // 沒有評論時顯示添加提示
            return `
                <div class="comment-empty" id="commentEmpty">
                    <div class="add-comment-text">📝 添加筆記</div>
                    <div class="add-comment-hint">點擊開始記錄想法...</div>
                </div>
            `;
        }
    }

    // HTML 轉義函數
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 新的評論功能設置
    function setupNewCommentFunctionality(task) {
        const commentContainer = document.getElementById('commentContainer');
        const commentStatus = document.getElementById('commentStatus');
        const taskId = task.id;

        let isEditing = false;
        let currentComment = task.comment || '';

        // 顯示保存狀態
        function showSaveStatus(status, message) {
            if (commentStatus) {
                commentStatus.textContent = message;
                commentStatus.className = `comment-status ${status}`;

                if (status === 'saved') {
                    setTimeout(() => {
                        commentStatus.textContent = '';
                        commentStatus.className = 'comment-status';
                    }, 2000);
                }
            }
        }

        // 切換到編輯模式
        function switchToEditMode() {
            if (isEditing) return;

            isEditing = true;
            commentContainer.innerHTML = `
                <div class="comment-edit">
                    <textarea id="commentTextarea" placeholder="在此添加筆記...">${currentComment}</textarea>
                    <div class="comment-actions">
                        <button class="comment-btn cancel" id="cancelCommentBtn">取消</button>
                        <button class="comment-btn save" id="saveCommentBtn">保存</button>
                    </div>
                </div>
            `;

            const textarea = document.getElementById('commentTextarea');
            const saveBtn = document.getElementById('saveCommentBtn');
            const cancelBtn = document.getElementById('cancelCommentBtn');

            // 聚焦並選中文字
            textarea.focus();
            textarea.select();

            // 保存按鈕事件
            saveBtn.addEventListener('click', saveComment);

            // 取消按鈕事件
            cancelBtn.addEventListener('click', cancelEdit);

            // 快捷鍵支援
            textarea.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    saveComment();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelEdit();
                }
            });
        }

        // 保存評論
        async function saveComment() {
            const textarea = document.getElementById('commentTextarea');
            const newComment = textarea.value.trim();

            showSaveStatus('saving', 'Saving...');

            try {
                const response = await fetch(`${API_URL}/${taskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ comment: newComment })
                });

                if (!response.ok) {
                    throw new Error('Save failed');
                }

                const updatedTask = await response.json();
                currentComment = newComment;

                showSaveStatus('saved', 'Saved');

                // 更新顯示模式
                switchToDisplayMode(updatedTask);

                // 重新載入任務列表
                loadTasks();

            } catch (error) {
                console.error('Error saving comment:', error);
                showSaveStatus('error', 'Save failed');
            }
        }

        // 取消編輯
        function cancelEdit() {
            if (currentComment.trim() === '') {
                switchToEmptyMode();
            } else {
                // 使用當前任務資料重建顯示模式
                const updatedTask = {
                    ...task,
                    comment: currentComment,
                    commentUpdatedDate: task.commentUpdatedDate
                };
                switchToDisplayMode(updatedTask);
            }
        }

        // 切換到顯示模式
        function switchToDisplayMode(updatedTask) {
            isEditing = false;
            const commentUpdatedDate = updatedTask.commentUpdatedDate
                ? new Date(updatedTask.commentUpdatedDate).toLocaleString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : '剛剛';

            commentContainer.innerHTML = `
                <div class="comment-display" id="commentDisplay">
                    <div class="comment-text">${escapeHtml(updatedTask.comment)}</div>
                    <div class="comment-meta">
                        <span class="comment-timestamp">更新於 ${commentUpdatedDate}</span>
                    </div>
                </div>
            `;

            // 重新綁定點擊事件
            document.getElementById('commentDisplay').addEventListener('click', switchToEditMode);
        }

        // 切換到空狀態模式
        function switchToEmptyMode() {
            isEditing = false;
            commentContainer.innerHTML = `
                <div class="comment-empty" id="commentEmpty">
                    <div class="add-comment-text">📝 添加筆記</div>
                    <div class="add-comment-hint">點擊開始記錄想法...</div>
                </div>
            `;

            // 重新綁定點擊事件
            document.getElementById('commentEmpty').addEventListener('click', switchToEditMode);
        }

        // 初始化點擊事件
        const commentDisplay = document.getElementById('commentDisplay');
        const commentEmpty = document.getElementById('commentEmpty');

        if (commentDisplay) {
            commentDisplay.addEventListener('click', switchToEditMode);
        }

        if (commentEmpty) {
            commentEmpty.addEventListener('click', switchToEditMode);
        }
    }


    // 新的描述區域 HTML 生成函數
    function generateDescriptionSectionHTML(task) {
        const hasDescription = task.description && task.description.trim() !== '';

        if (hasDescription) {
            // 有描述時顯示描述內容
            return `
                <div class="description-display" id="descriptionDisplay">
                    <div class="description-text">${escapeHtml(task.description)}</div>
                </div>
            `;
        } else {
            // 沒有描述時顯示添加提示
            return `
                <div class="description-empty" id="descriptionEmpty">
                    <div class="add-description-text">📝 添加描述</div>
                    <div class="add-description-hint">點擊添加任務詳細說明...</div>
                </div>
            `;
        }
    }


    // 新的描述功能設置
    function setupDescriptionFunctionality(task) {
        const descriptionContainer = document.getElementById('descriptionContainer');
        const taskId = task.id;

        let isEditing = false;
        let currentDescription = task.description || '';

        // 切換到編輯模式
        function switchToEditMode() {
            if (isEditing) return;

            isEditing = true;
            descriptionContainer.innerHTML = `
                <div class="description-edit">
                    <textarea id="descriptionTextarea" placeholder="在此添加任務描述...">${currentDescription}</textarea>
                    <div class="description-actions">
                        <button class="description-btn cancel" id="cancelDescriptionBtn">取消</button>
                        <button class="description-btn save" id="saveDescriptionBtn">保存</button>
                    </div>
                </div>
            `;

            const textarea = document.getElementById('descriptionTextarea');
            const saveBtn = document.getElementById('saveDescriptionBtn');
            const cancelBtn = document.getElementById('cancelDescriptionBtn');

            // 聚焦並選中文字
            textarea.focus();
            textarea.select();

            // 保存按鈕事件
            saveBtn.addEventListener('click', saveDescription);

            // 取消按鈕事件
            cancelBtn.addEventListener('click', cancelEdit);

            // 快捷鍵支援
            textarea.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    saveDescription();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelEdit();
                }
            });
        }

        // 保存描述
        async function saveDescription() {
            const textarea = document.getElementById('descriptionTextarea');
            const newDescription = textarea.value.trim();

            try {
                const response = await fetch(`${API_URL}/${taskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ description: newDescription })
                });

                if (!response.ok) {
                    throw new Error('Save failed');
                }

                currentDescription = newDescription;

                // 更新顯示模式
                if (newDescription.trim() === '') {
                    switchToEmptyMode();
                } else {
                    switchToDisplayMode();
                }

                // 重新載入任務列表
                loadTasks();

            } catch (error) {
                console.error('Error saving description:', error);
                alert('保存描述失敗，請重試');
            }
        }

        // 取消編輯
        function cancelEdit() {
            if (currentDescription.trim() === '') {
                switchToEmptyMode();
            } else {
                switchToDisplayMode();
            }
        }

        // 切換到顯示模式
        function switchToDisplayMode() {
            isEditing = false;
            descriptionContainer.innerHTML = `
                <div class="description-display" id="descriptionDisplay">
                    <div class="description-text">${escapeHtml(currentDescription)}</div>
                </div>
            `;

            // 重新綁定點擊事件
            document.getElementById('descriptionDisplay').addEventListener('click', switchToEditMode);
        }

        // 切換到空狀態模式
        function switchToEmptyMode() {
            isEditing = false;
            descriptionContainer.innerHTML = `
                <div class="description-empty" id="descriptionEmpty">
                    <div class="add-description-text">📝 添加描述</div>
                    <div class="add-description-hint">點擊添加任務詳細說明...</div>
                </div>
            `;

            // 重新綁定點擊事件
            document.getElementById('descriptionEmpty').addEventListener('click', switchToEditMode);
        }

        // 初始化點擊事件
        const descriptionDisplay = document.getElementById('descriptionDisplay');
        const descriptionEmpty = document.getElementById('descriptionEmpty');

        if (descriptionDisplay) {
            descriptionDisplay.addEventListener('click', switchToEditMode);
        }

        if (descriptionEmpty) {
            descriptionEmpty.addEventListener('click', switchToEditMode);
        }
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