# CQRS/ES実装の検証結果

## 概要

このプロジェクトはCQRS（Command Query Responsibility Segregation）とEvent Sourcing（ES）を実装したTODOアプリケーションです。基本的な構造は良好ですが、本格的なCQRS/ESパターンを完全に実現するためには、いくつかの重要な要素が不足しています。

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

## 不足している重要な要素

### 1. **Read Model（読み取りモデル）の欠如** ⚠️ 重要度：高

**現状の問題点:**
- `TodoQueryService`が直接イベントストアからイベントを読み込み、ドメインオブジェクトを再構築している
- これはEvent Sourcingとしては正しいが、CQRSの原則には完全には沿っていない

**CQRSにおける正しいアプローチ:**
```
Command Side: イベントストアに保存
       ↓
   イベント発行
       ↓
Projection/Event Handler: イベントを受け取りRead Modelを更新
       ↓
Query Side: Read Model（最適化された読み取り専用テーブル）から読み取り
```

**推奨される改善:**
- `todo_read_model`テーブルを追加
- イベントハンドラー/プロジェクションでイベントを受け取り、Read Modelを更新
- `TodoQueryService`はRead Modelから読み取るように変更

**実装例:**
```java
// 新規追加: TodoReadModel（エンティティ）
@Entity
@Table(name = "todo_read_model")
public class TodoReadModel {
    @Id
    private UUID id;
    private String title;
    private String description;
    private boolean completed;
    private boolean deleted;
    // ...
}

// 新規追加: イベントハンドラー/プロジェクション
@Component
public class TodoProjection {
    private final TodoReadModelRepository repository;

    @EventListener
    public void handle(TodoCreatedEvent event) {
        TodoReadModel view = new TodoReadModel(event.getAggregateId(), ...);
        repository.save(view);
    }

    @EventListener
    public void handle(TodoCompletedEvent event) {
        TodoReadModel view = repository.findById(event.getAggregateId());
        view.setCompleted(true);
        repository.save(view);
    }
}
```

### 2. **イベント発行メカニズムの欠如** ⚠️ 重要度：高

**現状の問題点:**
- イベントがイベントストアに保存された後、他のコンポーネントに通知されない
- イベントハンドラーがイベントを受け取れない

**推奨される改善:**
- Spring Events (`ApplicationEventPublisher`)を使用
- または、メッセージブローカー（RabbitMQ、Kafka等）を統合
- `JpaEventStore.save()`の後にイベントを発行

**実装例:**
```java
@Component
public class JpaEventStore implements EventStore {
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public void save(List<DomainEvent> events) {
        // イベントストアに保存
        repository.saveAll(entries);

        // イベントを発行（非同期でRead Modelを更新）
        events.forEach(eventPublisher::publishEvent);
    }
}
```

### 3. **オプティミスティックロッキングの欠如** ⚠️ 重要度：中

**現状の問題点:**
- 同じ集約に対して同時に複数のコマンドが実行された場合、競合状態（race condition）が発生する可能性がある
- イベントのバージョン番号は管理されているが、保存時のバージョンチェックがない

**推奨される改善:**
- `EventStore.save()`時に、既存の最新バージョンと比較
- バージョンが一致しない場合は`OptimisticLockingException`をスロー

**実装例:**
```java
@Override
public void save(List<DomainEvent> events) {
    if (events.isEmpty()) return;

    UUID aggregateId = events.get(0).getAggregateId();
    long expectedVersion = events.get(0).getVersion() - 1;

    // 現在の最新バージョンを確認
    long currentVersion = getLatestVersion(aggregateId);
    if (currentVersion != expectedVersion) {
        throw new OptimisticLockingException(
            "Aggregate version mismatch. Expected: " + expectedVersion +
            ", Current: " + currentVersion);
    }

    // イベントを保存
    repository.saveAll(entries);
}
```

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
- 実際には使用されていない

**推奨される改善:**
- これらの不要なファイルを削除

### 6. **未実装の機能** ⚠️ 重要度：中

**現状の問題点:**
- `TodoQueryService.getAllTodos()`が未実装（TODOコメントのみ）

**推奨される改善:**
- Read Modelを実装した後、このメソッドを実装

### 7. **エラーハンドリングの強化** ⚠️ 重要度：中

**現状の問題点:**
- エラーメッセージが不統一（`IllegalArgumentException`を使用）
- カスタム例外クラスがない

**推奨される改善:**
- `TodoNotFoundException`、`TodoAlreadyDeletedException`などのドメイン例外を追加
- グローバル例外ハンドラー（`@ControllerAdvice`）を実装

### 8. **イベントの順序保証** ⚠️ 重要度：低

**現状の問題点:**
- 現状の実装では基本的に問題ないが、非同期処理を導入する場合、イベントの順序保証が必要になる可能性がある

**推奨される改善:**
- イベントIDにシーケンス番号を追加
- または、集約IDごとのパーティションキーを使用

---

## パターンの評価

### Event Sourcingパターン: ⭐⭐⭐⭐☆ (4/5)

**評価理由:**
- イベントの保存・再構築が正しく実装されている
- イベントバージョン管理が実装されている
- ただし、イベント発行とRead Modelが不足している

### CQRSパターン: ⭐⭐⭐☆☆ (3/5)

**評価理由:**
- コマンドとクエリのサービスが分離されている
- しかし、クエリサイドが直接イベントストアから読み込んでいる
- Read Modelが実装されていないため、真のCQRSとは言えない

---

## 推奨される改善の優先順位

### 優先度1（必須）: CQRSを完全に実現
1. Read Modelの実装
2. イベント発行メカニズムの追加
3. プロジェクション/イベントハンドラーの実装

### 優先度2（推奨）: 堅牢性の向上
4. オプティミスティックロッキングの実装
5. エラーハンドリングの改善
6. `getAllTodos()`の実装

### 優先度3（任意）: コード品質
7. テストの修正
8. 不要なファイルの削除
9. ドキュメントの追加

---

## 結論

このプロジェクトは**Event Sourcingの基本実装は良好**ですが、**CQRSの完全な実装にはRead Modelとイベント発行メカニズムが必要**です。

現在の実装では、クエリサイドが直接イベントストアから読み込んでいるため、以下の問題があります：
- 読み取りパフォーマンスが最適化されていない（毎回イベントを再構築）
- 複雑なクエリ（例：`getAllTodos()`）の実装が困難
- クエリサイドとコマンドサイドが完全に独立していない

**模範的なCQRS/ES実装にするには、Read Modelとイベント発行メカニズムの追加が必須**です。

---

## 参考資料

- [Martin Fowler - Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Martin Fowler - CQRS](https://martinfowler.com/bliki/CQRS.html)
- [Microsoft - CQRS pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/cqrs)
