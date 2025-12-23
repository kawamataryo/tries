package com.example.demo.application.command;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import com.example.demo.domain.events.DomainEvent;

import com.example.demo.domain.Todo;
import com.example.demo.infrastructure.eventstore.EventStore;

import jakarta.transaction.Transactional;

@Service
public class TodoCommandService {
    private final EventStore eventStore;

    public TodoCommandService(EventStore eventStore) {
        this.eventStore = eventStore;
    }

    @Transactional
    public UUID createTodo(String title, String description) {
        UUID id = UUID.randomUUID();
        Todo todo = Todo.create(id, title, description);

        List<DomainEvent> events = todo.getUncommittedEvents();
        eventStore.save(events);
        todo.clearUncommittedEvents();
        return id;
    }

    @Transactional
    public void completeTodo(UUID todoId) {
        Todo todo = loadTodo(todoId);
        todo.complete();

        List<DomainEvent> events = todo.getUncommittedEvents();
        eventStore.save(events);
        todo.clearUncommittedEvents();
    }

    @Transactional
    public void deleteTodo(UUID todoId) {
        Todo todo = loadTodo(todoId);
        todo.delete();

        List<DomainEvent> events = todo.getUncommittedEvents();
        eventStore.save(events);
        todo.clearUncommittedEvents();
    }

    private Todo loadTodo(UUID todoId) {
        List<DomainEvent> events = eventStore.getEvents(todoId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Todo not found: " + todoId);
        }
        return Todo.fromEvents(events);
    }
}
