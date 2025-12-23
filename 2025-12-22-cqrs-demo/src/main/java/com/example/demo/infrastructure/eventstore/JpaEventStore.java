package com.example.demo.infrastructure.eventstore;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import com.example.demo.domain.events.DomainEvent;
import com.example.demo.exceptions.OptimisticLockingException;
import com.fasterxml.jackson.databind.ObjectMapper;


@Component
public class JpaEventStore implements EventStore {
    private final EventStoreRepository repository;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    public JpaEventStore(EventStoreRepository repository, ObjectMapper objectMapper, ApplicationEventPublisher eventPublisher) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public void save(List<DomainEvent> events) {
        if (events.isEmpty()) {
            return;
        }

        // オプティミスティックロッキングのチェック
        UUID aggregateId = events.get(0).getAggregateId();
        long expectedVersion = events.get(0).getVersion() - 1;

        // 現在の最新バージョンを確認
        // もし存在しない場合（新規）は-1を返す。expectedVersionも-1になるのでチェックが通る。
        long currentVersion = repository.findMaxVersionByAggregateId(aggregateId)
            .orElse(-1L);

        if (currentVersion != expectedVersion) {
            throw new OptimisticLockingException(
                String.format("Aggregate version mismatch. AggregateId: %s, Expected version: %d, Current version: %d",
                    aggregateId, expectedVersion, currentVersion));
        }

        List<EventStoreEntity> entries = events.stream()
            .map(event -> {
                try {
                    String eventData = objectMapper.writeValueAsString(event);
                    return new EventStoreEntity(
                        event.getAggregateId(),
                        event.getClass().getName(),
                        eventData,
                        event.getVersion(),
                        event.getOccurredAt());
                } catch (Exception e) {
                    throw new RuntimeException("Failed to serialize event", e);
                }
            })
            .collect(Collectors.toList());
        repository.saveAll(entries);

        // イベントを発行（Read Modelを更新するため）
        events.forEach(eventPublisher::publishEvent);
    }

    @Override
    public List<DomainEvent> getEvents(UUID aggregateId) {
        List<EventStoreEntity> entries = repository.findByAggregateIdOrderByVersionAsc(aggregateId);
        return entries.stream()
            .map(entry -> {
                try {
                    Class<? extends DomainEvent> eventClass = getEventClass(entry.getEventType());
                    return objectMapper.readValue(entry.getEventData(), eventClass);
                } catch (Exception e) {
                    throw new RuntimeException("Failed to deserialize event", e);
                }
            })
            .collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    private Class<? extends DomainEvent> getEventClass(String eventType) {
        try {
            return (Class<? extends DomainEvent>) Class.forName(eventType);
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("Event class not found: " + eventType, e);
        }
    }
}
