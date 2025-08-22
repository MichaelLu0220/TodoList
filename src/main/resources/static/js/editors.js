// ===== 描述和評論編輯器 =====
console.log("Loaded editors.js @", new Date().toISOString());

// ===== 描述編輯器 =====
const DescriptionEditor = (() => {

    /**
     * 設置描述編輯功能
     */
    function setup(task) {
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

            // 事件監聽器
            saveBtn.addEventListener('click', saveDescription);
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
                await API.updateTaskDescription(taskId, newDescription);
                currentDescription = newDescription;

                // 更新顯示模式
                if (newDescription.trim() === '') {
                    switchToEmptyMode();
                } else {
                    switchToDisplayMode();
                }

                // 重新載入任務列表
                await TodoApp.loadTasks();

            } catch (error) {
                console.error('保存描述失敗:', error);
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
                    <div class="description-text">${Utils.escapeHtml(currentDescription)}</div>
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

    return { setup };
})();

// ===== 評論編輯器 =====
const CommentEditor = (() => {

    /**
     * 設置評論編輯功能
     */
    function setup(task) {
        const commentContainer = document.getElementById('commentContainer');
        const commentStatus = document.getElementById('commentStatus');
        const taskId = task.id;

        let isEditing = false;
        let currentComment = task.comment || '';

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

            // 事件監聽器
            saveBtn.addEventListener('click', saveComment);
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

            Utils.showSaveStatus(commentStatus, 'saving', 'Saving...');

            try {
                const updatedTask = await API.updateTaskComment(taskId, newComment);
                currentComment = newComment;

                Utils.showSaveStatus(commentStatus, 'saved', 'Saved');

                // 更新顯示模式
                if (newComment.trim() === '') {
                    switchToEmptyMode();
                } else {
                    switchToDisplayMode(updatedTask);
                }

                // 重新載入任務列表
                await TodoApp.loadTasks();

            } catch (error) {
                console.error('保存評論失敗:', error);
                Utils.showSaveStatus(commentStatus, 'error', 'Save failed');
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
                    <div class="comment-text">${Utils.escapeHtml(updatedTask.comment)}</div>
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

    return { setup };
})();

// 全域匯出
window.DescriptionEditor = DescriptionEditor;
window.CommentEditor = CommentEditor;