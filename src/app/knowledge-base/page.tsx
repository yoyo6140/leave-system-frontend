"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Edit, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/app-dialog";

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
}

// 彈出視窗外殼（置中 Modal，掛載到 document.body），跟 employees 頁面的 ModalShell 同一套樣式
function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

// 新增/編輯共用的表單：標題 + 內容，直接貼上整段文字即可，不需要先整理格式
function ItemForm({
  item,
  onSave,
  onCancel,
}: {
  item?: KnowledgeItem | null;
  onSave: (data: { title: string; content: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [content, setContent] = useState(item?.content ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSave({ title: title.trim(), content: content.trim() });
  }

  return (
    <ModalShell title={item ? "編輯知識項目" : "新增知識項目"} onClose={onCancel}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field>
          <FieldLabel>
            標題 <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：勞基法 - 特休規則"
            required
          />
        </Field>
        <Field>
          <FieldLabel>
            內容 <span className="text-destructive">*</span>
          </FieldLabel>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            placeholder="直接貼上整段內容即可，不需要先整理格式或分段"
            required
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
            取消
          </Button>
          <Button type="submit" className="w-full">
            儲存
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

// 知識庫：開發中的頁面，先做前端畫面（新增/編輯/刪除），資料目前只存在這次瀏覽的 state，重新整理就會消失。
// 之後會接後端 API：存進資料庫、依內容類型切成 chunk，供 AI 助理檢索用。
// 刻意不放進 Sidebar，只能直接輸入網址 /knowledge-base 進入。
export default function KnowledgeBasePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<KnowledgeItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeItem | null>(null);

  function handleAdd(data: { title: string; content: string }) {
    setItems((prev) => [{ id: crypto.randomUUID(), ...data }, ...prev]);
    setShowAdd(false);
  }

  function handleEditSave(data: { title: string; content: string }) {
    if (!editTarget) return;
    setItems((prev) =>
      prev.map((item) => (item.id === editTarget.id ? { ...item, ...data } : item)),
    );
    setEditTarget(null);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">知識庫</h1>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            開發中
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
          <Plus className="size-3.5" />
          新增知識
        </Button>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        這裡只是先做好的前端畫面，新增/編輯/刪除都還沒有接後端，重新整理頁面資料就會不見。之後接上 API
        後，內容會存進資料庫並自動切成 chunk，供 AI 助理檢索使用。
      </p>

      {items.length === 0 ? (
        <Card
          variant="dashed"
          padding="default"
          className="text-center text-sm text-muted-foreground"
        >
          尚無知識項目，點「新增知識」開始建立
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item.id} padding="default">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {item.content}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setEditTarget(item)}
                    title="編輯"
                  >
                    <Edit className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(item)}
                    title="刪除"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showAdd && <ItemForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />}
      {editTarget && (
        <ItemForm
          item={editTarget}
          onSave={handleEditSave}
          onCancel={() => setEditTarget(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="確認刪除？"
        message={`刪除後「${deleteTarget?.title}」的內容將無法復原。`}
        confirmLabel="確認刪除"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
