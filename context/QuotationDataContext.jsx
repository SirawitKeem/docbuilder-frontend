"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createEmptyLineItem, createEmptyGroup, createEmptyBullet, createEmptySubBullet } from "@/lib/quotationHelpers";

export const QuotationDataContext = createContext(null);

export function QuotationDataProvider({ children, initialQuotation, defaultReadOnly = false }) {
  const [quotation, setQuotation] = useState(initialQuotation);
  const [readOnly, setReadOnly] = useState(defaultReadOnly);

  useEffect(() => {
    if (initialQuotation) {
      setQuotation(initialQuotation);
    }
  }, [initialQuotation]);

  const updateField = (field, value) => setQuotation((prev) => ({ ...prev, [field]: value }));

  const updateIssuer = (field, value) =>
    setQuotation((prev) => ({
      ...prev,
      issuer: { ...(prev.issuer || {}), [field]: value },
    }));

  const updateBillTo = (field, value) =>
    setQuotation((prev) => ({
      ...prev,
      billTo: { ...prev.billTo, [field]: value },
    }));

  const updateLineItem = (id, updated) =>
    setQuotation((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((it) => (it.id === id ? updated : it)),
    }));

  const addLineItem = () =>
    setQuotation((prev) => ({
      ...prev,
      lineItems: [...(prev.lineItems || []), createEmptyLineItem()],
    }));

  const removeLineItem = (id) =>
    setQuotation((prev) => ({
      ...prev,
      lineItems: (prev.lineItems || []).filter((it) => it.id !== id),
    }));

  // Group Operations inside a Line Item
  const addGroup = (itemId) => {
    setQuotation((prev) => ({
      ...prev,
      lineItems: (prev.lineItems || []).map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          groups: [...(it.groups || []), createEmptyGroup()],
        };
      }),
    }));
  };

  const updateGroup = (itemId, groupId, updatedGroup) => {
    setQuotation((prev) => ({
      ...prev,
      lineItems: (prev.lineItems || []).map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          groups: (it.groups || []).map((g) => (g.id === groupId ? updatedGroup : g)),
        };
      }),
    }));
  };

  const removeGroup = (itemId, groupId) => {
    setQuotation((prev) => ({
      ...prev,
      lineItems: (prev.lineItems || []).map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          groups: (it.groups || []).filter((g) => g.id !== groupId),
        };
      }),
    }));
  };

  // Bullet Operations inside a Group
  const addBullet = (itemId, groupId) => {
    setQuotation((prev) => ({
      ...prev,
      lineItems: (prev.lineItems || []).map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          groups: (it.groups || []).map((g) => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              bullets: [...(g.bullets || []), createEmptyBullet()],
            };
          }),
        };
      }),
    }));
  };

  const updateBullet = (itemId, groupId, bulletId, updatedBullet) => {
    setQuotation((prev) => ({
      ...prev,
      lineItems: (prev.lineItems || []).map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          groups: (it.groups || []).map((g) => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              bullets: (g.bullets || []).map((b) => (b.id === bulletId ? updatedBullet : b)),
            };
          }),
        };
      }),
    }));
  };

  const removeBullet = (itemId, groupId, bulletId) => {
    setQuotation((prev) => ({
      ...prev,
      lineItems: (prev.lineItems || []).map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          groups: (it.groups || []).map((g) => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              bullets: (g.bullets || []).filter((b) => b.id !== bulletId),
            };
          }),
        };
      }),
    }));
  };

  // Sub-bullet Operations inside a Bullet
  const addSubBullet = (itemId, groupId, bulletId) => {
    setQuotation((prev) => ({
      ...prev,
      lineItems: (prev.lineItems || []).map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          groups: (it.groups || []).map((g) => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              bullets: (g.bullets || []).map((b) => {
                if (b.id !== bulletId) return b;
                return {
                  ...b,
                  subBullets: [...(b.subBullets || []), createEmptySubBullet()],
                };
              }),
            };
          }),
        };
      }),
    }));
  };

  return (
    <QuotationDataContext.Provider
      value={{
        quotation,
        setQuotation,
        readOnly,
        setReadOnly,
        updateField,
        updateIssuer,
        updateBillTo,
        updateLineItem,
        addLineItem,
        removeLineItem,
        addGroup,
        updateGroup,
        removeGroup,
        addBullet,
        updateBullet,
        removeBullet,
        addSubBullet,
      }}
    >
      {children}
    </QuotationDataContext.Provider>
  );
}

export function useQuotationData() {
  const ctx = useContext(QuotationDataContext);
  if (!ctx) throw new Error("useQuotationData ต้องอยู่ภายใน QuotationDataProvider");
  return ctx;
}
