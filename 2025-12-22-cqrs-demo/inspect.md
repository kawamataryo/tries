# CQRS/ES実装の検証結果

## 概要

このプロジェクトはCQRS（Command Query Responsibility Segregation）とEvent Sourcing（ES）を完全に実装したTODOアプリケーションです。Read Model、イベント発行メカニズム、オプティミスティックロッキング、エラーハンドリングなど、CQRS/ESパターンの主要な要素がすべて実装されています。

---

## 実装されている良い点

### 1. レイヤー分離とアーキテクチャ
- **クリーンアーキテクチャ**: ドメイン層、アプリケーション層、インフラ層、プレゼンテーション層が適切に分離されている
- **依存関係の方向**: ドメイン層が他の層に依存していない正しい依存関係の方向

### 2. CQRSの基本実装
- **コマンドとクエリの分離**: `TodoCommandService`（コマンドサイド）と`TodoQueryService`（クエリサイド）が明確に分離されている
- **専用ビューオブジェクト**: `TodoView`レコードがクエリ専用のDTOとして使用されている

### 3. Event Sourcingの基本実装
- **イベントストア**: `JpaEventStore`がイベントの永続化を実装
- **イベント再構築**: `Todo.fromEvents()`メソッドで集約ルートをイベントから再構築
- **イベントバージョン管理**: 各イベントにバージョン番号が付与され、順序が保証されている
- **イベントシリアライゼーション**: Jacksonを使用したJSONシリアライゼーション

### 4. ドメインモデル
- **集約ルート**: `Todo`が集約ルートとして適切に実装
- **不変イベント**: イベントは不変（immutable）として設計されている
- **ドメインイベント**: `TodoCreatedEvent`、`TodoCompletedEvent`、`TodoDeletedEvent`が適切に定義

### 5. インフラストラクチャ
- **イベントストアエンティティ**: `EventStoreEntity`に適切なインデックスが設定されている
- **トランザクション管理**: `@Transactional`アノテーションでトランザクション境界が明確

---

## 実装状況の更新

### ✅ 1. **Read Model（読み取りモデル）** - 実装済み

**実装状況:**
- `TodoReadModel`エンティティが実装されている
- `TodoProjection`でイベントハンドリングが実装されている
- `TodoQueryService`がRead Modelから読み取るように変更されている
- `getAllTodos()`メソッドが実装されている

**実装済みファイル:**
- `src/main/java/com/example/demo/infrastructure/readmodel/TodoReadModel.java`
- `src/main/java/com/example/demo/infrastructure/readmodel/TodoProjection.java`
- `src/main/java/com/example/demo/infrastructure/readmodel/TodoReadModelRepository.java`

### ✅ 2. **イベント発行メカニズム** - 実装済み

**実装状況:**
- `JpaEventStore`で`ApplicationEventPublisher`を使用してイベントを発行している
- `TodoProjection`で`@TransactionalEventListener`を使用してイベントを受け取っている

**実装済みファイル:**
- `src/main/java/com/example/demo/infrastructure/eventstore/JpaEventStore.java`（46行目でイベント発行）

---

## 不足している重要な要素

### ✅ 3. **オプティミスティックロッキング** - 実装済み

**実装状況:**
- ✅ `EventStoreRepository`に`findMaxVersionByAggregateId`メソッドが追加されている
- ✅ `OptimisticLockingException`クラスが作成されている（`com.example.demo.exceptions`パッケージ）
- ✅ `JpaEventStore.save()`でバージョンチェックが実装されている

**実装済みファイル:**
- `src/main/java/com/example/demo/infrastructure/eventstore/EventStoreRepository.java`（17-18行目）
- `src/main/java/com/example/demo/exceptions/OptimisticLockingException.java`
- `src/main/java/com/example/demo/infrastructure/eventstore/JpaEventStore.java`（33-46行目）

