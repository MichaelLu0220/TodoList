package com.micp.todolist.controller;

import com.micp.todolist.model.Todo;
import com.micp.todolist.service.TodoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/todos")
@CrossOrigin(origins = "*") // 允許跨域請求
public class TodoRestController {

    private final TodoService todoService;

    public TodoRestController(TodoService todoService) {
        this.todoService = todoService;
    }

    /**
     * 獲取所有任務，包含 overdue 狀態和當月完成狀態
     * GET /api/todos
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllTodos() {
        List<Todo> todos = todoService.findAll();
        List<Map<String, Object>> todoMaps = todos.stream()
                .map(this::convertToMap)
                .toList();
        return ResponseEntity.ok(todoMaps);
    }

    /**
     * 將 Todo 轉換為包含各種狀態的 Map
     */
    private Map<String, Object> convertToMap(Todo todo) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", todo.getId());
        map.put("title", todo.getTitle());
        map.put("description", todo.getDescription());
        map.put("comment", todo.getComment()); // 新增 comment 欄位
        map.put("commentUpdatedDate", todo.getCommentUpdatedDate()); // 新增評論更新時間
        map.put("completed", todo.isCompleted());
        map.put("createdDate", todo.getCreatedDate());
        map.put("dueDate", todo.getDueDate());
        map.put("priority", todo.getPriority());
        map.put("reminder", todo.getReminder());
        map.put("completedDate", todo.getCompletedDate());
        map.put("overdue", todo.isOverdue());
        map.put("dueToday", todo.isDueToday());
        map.put("completedThisMonth", todo.isCompletedThisMonth());
        return map;
    }

    /**
     * 根據ID獲取單個任務
     * GET /api/todos/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Todo> getTodoById(@PathVariable Long id) {
        Todo todo = todoService.findById(id);
        if (todo == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(todo);
    }

    /**
     * 創建新任務
     * POST /api/todos
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createTodo(@RequestBody Map<String, Object> todoData) {
        Todo todo = new Todo();

        // 設置標題
        todo.setTitle((String) todoData.get("title"));

        // 設置描述
        if (todoData.containsKey("description") && todoData.get("description") != null) {
            todo.setDescription((String) todoData.get("description"));
        }

        // 設置評論
        if (todoData.containsKey("comment") && todoData.get("comment") != null) {
            todo.setComment((String) todoData.get("comment"));
        }

        // 設置完成狀態（默認為未完成）
        todo.setCompleted(false);

        // 處理截止日期
        if (todoData.containsKey("dueDate") && todoData.get("dueDate") != null) {
            try {
                LocalDate dueDate = LocalDate.parse((String) todoData.get("dueDate"));
                todo.setDueDate(dueDate);
            } catch (Exception e) {
                todo.setDueDate(LocalDate.now());
            }
        } else {
            todo.setDueDate(LocalDate.now());
        }

        // 設置優先級
        if (todoData.containsKey("priority") && todoData.get("priority") != null) {
            todo.setPriority((String) todoData.get("priority"));
        } else {
            todo.setPriority("low"); // 默認為低優先級
        }

        // 處理提醒時間
        if (todoData.containsKey("reminder") && todoData.get("reminder") != null) {
            try {
                String reminderStr = (String) todoData.get("reminder");
                if (!reminderStr.isEmpty()) {
                    LocalDateTime reminder = LocalDateTime.parse(reminderStr,
                            DateTimeFormatter.ISO_DATE_TIME);
                    todo.setReminder(reminder);
                }
            } catch (Exception e) {
                // 如果解析失敗，不設置提醒
                System.err.println("Failed to parse reminder: " + e.getMessage());
            }
        }

        Todo savedTodo = todoService.save(todo);
        return ResponseEntity.ok(convertToMap(savedTodo));
    }

    /**
     * 切換任務完成狀態
     * PATCH /api/todos/{id}
     */
    @PatchMapping("/{id}")
    public ResponseEntity<Map<String, Object>> toggleTodo(@PathVariable Long id) {
        Todo todo = todoService.findById(id);
        if (todo == null) {
            return ResponseEntity.notFound().build();
        }

        // 切換完成狀態
        todo.setCompleted(!todo.isCompleted());
        Todo updatedTodo = todoService.save(todo);
        return ResponseEntity.ok(convertToMap(updatedTodo));
    }

    /**
     * 更新任務 - 修改以正確處理評論更新時間
     * PUT /api/todos/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateTodo(@PathVariable Long id, @RequestBody Map<String, Object> todoData) {
        Todo todo = todoService.findById(id);
        if (todo == null) {
            return ResponseEntity.notFound().build();
        }

        // 更新標題
        if (todoData.containsKey("title")) {
            todo.setTitle((String) todoData.get("title"));
        }

        // 更新描述
        if (todoData.containsKey("description")) {
            todo.setDescription((String) todoData.get("description"));
        }

        // 更新評論 - 這裡會自動更新 commentUpdatedDate
        if (todoData.containsKey("comment")) {
            String newComment = (String) todoData.get("comment");
            todo.setComment(newComment); // setComment 方法會自動更新時間
        }

        // 更新完成狀態
        if (todoData.containsKey("completed")) {
            todo.setCompleted((Boolean) todoData.get("completed"));
        }

        // 更新截止日期
        if (todoData.containsKey("dueDate")) {
            try {
                LocalDate dueDate = LocalDate.parse((String) todoData.get("dueDate"));
                todo.setDueDate(dueDate);
            } catch (Exception e) {
                // 保持原有日期
            }
        }

        // 更新優先級
        if (todoData.containsKey("priority")) {
            todo.setPriority((String) todoData.get("priority"));
        }

        // 更新提醒時間
        if (todoData.containsKey("reminder")) {
            try {
                String reminderStr = (String) todoData.get("reminder");
                if (reminderStr != null && !reminderStr.isEmpty()) {
                    LocalDateTime reminder = LocalDateTime.parse(reminderStr,
                            DateTimeFormatter.ISO_DATE_TIME);
                    todo.setReminder(reminder);
                } else {
                    todo.setReminder(null);
                }
            } catch (Exception e) {
                // 保持原有提醒時間
            }
        }

        Todo updatedTodo = todoService.save(todo);
        return ResponseEntity.ok(convertToMap(updatedTodo));
    }

    /**
     * 刪除任務
     * DELETE /api/todos/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTodo(@PathVariable Long id) {
        Todo todo = todoService.findById(id);
        if (todo == null) {
            return ResponseEntity.notFound().build();
        }

        todoService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Todo deleted successfully"));
    }
}