"use client";

import { useEffect, useState } from "react";
import TemplateCard from "@/components/templates/TemplateCard";
import TemplateSelectModal from "@/components/templates/TemplateSelectModal";
import { getTemplates } from "@/lib/data/templates";
import { useLanguage } from "@/context/LanguageContext";

export default function CreateDocumentPage() {
  const { t } = useLanguage();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    getTemplates().then((data) => {
      setTemplates(data);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">{t('create.title') || "Create Document"}</h1>
      <p className="text-sm text-muted-foreground mb-8">
        {t('create.description') || "Select a template category to start generating your business document"}
      </p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onSelect={(cat) => setSelectedCategory(cat)}
            />
          ))}
        </div>
      )}

      {/* Category Sub-templates Selection Modal */}
      {selectedCategory && (
        <TemplateSelectModal
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </div>
  );
}
