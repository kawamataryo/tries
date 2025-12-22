package com.example.demo.domain.events;

import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

// イベントの基底クラス
public abstract class DomainEvent {
    private final UUID eventId;
    private final UUID aggregateId;
    private final Instant occurredAt;
    private final long version;

    protected DomainEvent(UUID aggregateId, long version) {
        this.aggregateId = aggregateId;
        this.version = version;
        this.eventId = UUID.randomUUID();
        this.occurredAt = Instant.now();
    }

    // Jackson用のコンストラクタ
    protected DomainEvent(
            @JsonProperty("eventId") UUID eventId,
            @JsonProperty("aggregateId") UUID aggregateId,
            @JsonProperty("occurredAt") Instant occurredAt,
            @JsonProperty("version") long version) {
        this.eventId = eventId;
        this.aggregateId = aggregateId;
        this.occurredAt = occurredAt;
        this.version = version;
    }

    public UUID getEventId() {
        return eventId;
    }

    public UUID getAggregateId() {
        return aggregateId;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }

    public long getVersion() {
        return version;
    }
}
