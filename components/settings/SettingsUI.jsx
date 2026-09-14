"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function SettingsPageHeader({
  title,
  description,
  className,
}) {
  return (
    <header className={cn("mb-8", className)}>
      <h1 className="text-xl font-semibold leading-[30px] tracking-[-0.01em] text-foreground">
        {title}
      </h1>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
    </header>
  );
}

export function SettingsSectionHeading({
  title,
  description,
  className,
}) {
  return (
    <div className={cn("mb-4", className)}>
      <h2 className="text-base font-semibold leading-6 tracking-[-0.01em] text-foreground">{title}</h2>
      {description ? (
        <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function SettingsCard({
  children,
  className,
}) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-border bg-white dark:bg-[#1a1a1a] shadow-2xs",
        className,
      )}
    >
      {children}
    </div>
  );
}
