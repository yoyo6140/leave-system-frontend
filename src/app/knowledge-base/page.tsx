"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Edit, Loader2, Plus, RotateCcw, Trash2, X } from "lucide-react";

import { useMounted } from "@/lib/use-mounted";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/app-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateKbDocument,
  useDeleteKbDocument,
  useKbDocumentDetail,
  useKbDocumentsQuery,
  useRetryKbDocument,
  useUpdateKbDocument,
} from "@/features/knowledge-base/hooks";
import type {
  ApiKbDocument,
  KbDocumentStatus,
  KbDocumentType,
} from "@/features/knowledge-base/hooks";

const TYPE_LABEL: Record<KbDocumentType, string> = {
  rule: "公司規章",
  raw: "法條",
  letter: "函文/公文",
};

const STATUS_LABEL: Record<KbDocumentStatus, string> = {
  processing: "處理中",
  ready: "已完成",
  failed: "失敗",
};

// 文件狀態標籤：處理中用 outline、完成用 default、失敗用 destructive
function StatusBadge({ status }: { status: KbDocumentStatus }) {
  if (status === "processing") {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="size-3 animate-spin" />
        {STATUS_LABEL[status]}
      </Badge>
    );
  }
  if (status === "failed") {
    return <Badge variant="destructive">{STATUS_LABEL[status]}</Badge>;
  }
  return <Badge variant="secondary">{STATUS_LABEL[status]}</Badge>;
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
  const mounted = useMounted();
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

interface ItemFormValues {
  title: string;
  content: string;
  type: KbDocumentType;
}

// 新增/編輯共用的表單：標題 + 類型 + 內容，直接貼上整段文字即可，不需要先整理格式
function ItemForm({
  item,
  onSave,
  onCancel,
  submitting,
}: {
  item?: ApiKbDocument | null;
  onSave: (data: ItemFormValues) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [type, setType] = useState<KbDocumentType>(item?.type ?? "rule");

  // 編輯時另外呼叫單一文件 API 取得完整 content 預填；新增時 item 為 undefined，不會發請求
  const { data: detail, isLoading: loadingDetail } = useKbDocumentDetail(
    item?.id,
  );
  // content 是派生狀態：使用者還沒動過就用 detail.content（新增時沒有 detail，就是空字串），
  // 使用者一旦輸入過，draftContent 就不再是 null，之後一律顯示使用者輸入的版本
  const [draftContent, setDraftContent] = useState<string | null>(null);
  const content = draftContent ?? detail?.content ?? "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (!item && !content.trim()) return; // 新增時內容必填，編輯時可留空（不修改）
    onSave({ title: title.trim(), content: content.trim(), type });
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
            類型 <span className="text-destructive">*</span>
          </FieldLabel>
          <Select value={type} onValueChange={(v) => setType(v as KbDocumentType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rule">公司規章</SelectItem>
              <SelectItem value="raw">法條</SelectItem>
              <SelectItem value="letter">函文/公文</SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">
            依類型決定切段方式：公司規章依段落切、法條依「第 X 條」切、函文整篇不切
          </p>
        </Field>
        <Field>
          <FieldLabel>
            內容 {!item && <span className="text-destructive">*</span>}
          </FieldLabel>
          {item && loadingDetail ? (
            <div className="flex h-[calc(12*1.5rem)] items-center justify-center rounded-lg border border-input bg-muted/30 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              載入原始內容中…
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setDraftContent(e.target.value)}
              rows={12}
              placeholder="直接貼上整段內容即可，不需要先整理格式或分段"
              required={!item}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
            />
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onCancel}
            disabled={submitting}
          >
            取消
          </Button>
          <Button
            type="submit"
            className="w-full"
            disabled={submitting || (!!item && loadingDetail)}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : "儲存"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

export default function KnowledgeBasePage() {
  const { data, isLoading, isError } = useKbDocumentsQuery({ limit: 100 });
  const createMutation = useCreateKbDocument();
  const updateMutation = useUpdateKbDocument();
  const deleteMutation = useDeleteKbDocument();
  const retryMutation = useRetryKbDocument();

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiKbDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiKbDocument | null>(null);

  const items = data?.data ?? [];

  function handleAdd(values: ItemFormValues) {
    createMutation.mutate(values, { onSuccess: () => setShowAdd(false) });
  }

  function handleEditSave(values: ItemFormValues) {
    if (!editTarget) return;
    updateMutation.mutate(
      {
        id: editTarget.id,
        input: {
          title: values.title,
          type: values.type,
          // 編輯時內容留空代表不修改，不要把空字串送給後端觸發重新向量化
          ...(values.content ? { content: values.content } : {}),
        },
      },
      { onSuccess: () => setEditTarget(null) },
    );
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  function handleRetry(id: string) {
    retryMutation.mutate(id);
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-2 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">知識庫</h1>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
          <Plus className="size-3.5" />
          新增知識
        </Button>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        貼上規章、法條或函文內容，依類型自動切段並向量化，供 AI 助理檢索使用。新增/修改後狀態會顯示「處理中」，完成後自動變成「已完成」或「失敗」。
      </p>

      {isLoading && (
        <Card
          variant="dashed"
          padding="default"
          className="text-center text-sm text-muted-foreground"
        >
          載入中…
        </Card>
      )}

      {isError && (
        <Card
          variant="dashed"
          padding="default"
          className="text-center text-sm text-destructive"
        >
          載入知識庫列表失敗，請重新整理頁面
        </Card>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <Card
          variant="dashed"
          padding="default"
          className="text-center text-sm text-muted-foreground"
        >
          尚無知識項目，點「新增知識」開始建立
        </Card>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item.id} padding="default">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    <Badge variant="outline">{TYPE_LABEL[item.type]}</Badge>
                    <StatusBadge status={item.status} />
                  </div>
                  {item.status === "failed" && item.error_message && (
                    <p className="mt-1 text-sm text-destructive">
                      {item.error_message}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  {item.status === "failed" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => handleRetry(item.id)}
                      disabled={retryMutation.isPending}
                      title="重新向量化"
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                  )}
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

      {showAdd && (
        <ItemForm
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
          submitting={createMutation.isPending}
        />
      )}
      {editTarget && (
        <ItemForm
          item={editTarget}
          onSave={handleEditSave}
          onCancel={() => setEditTarget(null)}
          submitting={updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="確認刪除？"
        message={`刪除後「${deleteTarget?.title}」的內容將無法復原。`}
        confirmLabel="確認刪除"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
