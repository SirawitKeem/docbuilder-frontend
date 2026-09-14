"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function InputWithIcon({
  label,
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  error,
  name,
  id,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={id || name} className="block text-xs font-semibold text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Icon size={16} />
          </div>
        )}

        <input
          id={id || name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full h-10 ${Icon ? "pl-9" : "pl-3.5"} ${
            isPassword ? "pr-10" : "pr-3.5"
          } rounded-xl border border-border bg-muted/20 text-xs text-foreground outline-none focus:border-primary focus:bg-surface transition-all placeholder:text-muted-foreground/60 font-medium ${
            error ? "border-destructive focus:border-destructive" : ""
          }`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error && <p className="text-[11px] font-medium text-destructive mt-1">{error}</p>}
    </div>
  );
}
