package com.example.demo.infrastructure.readmodel;

import java.util.Optional;
import java.util.UUID;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.example.demo.domain.events.TodoCompletedEvent;
import com.example.demo.domain.events.TodoCreatedEvent;
import com.example.demo.domain.events.TodoDeletedEvent;
import com.example.demo.domain.events.TodoUpdateEvent;

@Component
public class TodoProjection {
    private final TodoReadModelRepository repository;

    public TodoProjection(TodoReadModelRepository repository) {
        this.repository = repository;
    }

    @EventListener
    public void handle(TodoCreatedEvent event) {
        TodoReadModel readModel = new TodoReadModel(
            event.getAggregateId(),
            event.getTitle(),
            event.getDescription(),
            false, // completed
            false  // deleted
        );
        repository.save(readModel);
    }

    @EventListener
    public void handle(TodoCompletedEvent event) {
        UUID aggregateId = event.getAggregateId();
        Optional<TodoReadModel> optional = repository.findById(aggregateId);
        if (optional.isPresent()) {
            TodoReadModel readModel = optional.get();
            readModel.setCompleted(true);
            repository.save(readModel);
        }
    }

    @EventListener
    public void handle(TodoDeletedEvent event) {
        UUID aggregateId = event.getAggregateId();
        Optional<TodoReadModel> optional = repository.findById(aggregateId);
        if (optional.isPresent()) {
            TodoReadModel readModel = optional.get();
            readModel.setDeleted(true);
            repository.save(readModel);
        }
    }

    @EventListener
    public void handle(TodoUpdateEvent event) {
        UUID aggregateId = event.getAggregateId();
        Optional<TodoReadModel> optional = repository.findById(aggregateId);
        if (optional.isPresent()) {
            TodoReadModel readModel = optional.get();
            readModel.setTitle(event.getTitle());
            readModel.setDescription(event.getDescription());
            repository.save(readModel);
        }
    }
}
