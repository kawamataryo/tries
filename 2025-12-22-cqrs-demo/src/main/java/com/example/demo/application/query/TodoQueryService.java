package com.example.demo.application.query;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.demo.infrastructure.readmodel.TodoReadModel;
import com.example.demo.infrastructure.readmodel.TodoReadModelRepository;

@Service
public class TodoQueryService {
    private final TodoReadModelRepository readModelRepository;

    public TodoQueryService(TodoReadModelRepository readModelRepository) {
        this.readModelRepository = readModelRepository;
    }

    public TodoView getTodo(UUID todoId) {
        TodoReadModel readModel = readModelRepository.findById(todoId)
            .orElseThrow(() -> new IllegalArgumentException("Todo not found: " + todoId));

        if (readModel.isDeleted()) {
            throw new IllegalArgumentException("Todo is deleted: " + todoId);
        }

        return new TodoView(
            readModel.getId(),
            readModel.getTitle(),
            readModel.getDescription(),
            readModel.isCompleted()
        );
    }

    public List<TodoView> getAllTodos() {
        return readModelRepository.findByDeletedFalse().stream()
            .map(readModel -> new TodoView(
                readModel.getId(),
                readModel.getTitle(),
                readModel.getDescription(),
                readModel.isCompleted()
            ))
            .collect(Collectors.toList());
    }
}
