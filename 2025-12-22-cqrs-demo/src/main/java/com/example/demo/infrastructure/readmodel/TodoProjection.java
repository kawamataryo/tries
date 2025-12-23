package com.example.demo.infrastructure.readmodel;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.example.demo.domain.events.TodoCompletedEvent;
import com.example.demo.domain.events.TodoCreatedEvent;
import com.example.demo.domain.events.TodoDeletedEvent;

@Component
public class TodoProjection {
    private final TodoReadModelRepository repository;

    public TodoProjection(TodoReadModelRepository repository) {
        this.repository = repository;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
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

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(TodoCompletedEvent event) {
        UUID aggregateId = event.getAggregateId();
        Optional<TodoReadModel> optional = repository.findById(aggregateId);
        if (optional.isPresent()) {
            TodoReadModel readModel = optional.get();
            readModel.setCompleted(true);
            repository.save(readModel);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(TodoDeletedEvent event) {
        UUID aggregateId = event.getAggregateId();
        Optional<TodoReadModel> optional = repository.findById(aggregateId);
        if (optional.isPresent()) {
            TodoReadModel readModel = optional.get();
            readModel.setDeleted(true);
            repository.save(readModel);
        }
    }
}
