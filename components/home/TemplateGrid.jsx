"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkle } from "@phosphor-icons/react";
import TemplateCard from "@/components/templates/TemplateCard";
import TemplateSelectModal from "@/components/templates/TemplateSelectModal";
import { getTemplates } from "@/lib/data/templates";
import { useLanguage } from "@/context/LanguageContext";

export default function TemplateGrid() {
  const [templates, setTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    getTemplates().then(setTemplates);
  }, []);

  return (
    <section className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-[6px] bg-violet-50 text-primary dark:bg-violet-950/40 dark:text-violet-300 flex items-center justify-center shrink-0">
            <Sparkle size={16} weight="fill" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground leading-tight">{t('home.quickStartTemplates') || "Quick Start Templates"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('home.quickStartDesc') || "Select a pre-built template to quickly create agreements or quotations"}</p>
          </div>
        </div>

        <Link
          href="/templates"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline transition-colors"
        >
          <span>{t('home.viewAllTemplates') || "View all templates"}</span>
          <ArrowRight size={13} weight="bold" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {templates.slice(0, 4).map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            onSelect={(cat) => setSelectedCategory(cat)}
          />
        ))}
      </div>

      {/* Category Sub-templates Selection Modal */}
      {selectedCategory && (
        <TemplateSelectModal
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </section>
  );
}