"use client";

import { Plus, Trash2 } from "lucide-react";
import { createEmptyBullet } from "@/lib/quotationHelpers";
import BulletEditor from "./BulletEditor";

const inputClass =
  "h-9 px-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100";

export default function GroupEditor({ group, onChange, onRemove }) {
  const updateBullet = (bulletId, updatedBullet) => {
    onChange({ ...group, bullets: group.bullets.map((b) => (b.id === bulletId ? updatedBullet : b)) });
  };
  const removeBullet = (bulletId) => {
    onChange({ ...group, bullets: group.bullets.filter((b) => b.id !== bulletId) });
  };
  const addBullet = () => {
    onChange({ ...group, bullets: [...group.bullets, createEmptyBullet()] });
  };

  return (
    <div className="border-l-2 border-primary-100 pl-4">
      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          value={group.heading}
          onChange={(e) => onChange({ ...group, heading: e.target.value })}
          placeholder="หัวข้อย่อย เช่น Application Shield Services"
          className={`${inputClass} flex-1 font-medium`}
        />
        <button
          onClick={onRemove}
          className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-error-100 hover:text-error-600 shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-2">
        {group.bullets.map((bullet) => (
          <BulletEditor
            key={bullet.id}
            bullet={bullet}
            onChange={(updated) => updateBullet(bullet.id, updated)}
            onRemove={() => removeBullet(bullet.id)}
          />
        ))}
        <button
          onClick={addBullet}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-primary-600"
        >
          <Plus size={12} /> เพิ่ม bullet
        </button>
      </div>
    </div>
  );
}
