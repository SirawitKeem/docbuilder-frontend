"use client";

import React, { useEffect, useState } from "react";
import { Mail, CheckCircle2, XCircle, RefreshCw, ShieldAlert } from "lucide-react";
import {
  SettingsPageHeader,
  SettingsSectionHeading,
  SettingsCard,
} from "@/components/settings/SettingsUI";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

export default function EmailSettingsPage() {
  const { t } = useLanguage();
  const [emailStatus, setEmailStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = () => {
    setLoading(true);
    fetch("/api/email-status")
      .then((res) => res.json())
      .then((data) => {
        setEmailStatus(data);
        setLoading(false);
      })
      .catch(() => {
        setEmailStatus({ configured: false });
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="mx-auto max-w-[640px] pb-12 text-left">
      <SettingsPageHeader
        title={t('email.title') || "Email Integration"}
        description={t('email.description') || "Monitor outgoing SMTP email transport services for delivering agreements and documents."}
      />

      <div className="space-y-8">
        <div>
          <SettingsSectionHeading
            title={t('email.smtpConfig') || "Service status"}
            description="Active mail transport provider and delivery health status."
          />
          <SettingsCard className="p-6 space-y-4">
            {loading ? (
              <div className="h-16 rounded-[8px] bg-muted/60 animate-pulse" />
            ) : emailStatus?.configured ? (
              <div className="flex items-start gap-3 p-4 rounded-[8px] bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40">
                <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                    Email service connected ({emailStatus.provider || "SMTP"})
                  </p>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400">
                    Ready to dispatch documents and receipts via {emailStatus.email || "configured sender"}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 rounded-[8px] bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40">
                <XCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                    {t('email.notConfigured') || "SMTP server not configured"}
                  </p>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-400 leading-relaxed">
                    System operates in Mock Delivery Mode. Sent emails will be logged locally without reaching external recipients until configured.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/50">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Transport Provider
                </span>
                <p className="text-xs font-medium text-foreground">
                  {emailStatus?.provider || "Nodemailer / SMTP"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('email.senderEmail') || "Sender Address"}
                </span>
                <p className="text-xs font-medium text-foreground">
                  {emailStatus?.email || "notifications@crestzendo.com"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldAlert size={13} />
                Credentials securely stored in server environment variables (.env)
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchStatus}
                disabled={loading}
                className="text-xs h-8 gap-1.5"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                {t('email.testConnection') || "Check status"}
              </Button>
            </div>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}
