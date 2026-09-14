"use client";

import { Plus, X } from "lucide-react";
import { createEmptySubBullet } from "@/lib/quotationHelpers";

const inputClass =
  "h-8 px-2 rounded border border-gray-200 text-[13px] outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-100";

export default function BulletEditor({ bullet, onChange, onRemove }) {
  const updateSubBullet = (subId, text) => {
    onChange({ ...bullet, subBullets: bullet.subBullets.map((sb) => (sb.id === subId ? { ...sb, text } : sb)) });
  };
  const removeSubBullet = (subId) => {
    onChange({ ...bullet, subBullets: bullet.subBullets.filter((sb) => sb.id !== subId) });
  };
  const addSubBullet = () => {
    onChange({ ...bullet, subBullets: [...bullet.subBullets, createEmptySubBullet()] });
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm shrink-0">•</span>
        <input
          type="text"
          value={bullet.text}
          onChange={(e) => onChange({ ...bullet, text: e.target.value })}
          placeholder="รายละเอียด"
          className={`${inputClass} flex-1`}
        />
        <button onClick={addSubBullet} className="text-gray-400 hover:text-primary-600 shrink-0" title="เพิ่มรายละเอียดย่อย">
          <Plus size={14} />
        </button>
        <button onClick={onRemove} className="text-gray-400 hover:text-error-600 shrink-0">
          <X size={14} />
        </button>
      </div>

      {bullet.subBullets.length > 0 && (
        <div className="pl-6 mt-1.5 space-y-1.5">
          {bullet.subBullets.map((sb) => (
            <div key={sb.id} className="flex items-center gap-2">
              <span className="text-gray-300 text-xs shrink-0">-</span>
              <input
                type="text"
                value={sb.text}
                onChange={(e) => updateSubBullet(sb.id, e.target.value)}
                placeholder="รายละเอียดย่อย"
                className={`${inputClass} flex-1`}
              />
              <button onClick={() => removeSubBullet(sb.id)} className="text-gray-300 hover:text-error-600 shrink-0">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