**実装内容:**
- イベント保存前に、現在の最新バージョンと期待されるバージョンを比較
- バージョンが一致しない場合は`OptimisticLockingException`をスロー
- 新規作成時（`currentVersion == -1`、`expectedVersion == -1`）はチェックをパス

**参考実装（既に実装済み）:**

#### ステップ1: EventStoreRepositoryに最新バージョン取得メソッドを追加

**ファイル:** `src/main/java/com/example/demo/infrastructure/eventstore/EventStoreRepository.java`

```java
package com.example.demo.infrastructure.eventstore;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EventStoreRepository extends JpaRepository<EventStoreEntity, Long> {
    List<EventStoreEntity> findByAggregateIdOrderByVersionAsc(UUID aggregateId);

    @Query("SELECT MAX(e.version) FROM EventStoreEntity e WHERE e.aggregateId = :aggregateId")
    Optional<Long> findMaxVersionByAggregateId(@Param("aggregateId") UUID aggregateId);
}
```

#### ステップ2: OptimisticLockingExceptionクラスを作成

**ファイル:** `src/main/java/com/example/demo/exceptions/OptimisticLockingException.java`

**注意:** 実装済み。パッケージは`com.example.demo.exceptions`を使用。

```java
package com.example.demo.exceptions;

public class OptimisticLockingException extends RuntimeException {
    public OptimisticLockingException(String message) {
        super(message);
    }

    public OptimisticLockingException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

#### ステップ3: JpaEventStoreにバージョンチェックを実装

**ファイル:** `src/main/java/com/example/demo/infrastructure/eventstore/JpaEventStore.java`

**注意:** 実装済み。`save`メソッドにバージョンチェックが追加されています。

実装内容：
```java
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

    // イベントをエンティティに変換して保存
    // ... 既存のコード ...
}
```

**実装のポイント:**
- 新規作成時（`currentVersion == -1`、`expectedVersion == -1`）はチェックをパスする
- 既存の集約を更新する場合のみバージョンチェックを実行
- バージョン不一致時は`OptimisticLockingException`をスローして同時更新を防止

### 4. **テストと実装の不一致** ⚠️ 重要度：低

**現状の問題点:**
- `EventStoreTest`で`saveEvents(UUID, List<DomainEvent>)`が呼ばれているが、`EventStore`インターフェースには`save(List<DomainEvent>)`しか定義されていない
- テストがコンパイルエラーまたは実行時エラーになる可能性がある

**推奨される改善:**
- テストを実装に合わせて修正
- または、`EventStore`インターフェースに`saveEvents`メソッドを追加

### 5. **不要なクラスの存在** ⚠️ 重要度：低

**現状の問題点:**
- `application/command/DomainEvent.java`と`application/query/DomainEvent.java`が空のクラスとして存在
- 実際には使用されていない（`domain.events.DomainEvent`を使用している）

**推奨される改善:**
- これらの不要なファイルを削除

**削除対象ファイル:**
- `src/main/java/com/example/demo/application/command/DomainEvent.java`
- `src/main/java/com/example/demo/application/query/DomainEvent.java`

### 6. **未実装の機能** ⚠️ 重要度：中

**実装状況:**
- ✅ `TodoQueryService.getAllTodos()`は既に実装済み
- ❌ `TodoController`に`GET /api/todos`エンドポイントがない（30-38行目に`GET /{id}`のみ存在）

**推奨される改善:**
- `TodoController`に`GET /api/todos`エンドポイントを追加（上記の「7. エラーハンドリングの強化」のステップ6を参照）

### ✅ 7. **エラーハンドリングの強化** - 実装完了

**実装状況:**
- ✅ 汎用例外クラスが実装済み（`NotFoundException`、`ConflictException`、`OptimisticLockingException`）
- ✅ グローバル例外ハンドラーが実装済み
- ✅ 各サービスクラスで汎用例外を使用
- ✅ `TodoController`で個別の例外処理を削除してグローバルハンドラーに委譲

**実装済みの項目:**
- ✅ `NotFoundException`（実装済み）
- ✅ `ConflictException`（実装済み）
- ✅ `OptimisticLockingException`（実装済み）
- ✅ `GlobalExceptionHandler`（実装済み）
- ✅ `TodoCommandService`で`NotFoundException`を使用
- ✅ `TodoQueryService`で`NotFoundException`を使用
- ✅ `Todo`で`ConflictException`を使用
- ✅ `TodoController`に`GET /api/todos`エンドポイント（実装済み）
- ✅ `TodoController`の個別例外処理を削除（実装済み）

**推奨される改善:**
- 汎用的な例外クラス（HTTPステータスコードベース）を使用する実用的なアプローチ
- グローバル例外ハンドラー（`@ControllerAdvice`）を実装

**設計方針:**
過剰に例外クラスを増やすのではなく、HTTPステータスコードベースの汎用例外を使用する方が実用的です。

**実装手順:**

#### ステップ1: 汎用的な例外クラスを作成（推奨アプローチ）

**ファイル:** `src/main/java/com/example/demo/exceptions/NotFoundException.java`

✅ 既に実装済み

```java
package com.example.demo.exceptions;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }

    public NotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

