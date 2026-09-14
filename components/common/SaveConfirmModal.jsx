"use client";

import { useEffect } from "react";
import { Save, CheckCircle2, Loader2, X, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Reusable Minimal Clean Save Confirmation & Success Modal
 * Follows exact design language and proportions of DeleteConfirmModal
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {() => void} props.onClose - Triggered on backdrop click, cancel button, or ESC key
 * @param {() => void} props.onConfirm - Triggered on save/confirm button
 * @param {string} [props.title] - Modal title
 * @param {string} [props.description] - Description / helper message
 * @param {string} [props.cancelText] - Label for cancel button
 * @param {string} [props.confirmText] - Label for confirm button
 * @param {boolean} [props.isLoading=false] - Disables buttons and shows spinner
 * @param {boolean} [props.isSuccess=false] - If true, shows success state
 * @param {() => void} [props.onSuccessClose] - Action on success button
 * @param {string} [props.successTitle] - Title on success state
 * @param {string} [props.successDescription] - Description on success state
 * @param {string} [props.successButtonText] - Text on success button
 * @param {string} [props.zIndex="z-[60]"] - Modal z-index
 */
export default function SaveConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  cancelText,
  confirmText,
  isLoading = false,
  isSuccess = false,
  onSuccessClose,
  successTitle,
  successDescription,
  successButtonText,
  secondarySuccessButtonText,
  onSecondarySuccessClick,
  zIndex = "z-[60]",
}) {
  const { t } = useLanguage();

  // Close on ESC key press (only if not loading)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isLoading) {
        if (isSuccess) {
          onSuccessClose ? onSuccessClose() : onClose?.();
        } else {
          onClose?.();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, isSuccess, onClose, onSuccessClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndex} bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150`}
      onClick={() => {
        if (!isLoading) {
          if (isSuccess) {
            onSuccessClose ? onSuccessClose() : onClose?.();
          } else {
            onClose?.();
          }
        }
      }}
    >
      <div
        className="bg-surface border border-border rounded-[14px] shadow-lg w-full max-w-sm p-5 sm:p-6 flex flex-col items-center text-center animate-in fade-in zoom-in-98 duration-150 relative overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (Top-Right) */}
        <button
          type="button"
          onClick={() => {
            if (isSuccess) {
              onSuccessClose ? onSuccessClose() : onClose?.();
            } else {
              onClose?.();
            }
          }}
          disabled={isLoading}
          className="absolute top-3.5 right-3.5 size-7 rounded-[6px] text-muted-foreground/70 hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          title="Close (ESC)"
        >
          <X size={15} />
        </button>

        {/* Minimal Clean Icon Badge */}
        {isSuccess ? (
          <div className="w-11 h-11 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3 shadow-2xs">
            <CheckCircle2 size={22} strokeWidth={2} />
          </div>
        ) : (
          <div className="w-11 h-11 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-3 shadow-2xs">
            <Save size={20} strokeWidth={2} />
          </div>
        )}

        {/* Title & Description */}
        <div className="space-y-1.5 max-w-[280px]">
          <h3 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
            {isSuccess
              ? successTitle || t("studio.saveModalSuccessTitle") || "บันทึกสำเร็จเรียบร้อยแล้ว!"
              : title || t("studio.saveModalTitle") || "บันทึกเทมเพลต?"}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isSuccess
              ? successDescription ||
                t("studio.saveModalSuccessDesc") ||
                "ข้อมูลและโครงสร้างเทมเพลตถูกบันทึกลงระบบพร้อมใช้งานแล้ว"
              : description ||
                t("studio.saveModalDesc") ||
                "คุณต้องการบันทึกการเปลี่ยนแปลงของเทมเพลตนี้ลงระบบใช่หรือไม่?"}
          </p>
        </div>

        {/* Minimal Clean Action Buttons */}
        {isSuccess ? (
          <div className="pt-4 w-full border-t border-border/80 mt-5">
            {secondarySuccessButtonText ? (
              <div className="grid grid-cols-2 gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => {
                    onSecondarySuccessClick ? onSecondarySuccessClick() : onClose?.();
                  }}
                  className="w-full h-9 px-3 rounded-[8px] border border-border bg-surface hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer"
                >
                  {secondarySuccessButtonText}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSuccessClose ? onSuccessClose() : onClose?.();
                  }}
                  className="w-full h-9 px-3 rounded-[8px] bg-primary hover:bg-primary/90 active:bg-primary/95 text-xs font-medium text-white transition-colors shadow-2xs cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <span>{successButtonText || t("studio.backToTemplates") || "ดูรายการเอกสาร"}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onSuccessClose ? onSuccessClose() : onClose?.();
                }}
                className="w-full h-9 px-3 rounded-[8px] bg-primary hover:bg-primary/90 active:bg-primary/95 text-xs font-medium text-white transition-colors shadow-2xs cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <span>{successButtonText || t("studio.backToTemplates") || "กลับไปยังคลังเทมเพลต"}</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 pt-4 w-full border-t border-border/80 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full h-9 px-3 rounded-[8px] border border-border bg-surface hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelText || t("actions.cancel") || "ยกเลิก"}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full h-9 px-3 rounded-[8px] bg-primary hover:bg-primary/90 active:bg-primary/95 text-xs font-medium text-white transition-colors shadow-2xs cursor-pointer inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isLoading && <Loader2 size={13} className="animate-spin" />}
              <span>{confirmText || t("actions.save") || "บันทึก"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
