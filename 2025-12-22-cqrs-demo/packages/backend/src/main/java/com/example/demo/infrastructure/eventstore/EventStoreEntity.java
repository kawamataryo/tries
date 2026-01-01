package com.example.demo.infrastructure.eventstore;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.*;

@Entity
@Table(name = "event_store", indexes = @Index(name = "idx_aggregate_id", columnList = "aggregateId"))
public class EventStoreEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 36)
    private UUID aggregateId;

    @Column(nullable = false)
    private String eventType;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String eventData;

    @Column(nullable = false)
    private long version;

    @Column(nullable = false)
    private Instant occurredAt;
    
    protected EventStoreEntity() {}

    public EventStoreEntity(UUID aggregateId, String eventType, String eventData, long version, Instant occurredAt) {
        this.aggregateId = aggregateId;
        this.eventType = eventType;
        this.eventData = eventData;
        this.version = version;
        this.occurredAt = occurredAt;
    }

    public Long getId() {
        return id;
    }

    public UUID getAggregateId() {
        return aggregateId;
    }
    
    public String getEventType() {
        return eventType;
    }

    public String getEventData() {
        return eventData;
    }

    public long getVersion() {
        return version;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setAggregateId(UUID aggregateId) {
        this.aggregateId = aggregateId;
    }
    
    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public void setEventData(String eventData) {
        this.eventData = eventData;
    }

    public void setVersion(long version) {
        this.version = version;
    }

    public void setOccurredAt(Instant occurredAt) {
        this.occurredAt = occurredAt;
    }
}
