"use client";

import { useEffect } from "react";
import { Trash2, Loader2, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Reusable Minimal Clean Delete Confirmation Modal
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {() => void} props.onClose - Triggered on backdrop click, cancel button, or ESC key
 * @param {() => void} props.onConfirm - Triggered on delete button
 * @param {string} props.title - Modal title
 * @param {string} [props.description] - Description / warning message
 * @param {string} [props.cancelText] - Label for cancel button
 * @param {string} [props.confirmText] - Label for confirm button
 * @param {boolean} [props.isLoading=false] - Disables buttons and shows spinner
 */
export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  message,
  cancelText,
  confirmText,
  isLoading = false,
  loading = false,
  zIndex = "z-[60]",
}) {
  const { t } = useLanguage();
  const effectiveLoading = isLoading || loading;
  const effectiveDescription = description || message;

  // Close on ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !effectiveLoading) {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, effectiveLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndex} bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150`}
      onClick={() => {
        if (!isLoading) onClose?.();
      }}
    >
      <div
        className="bg-surface border border-border rounded-[14px] shadow-lg w-full max-w-sm p-5 sm:p-6 flex flex-col items-center text-center animate-in fade-in zoom-in-98 duration-150 relative overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (Top-Right) */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-3.5 right-3.5 size-7 rounded-[6px] text-muted-foreground/70 hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          title="Close (ESC)"
        >
          <X size={15} />
        </button>

        {/* Minimal Clean Icon Badge */}
        <div className="w-11 h-11 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center mb-3 shadow-2xs">
          <Trash2 size={20} strokeWidth={2} />
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5 max-w-[280px]">
          <h3 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
            {title || t('actions.delete') || "Delete?"}
          </h3>
          {effectiveDescription && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {effectiveDescription}
            </p>
          )}
        </div>

        {/* Minimal Clean Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-4 w-full border-t border-border/80 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={effectiveLoading}
            className="w-full h-9 px-3 rounded-[8px] border border-border bg-surface hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText || t('actions.cancel') || "Cancel"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={effectiveLoading}
            className="w-full h-9 px-3 rounded-[8px] bg-red-600 hover:bg-red-700 active:bg-red-800 text-xs font-medium text-white transition-colors shadow-2xs cursor-pointer inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {effectiveLoading && <Loader2 size={13} className="animate-spin" />}
            <span>{confirmText || t('actions.delete') || "Delete"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
