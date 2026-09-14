import { CheckCircle2, FilePlus2, Clock } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function SuccessScreen({ fileName, sentTo, onCreateNew }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-4">
      <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mb-6">
        <CheckCircle2 size={32} className="text-success-600" />
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-1">{t('success.title')}</h1>
      <p className="text-sm text-gray-500 mb-8">{fileName}</p>

      <div className="bg-white border border-gray-200 rounded-card px-6 py-4 mb-8 text-center">
        <p className="text-xs text-gray-500 mb-1">{t('success.sentTo')}</p>
        <p className="text-sm font-medium text-gray-900">{sentTo}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onCreateNew}
          className="primary-button inline-flex items-center gap-2 h-9 px-4 rounded-[8px] text-white text-xs font-medium shadow-xs hover:opacity-95 transition-all cursor-pointer"
        >
          <FilePlus2 size={15} />
          {t('success.createNew')}
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-[8px] border border-border text-foreground text-xs font-medium hover:bg-muted transition-colors bg-surface shadow-2xs"
        >
          <Clock size={15} />
          {t('success.backToHome')}
        </Link>
      </div>
    </div>
  );
}
