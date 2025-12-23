package com.example.demo.application.query;

import java.util.List;
import java.util.UUID;

import com.example.demo.domain.Todo;
import com.example.demo.domain.events.DomainEvent;

import org.springframework.stereotype.Service;

import com.example.demo.infrastructure.eventstore.EventStore;

@Service
public class TodoQueryService {
    private final EventStore eventStore;

    public TodoQueryService(EventStore eventStore) {
        this.eventStore = eventStore;
    }

    public TodoView getTodo(UUID todoId) {
        List<DomainEvent> events = eventStore.getEvents(todoId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Todo not found: " + todoId);
        }
        Todo todo = Todo.fromEvents(events);
        if (todo.isDeleted()) {
            throw new IllegalArgumentException("Todo is deleted: " + todoId);
        }
        return new TodoView(
            todo.getId(),
            todo.getTitle(),
            todo.getDescription(),
            todo.isCompleted()
        );
    }

    public List<TodoView> getAllTodos() {
        // TODO: 実装
        return List.of();
    }
}
