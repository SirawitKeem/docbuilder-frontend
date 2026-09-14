"use client";

import { createContext, useContext, useState, useEffect } from "react";

export const DocumentFieldsContext = createContext(null);

export function DocumentFieldsProvider({ children, initialValues = {}, defaultReadOnly = false }) {
  const [values, setValues] = useState(initialValues);
  const [readOnly, setReadOnly] = useState(defaultReadOnly);

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues((prev) => ({ ...initialValues, ...prev }));
    }
  }, [initialValues]);

  const setField = (id, val) => {
    setValues((prev) => ({ ...prev, [id]: val }));
  };

  return (
    <DocumentFieldsContext.Provider value={{ values, setField, readOnly, setReadOnly }}>
      {children}
    </DocumentFieldsContext.Provider>
  );
}

export function useDocumentField(id) {
  const ctx = useContext(DocumentFieldsContext);
  if (!ctx) {
    return {
      value: "",
      setValue: () => {},
      readOnly: true,
    };
  }
  return {
    value: ctx.values?.[id] || "",
    setValue: (val) => ctx.setField?.(id, val),
    readOnly: ctx.readOnly ?? true,
  };
}

export function useDocumentFields() {
  const ctx = useContext(DocumentFieldsContext);
  if (!ctx) {
    return {
      values: {},
      setField: () => {},
      readOnly: true,
      setReadOnly: () => {},
    };
  }
  return ctx;
}