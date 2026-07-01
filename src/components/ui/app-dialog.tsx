"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check } from "lucide-react";
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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
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
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = "確認",
  message,
  confirmLabel = "確認",
  cancelLabel = "取消",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <Portal>
      <Shell onBackdropClick={onCancel}>
        <h2 className="mb-2 text-lg font-semibold">{title}</h2>
        {message && (
          <p className="mb-6 text-sm text-muted-foreground">{message}</p>
        )}
        {!message && <div className="mb-6" />}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant} className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </Shell>
    </Portal>
  );
}
