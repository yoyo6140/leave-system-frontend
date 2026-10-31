"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Portal helper ─────────────────────────────────────────────────────────────

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

// ── Shared shell ──────────────────────────────────────────────────────────────

function Shell({
  onBackdropClick,
  children,
}: {
  onBackdropClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
        onClick={onBackdropClick}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
}

// ── Success Dialog ────────────────────────────────────────────────────────────

export interface SuccessDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
}

// 操作成功後顯示的提示對話框（綠色勾選圖示）
export function SuccessDialog({
  open,
  title = "Success",
  message,
  onClose,
}: SuccessDialogProps) {
  if (!open) return null;
  return (
    <Portal>
      <Shell onBackdropClick={onClose}>
        <div className="mb-5 flex justify-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-green-100 ring-8 ring-green-50">
            <Check className="size-10 text-green-600" strokeWidth={2.5} />
          </div>
        </div>
        <h2 className="mb-1 text-lg font-semibold">{title}</h2>
        {message && (
          <p className="mb-6 text-sm text-muted-foreground">{message}</p>
        )}
        {!message && <div className="mb-6" />}
        <Button variant="success" className="w-full" onClick={onClose}>
          確認
        </Button>
      </Shell>
    </Portal>
  );
}

// ── Alert Dialog ──────────────────────────────────────────────────────────────

export interface AlertDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
}

// 錯誤/警告提示對話框（紅色警告圖示），只有一個「確認」按鈕
export function AlertDialog({
  open,
  title = "Alert",
  message,
  onClose,
}: AlertDialogProps) {
  if (!open) return null;
  return (
    <Portal>
      <Shell onBackdropClick={onClose}>
        <div className="mb-5 flex justify-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-red-100 ring-8 ring-red-50">
            <AlertTriangle className="size-10 text-red-600" strokeWidth={2} />
          </div>
        </div>
        <h2 className="mb-1 text-lg font-semibold">{title}</h2>
        {message && (
          <p className="mb-6 text-sm text-muted-foreground">{message}</p>
        )}
        {!message && <div className="mb-6" />}
        <Button variant="destructive" className="w-full" onClick={onClose}>
          確認
        </Button>
      </Shell>
    </Portal>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  confirmDisabled?: boolean;
  /** 送出中：按鈕顯示 loading 圖示並鎖住，避免使用者不確定有沒有按到、或連點送出兩次 */
  loading?: boolean;
  children?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

// 需要使用者二次確認的對話框（例如刪除、取消申請前跳出）
export function ConfirmDialog({
  open,
  title = "確認",
  message,
  confirmLabel = "確認",
  cancelLabel = "取消",
  variant = "default",
  confirmDisabled = false,
  loading = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <Portal>
      <Shell onBackdropClick={loading ? undefined : onCancel}>
        <h2 className="mb-2 text-lg font-semibold">{title}</h2>
        {message && (
          <p className="mb-6 text-sm text-muted-foreground">{message}</p>
        )}
        {!message && !children && <div className="mb-6" />}
        {children && <div className="mb-6 text-left">{children}</div>}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            className="flex-1"
            onClick={onConfirm}
            disabled={confirmDisabled || loading}
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </Shell>
    </Portal>
  );
}
