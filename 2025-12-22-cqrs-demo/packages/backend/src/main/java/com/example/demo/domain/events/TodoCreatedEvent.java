package com.example.demo.domain.events;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class TodoCreatedEvent extends DomainEvent {
    private final String title;
    private final String description;
    private final LocalDate dueDate;

    public TodoCreatedEvent(UUID todoId, String title, String description, LocalDate dueDate, Long version) {
        super(todoId, version);
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
    }

    @JsonCreator
    public TodoCreatedEvent(
            @JsonProperty("eventId") UUID eventId,
            @JsonProperty("aggregateId") UUID aggregateId,
            @JsonProperty("occurredAt") Instant occurredAt,
            @JsonProperty("version") long version,
            @JsonProperty("title") String title,
            @JsonProperty("description") String description,
            @JsonProperty(value = "dueDate", required = false) LocalDate dueDate) {
        super(eventId, aggregateId, occurredAt, version);
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }
}
