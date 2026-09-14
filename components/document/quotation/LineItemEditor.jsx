"use client";

import { Plus, Trash2 } from "lucide-react";
import { formatTHB, calcLineItemAmount } from "@/lib/format";
import { createEmptyLineItem, createEmptyGroup } from "@/lib/quotationHelpers";
import GroupEditor from "./GroupEditor";

export default function LineItemEditor({ items = [], onChange }) {
  const addItem = () => {
    onChange([...items, createEmptyLineItem()]);
  };

  const removeItem = (itemIndex) => {
    const next = items.filter((_, idx) => idx !== itemIndex);
    onChange(next);
  };

  const updateItem = (itemIndex, field, value) => {
    const next = [...items];
    next[itemIndex] = { ...next[itemIndex], [field]: value };
    onChange(next);
  };

  // Group Operations
  const addGroup = (itemIndex) => {
    const next = [...items];
    next[itemIndex].groups = [...(next[itemIndex].groups || []), createEmptyGroup()];
    onChange(next);
  };

  const updateGroup = (itemIndex, groupIndex, updatedGroup) => {
    const next = [...items];
    next[itemIndex].groups[groupIndex] = updatedGroup;
    onChange(next);
  };

  const removeGroup = (itemIndex, groupIndex) => {
    const next = [...items];
    next[itemIndex].groups = next[itemIndex].groups.filter((_, gIdx) => gIdx !== groupIndex);
    onChange(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 text-base">รายการสินค้า / บริการ (Line Items)</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            สามารถเพิ่ม/ลบรายการ กำหนดราคา และเพิ่มข้อความรายละเอียดซ้อนได้หลายระดับ
          </p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors shadow-xs"
        >
          <Plus size={15} />
          เพิ่มรายการหลัก
        </button>
      </div>

      {items.length === 0 ? (
        <div className="p-8 border border-dashed border-gray-300 rounded-xl text-center bg-gray-50/50">
          <p className="text-sm text-gray-500">ยังไม่มีรายการสินค้า — กดปุ่มด้านบนเพื่อเพิ่มรายการแรก</p>
        </div>
      ) : (
        items.map((item, itemIdx) => {
          const itemAmount = calcLineItemAmount(item);

          return (
            <div
              key={item.id || itemIdx}
              className="border border-gray-200 rounded-xl bg-white shadow-xs overflow-hidden"
            >
              {/* Item Top Bar */}
              <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0">
                    {itemIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateItem(itemIdx, "title", e.target.value)}
                    placeholder="ชื่อรายการหลัก..."
                    className="font-bold text-sm text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-1.5 flex-1 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <label className="font-medium">จำนวน:</label>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => updateItem(itemIdx, "qty", Number(e.target.value))}
                      className="w-16 bg-white border border-gray-300 rounded px-2 py-1 text-center font-bold outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <label className="font-medium">ราคาต่อหน่วย:</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(itemIdx, "unitPrice", Number(e.target.value))}
                      className="w-28 bg-white border border-gray-300 rounded px-2 py-1 text-right font-bold outline-none"
                    />
                  </div>

                  <div className="text-right px-2">
                    <span className="text-[11px] text-gray-400 block">รวมเป็นเงิน</span>
                    <span className="font-bold text-sm text-emerald-700">{formatTHB(itemAmount)} THB</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(itemIdx)}
                    className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                    title="ลบรายการนี้"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Item Groups Editor */}
              <div className="p-4 space-y-4 bg-white">
                {(item.groups || []).map((group, groupIdx) => (
                  <GroupEditor
                    key={group.id || groupIdx}
                    group={group}
                    onChange={(updatedGroup) => updateGroup(itemIdx, groupIdx, updatedGroup)}
                    onRemove={() => removeGroup(itemIdx, groupIdx)}
                  />
                ))}

                <button
                  type="button"
                  onClick={() => addGroup(itemIdx)}
                  className="text-xs font-semibold text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={14} /> เพิ่มหมวดหมู่ย่อยสำหรับรายการนี้
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
