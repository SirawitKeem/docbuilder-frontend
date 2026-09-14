import Link from "next/link";
import { FileText, Lock, ArrowRight } from "lucide-react";
import { EXTENDED_ICON_MAP } from "@/components/templates/CreateCategoryModal";
import { COLOR_MAP } from "@/components/templates/CategoryManagerModal";
import { useLanguage } from "@/context/LanguageContext";

export default function TemplateCard({ template, variant = "compact", onSelect }) {
  const { t } = useLanguage();
  const iconData = EXTENDED_ICON_MAP[template.icon];
  const Icon = iconData ? iconData.icon : FileText;
  const colorClass = COLOR_MAP[template.color] || COLOR_MAP.purple;
  const isAvailable = template.available !== false;

  const cardInner = (
    <div className="bg-surface border border-border rounded-[12px] shadow-2xs p-4 sm:p-5 h-full flex flex-col justify-between transition-all duration-200 group-hover:border-neutral-300 dark:group-hover:border-neutral-700 group-hover:shadow-card text-left relative overflow-hidden select-none">
      {/* Top Bar: Icon Box */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className={`w-9 h-9 rounded-[6px] flex items-center justify-center border ${colorClass.bg} ${colorClass.text} ${colorClass.border} transition-transform group-hover:scale-105 duration-200 shadow-2xs`}>
          <Icon size={18} />
        </div>
        {!isAvailable && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-border bg-muted text-muted-foreground">
            {t('status.comingSoon') || "Coming soon"}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="flex-1 my-1">
        <p className="font-semibold text-foreground text-sm sm:text-[15px] line-clamp-1 font-sans">
          {template.name}
        </p>
      </div>

      {variant === "full" && template.description && (
        <p className="text-xs text-muted-foreground/80 mt-1 mb-2 leading-relaxed line-clamp-2">
          {template.description}
        </p>
      )}

      {/* Bottom Action CTA: Minimal Clean Split Row without top border line */}
      <div className="mt-auto pt-2 flex items-center justify-between">
        {isAvailable ? (
          <>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-150">
              {t('templates.useTemplate') || "Use template"}
            </span>
            <div className="size-6 rounded-full bg-muted/80 group-hover:bg-neutral-200/80 dark:group-hover:bg-neutral-700/80 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-all duration-150">
              <ArrowRight size={12} className="transition-transform duration-150 group-hover:translate-x-0.5" />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70">
            <Lock size={12} />
            <span>{t('status.comingSoon') || "Coming soon"}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (!isAvailable) {
    return <div className="opacity-60 cursor-not-allowed h-full">{cardInner}</div>;
  }

  if (onSelect) {
    return (
      <div
        onClick={() => onSelect(template)}
        className="block group cursor-pointer h-full"
      >
        {cardInner}
      </div>
    );
  }

  const standardHref = ["quotation", "nda", "partner", "distributor"].includes((template.id || "").toLowerCase())
    ? `/create/${template.id}`
    : `/create/custom?categoryId=${template.id}`;

  return (
    <Link href={template.href || standardHref} className="block group h-full">
      {cardInner}
    </Link>
  );
}