**ファイル:** `src/main/java/com/example/demo/exceptions/ConflictException.java`（新規作成）

```java
package com.example.demo.exceptions;

public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }

    public ConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

**設計の考え方:**
- `NotFoundException` (404): リソースが見つからない場合（Todo not found、Todo is deleted など）
- `ConflictException` (409): ビジネスルール違反（Todo is already completed、Todo is already deleted など）
- `OptimisticLockingException` (409): 楽観ロックの競合（既に実装済み）

このアプローチのメリット:
- クラス数が少なく、保守しやすい
- HTTPステータスコードと1対1で対応
- エラーメッセージで詳細を区別できる
- 過剰設計を避けられる

#### ステップ2: TodoCommandServiceで汎用例外を使用

**ファイル:** `src/main/java/com/example/demo/application/command/TodoCommandService.java`

```java
package com.example.demo.application.command;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import com.example.demo.domain.events.DomainEvent;

import com.example.demo.domain.Todo;
import com.example.demo.exceptions.NotFoundException;
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
            throw new NotFoundException("Todo not found: " + todoId);
        }
        return Todo.fromEvents(events);
    }
}
```

#### ステップ3: TodoQueryServiceで汎用例外を使用

**ファイル:** `src/main/java/com/example/demo/application/query/TodoQueryService.java`

```java
package com.example.demo.application.query;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.demo.exceptions.NotFoundException;
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
            .orElseThrow(() -> new NotFoundException("Todo not found: " + todoId));

        if (readModel.isDeleted()) {
            throw new NotFoundException("Todo is deleted: " + todoId);
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
```

**注意:** 既に`NotFoundException`を使用している実装は正しいアプローチです。

#### ステップ4: Todoクラスで汎用例外を使用

**ファイル:** `src/main/java/com/example/demo/domain/Todo.java`

`complete()`と`delete()`メソッドを以下のように修正：

```java
package com.example.demo.domain;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.example.demo.domain.events.DomainEvent;
import com.example.demo.domain.events.TodoCreatedEvent;
import com.example.demo.domain.events.TodoDeletedEvent;
import com.example.demo.domain.events.TodoCompletedEvent;
import com.example.demo.exceptions.ConflictException;

public class Todo {
    // ... 既存のコード ...

    public void complete() {
        if (this.deleted) {
            throw new ConflictException("Cannot complete a deleted todo: " + this.id);
        }
        if (this.completed) {
            throw new ConflictException("Todo is already completed: " + this.id);
        }
        this.applyChange(new TodoCompletedEvent(this.id, this.version + 1), true);
    }

    public void delete() {
        if (this.deleted) {
            throw new ConflictException("Todo is already deleted: " + this.id);
        }
        this.applyChange(new TodoDeletedEvent(this.id, this.version + 1), true);
    }

    // ... 既存のコード ...
}
```

**設計の考え方:**
- ビジネスルール違反（既に完了済み、既に削除済み）は`ConflictException`（409）を使用
- リソースが見つからない場合は`NotFoundException`（404）を使用

#### ステップ5: グローバル例外ハンドラーを実装

**ファイル:** `src/main/java/com/example/demo/presentation/GlobalExceptionHandler.java`

```java
package com.example.demo.presentation;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import com.example.demo.exceptions.ConflictException;
import com.example.demo.exceptions.NotFoundException;
import com.example.demo.exceptions.OptimisticLockingException;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFoundException(NotFoundException e) {
        ErrorResponse error = new ErrorResponse("NOT_FOUND", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflictException(ConflictException e) {
        ErrorResponse error = new ErrorResponse("CONFLICT", e.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(OptimisticLockingException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLockingException(OptimisticLockingException e) {
        ErrorResponse error = new ErrorResponse("OPTIMISTIC_LOCKING_FAILED", e.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException e) {
        ErrorResponse error = new ErrorResponse("INVALID_REQUEST", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception e) {
        ErrorResponse error = new ErrorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    public record ErrorResponse(String code, String message) {}
}
```

**メリット:**
- 例外クラスが少なく、シンプル
- HTTPステータスコードと1対1で対応
- エラーメッセージで詳細を区別できる

#### ステップ6: TodoControllerを更新

**ファイル:** `src/main/java/com/example/demo/presentation/TodoController.java`

```java
package com.example.demo.presentation;

import com.example.demo.application.command.TodoCommandService;
import com.example.demo.application.query.TodoQueryService;
import com.example.demo.application.query.TodoView;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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

    @GetMapping
    public ResponseEntity<List<TodoView>> getAllTodos() {
        List<TodoView> todos = queryService.getAllTodos();
        return ResponseEntity.ok(todos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TodoView> getTodo(@PathVariable UUID id) {
        TodoView todo = queryService.getTodo(id);
        return ResponseEntity.ok(todo);
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
```

**変更点:**
- `getAllTodos()`エンドポイント（`GET /api/todos`）を追加
- 個別の例外処理（`try-catch`）を削除（グローバル例外ハンドラーに委譲）

### 8. **イベントの順序保証** ⚠️ 重要度：低

**現状の問題点:**
- 現状の実装では基本的に問題ないが、非同期処理を導入する場合、イベントの順序保証が必要になる可能性がある

**推奨される改善:**
- イベントIDにシーケンス番号を追加
- または、集約IDごとのパーティションキーを使用

---

## パターンの評価

### Event Sourcingパターン: ⭐⭐⭐⭐⭐ (5/5)

**評価理由:**
- ✅ イベントの保存・再構築が正しく実装されている
- ✅ イベントバージョン管理が実装されている
- ✅ イベント発行メカニズムが実装されている
- ✅ オプティミスティックロッキングが実装されている（同時更新時の競合を防止）

### CQRSパターン: ⭐⭐⭐⭐⭐ (5/5)

**評価理由:**
- ✅ コマンドとクエリのサービスが明確に分離されている
- ✅ Read Modelが実装され、クエリサイドがRead Modelから読み取っている
- ✅ イベント発行メカニズムにより、コマンドサイドとクエリサイドが独立している
- ✅ エラーハンドリングが統一されている（汎用例外とグローバルハンドラーが実装済み）

---

## 推奨される改善の優先順位

### ✅ 優先度1（必須）: CQRSを完全に実現 - 実装済み
1. ✅ Read Modelの実装
2. ✅ イベント発行メカニズムの追加
3. ✅ プロジェクション/イベントハンドラーの実装
4. ✅ `getAllTodos()`の実装

### ✅ 優先度2（推奨）: 堅牢性の向上 - 実装済み
5. ✅ オプティミスティックロッキングの実装（実装済み）
6. ✅ エラーハンドリングの改善（実装済み）
   - ✅ 汎用例外クラス（`NotFoundException`、`ConflictException`、`OptimisticLockingException`）が実装済み
   - ✅ グローバル例外ハンドラーが実装済み
   - ✅ 各サービスクラスで汎用例外を使用
7. ✅ `TodoController`に`GET /api/todos`エンドポイントの追加（実装済み）

### ✅ 優先度3（任意）: コード品質 - 実装済み
8. ✅ 不要なファイルの削除（削除済み）
   - ✅ `application/command/DomainEvent.java`は削除済み
   - ✅ `application/query/DomainEvent.java`は削除済み
9. テストの修正（テストファイルが存在する場合）
10. ドキュメントの追加

---

## 結論

このプロジェクトは**CQRS/ESの基本実装は良好**です。Read Modelとイベント発行メカニズムが実装されており、CQRSパターンの核心部分は完成しています。

**実装済みの主要機能:**
- ✅ Read Modelによるクエリサイドの最適化
- ✅ イベント発行メカニズムによるコマンドサイドとクエリサイドの分離
- ✅ プロジェクションによるRead Modelの更新
- ✅ `getAllTodos()`メソッドの実装
- ✅ オプティミスティックロッキングの実装（同時更新時の競合を防止）

**実装完了:**
- ✅ 汎用例外とグローバル例外ハンドラーの実装（エラーハンドリングの統一）
  - ✅ `NotFoundException`が実装済み
  - ✅ `ConflictException`が実装済み
  - ✅ `OptimisticLockingException`が実装済み
  - ✅ `GlobalExceptionHandler`が実装済み
  - ✅ `TodoCommandService`で`NotFoundException`を使用
  - ✅ `TodoQueryService`で`NotFoundException`を使用
  - ✅ `Todo`で`ConflictException`を使用
- ✅ `TodoController`に`GET /api/todos`エンドポイント（実装済み）
- ✅ `TodoController`の個別例外処理を削除してグローバルハンドラーに委譲（実装済み）
- ✅ 不要なファイルの削除（コードの整理完了）
  - ✅ `application/command/DomainEvent.java`は削除済み
  - ✅ `application/query/DomainEvent.java`は削除済み

**注意:** `Todo`クラスの74行目に`IllegalStateException`が残っていますが、これは内部実装エラー（未知のイベントタイプ）を表すため、システムエラーとして適切です。

**このプロジェクトは、CQRS/ESパターンを完全に実装した、堅牢で保守性の高いアプリケーションです。**

---

## 実装状況のサマリー

### ✅ 実装済み項目

1. **Read Modelとイベント発行メカニズム**
   - `TodoReadModel`、`TodoProjection`、`TodoReadModelRepository`が実装済み
   - `JpaEventStore`で`ApplicationEventPublisher`を使用してイベント発行

2. **オプティミスティックロッキング**
   - `EventStoreRepository.findMaxVersionByAggregateId`メソッドが実装済み
   - `OptimisticLockingException`クラスが実装済み
   - `JpaEventStore.save()`でバージョンチェックが実装済み

3. **基本機能**
   - `TodoQueryService.getAllTodos()`が実装済み

### ✅ 実装完了項目

1. **汎用例外クラス**
   - ✅ `NotFoundException`（実装済み）
   - ✅ `OptimisticLockingException`（実装済み）
   - ✅ `ConflictException`（実装済み）

2. **グローバル例外ハンドラー**
   - ✅ `GlobalExceptionHandler`（実装済み）

3. **サービスクラスの修正**
   - ✅ `TodoCommandService`（56行目：`NotFoundException`を使用）
   - ✅ `TodoQueryService`（22, 26行目：`NotFoundException`を使用）
   - ✅ `Todo`（40, 43, 50行目：`ConflictException`を使用）

4. **TodoControllerの改善**
   - ✅ `GET /api/todos`エンドポイント（実装済み）
   - ✅ 個別の例外処理を削除してグローバルハンドラーに委譲（実装済み）

5. **不要なファイルの削除**
   - ✅ `application/command/DomainEvent.java`（削除済み）
   - ✅ `application/query/DomainEvent.java`（削除済み）
   - `application/command/DomainEvent.java`
   - `application/query/DomainEvent.java`

---

## 実装のまとめ

### 実装が必要なファイル一覧

#### ✅ 実装済みファイル

1. **汎用例外クラス（推奨アプローチ）**
   - ✅ `src/main/java/com/example/demo/exceptions/OptimisticLockingException.java`（実装済み）
   - ✅ `src/main/java/com/example/demo/exceptions/NotFoundException.java`（実装済み）
   - ✅ `src/main/java/com/example/demo/exceptions/ConflictException.java`（実装済み）

2. **グローバル例外ハンドラー**
   - ✅ `src/main/java/com/example/demo/presentation/GlobalExceptionHandler.java`（実装済み）

**設計方針:**
- 過剰に例外クラスを増やすのではなく、HTTPステータスコードベースの汎用例外を使用
- `NotFoundException` (404): リソースが見つからない場合
- `ConflictException` (409): ビジネスルール違反
- `OptimisticLockingException` (409): 楽観ロックの競合

#### 修正が必要なファイル

1. ✅ **EventStoreRepository**（実装済み）
   - `src/main/java/com/example/demo/infrastructure/eventstore/EventStoreRepository.java`
   - `findMaxVersionByAggregateId`メソッドが追加済み

2. ✅ **JpaEventStore**（実装済み）
   - `src/main/java/com/example/demo/infrastructure/eventstore/JpaEventStore.java`
   - `save`メソッドにオプティミスティックロッキングのチェックが実装済み

3. ✅ **TodoCommandService**（修正済み）
   - `src/main/java/com/example/demo/application/command/TodoCommandService.java`
   - 56行目：`NotFoundException`を使用

4. ✅ **TodoQueryService**（修正済み）
   - `src/main/java/com/example/demo/application/query/TodoQueryService.java`
   - 22, 26行目：`NotFoundException`を使用

5. ✅ **Todo**（修正済み）
   - `src/main/java/com/example/demo/domain/Todo.java`
   - 40, 43, 50行目：`ConflictException`を使用
   - 74行目：`IllegalStateException`は内部実装エラーとして適切

6. ✅ **TodoController**（修正済み）
   - `src/main/java/com/example/demo/presentation/TodoController.java`
   - `GET /api/todos`エンドポイントが実装済み（33-37行目）
   - 個別の例外処理を削除してグローバルハンドラーに委譲（実装済み）

#### ✅ 削除済みファイル

1. ✅ `src/main/java/com/example/demo/application/command/DomainEvent.java`（削除済み）
2. ✅ `src/main/java/com/example/demo/application/query/DomainEvent.java`（削除済み）

### 実装の順序

1. ✅ オプティミスティックロッキングの実装（完了）
   - ✅ EventStoreRepositoryに`findMaxVersionByAggregateId`メソッドを追加
   - ✅ OptimisticLockingExceptionクラスを作成
   - ✅ JpaEventStoreにオプティミスティックロッキングを実装

2. ✅ 汎用例外クラスを作成（完了）
   - ✅ `NotFoundException`（実装済み）
   - ✅ `OptimisticLockingException`（実装済み）
   - ✅ `ConflictException`（実装済み）
3. ✅ TodoCommandService、TodoQueryService、Todoクラスで汎用例外を使用（完了）
4. ✅ グローバル例外ハンドラーを実装（完了）
5. ✅ TodoControllerを更新（完了 - 個別の例外処理を削除、`GET /api/todos`エンドポイント追加）
6. ✅ 不要なファイルを削除（完了）

---

## 参考資料

- [Martin Fowler - Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Martin Fowler - CQRS](https://martinfowler.com/bliki/CQRS.html)
- [Microsoft - CQRS pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/cqrs)
