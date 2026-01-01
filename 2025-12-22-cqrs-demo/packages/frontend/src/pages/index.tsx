import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAllTodos,
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
  useCompleteTodo,
  getGetAllTodosQueryKey,
} from "@/orval-generated/openAPIDefinition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { CreateTodoRequest, UpdateTodoRequest } from "@/orval-generated/schemas";

export default function Home() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useGetAllTodos();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  const createTodoMutation = useCreateTodo({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAllTodosQueryKey() });
        setTitle("");
        setDescription("");
        setDueDate("");
      },
    },
  });

  const updateTodoMutation = useUpdateTodo({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAllTodosQueryKey() });
        setEditingId(null);
        setEditTitle("");
        setEditDescription("");
        setEditDueDate("");
      },
    },
  });

  const deleteTodoMutation = useDeleteTodo({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAllTodosQueryKey() });
      },
    },
  });

  const completeTodoMutation = useCompleteTodo({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAllTodosQueryKey() });
      },
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const createRequest: CreateTodoRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
    };
    createTodoMutation.mutate({ data: createRequest });
  };

  const handleStartEdit = (todo: { id?: string; title?: string; description?: string; dueDate?: string }) => {
    if (!todo.id) return;
    setEditingId(todo.id);
    setEditTitle(todo.title || "");
    setEditDescription(todo.description || "");
    setEditDueDate(todo.dueDate || "");
  };

  const handleSaveEdit = (id: string) => {
    const updateRequest: UpdateTodoRequest = {
      title: editTitle.trim() || undefined,
      description: editDescription.trim() || undefined,
      dueDate: editDueDate || undefined,
    };
    updateTodoMutation.mutate({ id, data: updateRequest });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditDueDate("");
  };

  const handleDelete = (id: string) => {
    if (confirm("このTODOを削除しますか？")) {
      deleteTodoMutation.mutate({ id });
    }
  };

  const handleToggleComplete = (id: string) => {
    completeTodoMutation.mutate({ id });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-screen">
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>エラー</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">
                {error instanceof Error ? error.message : "不明なエラーが発生しました"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const todos = data?.data || [];

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">TODOアプリ</h1>
        <p className="text-muted-foreground">タスクを管理しましょう</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>新しいTODOを追加</CardTitle>
          <CardDescription>タイトルと説明を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="タイトル"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="text"
                placeholder="説明（任意）"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder="完了予定日（任意）"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={createTodoMutation.isPending}>
              {createTodoMutation.isPending ? "追加中..." : "追加"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {todos.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">TODOがありません</p>
            </CardContent>
          </Card>
        ) : (
          todos.map((todo) => (
            <Card key={todo.id} className={todo.completed ? "opacity-60" : ""}>
              <CardContent className="pt-6">
                {editingId === todo.id ? (
                  <div className="space-y-4">
                    <Input
                      type="text"
                      placeholder="タイトル"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <Input
                      type="text"
                      placeholder="説明"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                    <Input
                      type="date"
                      placeholder="完了予定日（任意）"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => todo.id && handleSaveEdit(todo.id)}
                        disabled={updateTodoMutation.isPending}
                        size="sm"
                      >
                        保存
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        size="sm"
                        disabled={updateTodoMutation.isPending}
                      >
                        キャンセル
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => todo.id && handleToggleComplete(todo.id)}
                      disabled={completeTodoMutation.isPending}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h3
                        className={`font-semibold text-lg ${
                          todo.completed ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {todo.title || "（タイトルなし）"}
                      </h3>
                      {todo.description && (
                        <p
                          className={`text-sm text-muted-foreground mt-1 ${
                            todo.completed ? "line-through" : ""
                          }`}
                        >
                          {todo.description}
                        </p>
                      )}
                      {todo.dueDate && (
                        <p
                          className={`text-xs text-muted-foreground mt-1 ${
                            todo.completed ? "line-through" : ""
                          }`}
                        >
                          完了予定日: {new Date(todo.dueDate).toLocaleDateString("ja-JP")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleStartEdit(todo)}
                        variant="outline"
                        size="sm"
                      >
                        編集
                      </Button>
                      <Button
                        onClick={() => todo.id && handleDelete(todo.id)}
                        variant="destructive"
                        size="sm"
                        disabled={deleteTodoMutation.isPending}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
