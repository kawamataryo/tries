package com.example.demo.presentation;

import com.example.demo.application.command.TodoCommandService;
import com.example.demo.application.query.TodoQueryService;
import com.example.demo.application.query.TodoView;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;


@RestController
@RequestMapping("/api/todos")
public class TodoController {
    private final TodoCommandService commandService;
    private final TodoQueryService queryService;

    public TodoController(TodoCommandService commandService, TodoQueryService queryService) {
        this.commandService = commandService;
        this.queryService = queryService;
    }

    @PostMapping
    public ResponseEntity<CreateTodoResponse> createTodo(@RequestBody CreateTodoRequest request) {
        UUID id = commandService.createTodo(request.title(), request.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(new CreateTodoResponse(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TodoView> getTodo(@PathVariable UUID id) {
        try {
            TodoView todo = queryService.getTodo(id);
            return ResponseEntity.ok(todo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Void> completeTodo(@PathVariable UUID id) {
        commandService.completeTodo(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable UUID id) {
        commandService.deleteTodo(id);
        return ResponseEntity.ok().build();
    }

    public record CreateTodoRequest(String title, String description) {}
    public record CreateTodoResponse(UUID id) {}
}
