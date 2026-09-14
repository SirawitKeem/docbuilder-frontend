"use client";

import { Plus, X, Trash2, FolderPlus } from "lucide-react";
import { formatTHB, calcLineItemAmount } from "@/lib/format";
import InlineTextField from "./InlineTextField";
import { useQuotationData } from "@/context/QuotationDataContext";

export default function LineItemBlock({ item }) {
  const {
    readOnly,
    updateLineItem,
    removeLineItem,
    addGroup,
    updateGroup,
    removeGroup,
    addBullet,
    updateBullet,
    removeBullet,
    addSubBullet,
  } = useQuotationData();

  const amount = calcLineItemAmount(item);

  return (
    <div className="line-item-block group/item relative pb-3 pt-1 border-b border-gray-200/90 last:border-0">
      {/* Remove Main Item Button (Hover only) */}
      {!readOnly && (
        <button
          onClick={() => removeLineItem(item.id)}
          className="absolute right-0 top-2 opacity-0 group-hover/item:opacity-100 p-1 rounded hover:bg-red-50 text-red-500 transition-opacity z-10"
          title="ลบรายการหลักนี้"
        >
          <Trash2 size={15} />
        </button>
      )}

      {/* Main Item Row Header (Title, Qty, Unit Price, Amount) */}
      <div className="grid grid-cols-[1fr_60px_120px_120px] gap-2 py-2 items-baseline">
        <InlineTextField
          value={item.title}
          onChange={(v) => updateLineItem(item.id, { ...item, title: v })}
          placeholder="ชื่อรายการหลัก (เช่น CDNetworks Annual Services)"
          readOnly={readOnly}
          className="font-bold text-[14px] text-gray-900"
        />

        <div className="text-center">
          <InlineTextField
            value={item.qty}
            numeric
            onChange={(v) => updateLineItem(item.id, { ...item, qty: v })}
            readOnly={readOnly}
            className="text-center text-sm font-bold text-gray-800 w-12"
          />
        </div>

        <div className="text-right">
          <InlineTextField
            value={item.unitPrice}
            numeric
            onChange={(v) => updateLineItem(item.id, { ...item, unitPrice: v })}
            readOnly={readOnly}
            className="text-right text-sm text-gray-800 w-24"
          />
        </div>

        <p className="text-right text-sm font-extrabold text-gray-900">
          {formatTHB(amount)}
        </p>
      </div>

      {/* Sub-groups and Bullets */}
      <div className="pb-2 pt-1 space-y-3 pl-1">
        {(item.groups || []).map((group) => (
          <div key={group.id} className="group/group space-y-1 relative" style={{ breakInside: "avoid" }}>
            
            {/* Group Heading with Hover Delete */}
            <div className="flex items-center gap-2">
              <InlineTextField
                value={group.heading}
                onChange={(v) => updateGroup(item.id, group.id, { ...group, heading: v })}
                placeholder="ชื่อหมวดหมู่ย่อย (เช่น Application Shield Services)"
                readOnly={readOnly}
                className="text-xs font-bold tracking-wide flex-1"
                style={{ color: "#0F4C35" }}
              />

              {!readOnly && (
                <button
                  onClick={() => removeGroup(item.id, group.id)}
                  className="opacity-0 group-hover/group:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-opacity shrink-0"
                  title="ลบหมวดหมู่นี้"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Bullets List */}
            <ul className="text-xs text-gray-700 space-y-1">
              {(group.bullets || []).map((bullet) => (
                <li key={bullet.id} className="group/bullet space-y-1">
                  <div className="flex items-start gap-1.5">
                    <span className="shrink-0 text-gray-400 font-bold mt-0.5">•</span>
                    <InlineTextField
                      value={bullet.text}
                      onChange={(v) => updateBullet(item.id, group.id, bullet.id, { ...bullet, text: v })}
                      placeholder="รายละเอียดรายการย่อย..."
                      readOnly={readOnly}
                      className="flex-1 text-xs"
                    />

                    {/* Hover-only Bullet Actions */}
                    {!readOnly && (
                      <span className="opacity-0 group-hover/bullet:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                        <button
                          onClick={() => addSubBullet(item.id, group.id, bullet.id)}
                          className="text-gray-400 hover:text-emerald-600 p-0.5"
                          title="เพิ่มข้อความย่อย (-)"
                        >
                          <Plus size={13} />
                        </button>
                        <button
                          onClick={() => removeBullet(item.id, group.id, bullet.id)}
                          className="text-gray-400 hover:text-red-500 p-0.5"
                          title="ลบรายการนี้"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    )}
                  </div>

                  {/* Sub-bullets List */}
                  {bullet.subBullets?.length > 0 && (
                    <ul className="pl-5 space-y-1 text-gray-600">
                      {bullet.subBullets.map((sb) => (
                        <li key={sb.id} className="group/subbullet flex items-start gap-1.5">
                          <span className="shrink-0 text-gray-400 font-bold mt-0.5">-</span>
                          <InlineTextField
                            value={sb.text}
                            onChange={(v) => {
                              const updatedSub = bullet.subBullets.map((x) =>
                                x.id === sb.id ? { ...x, text: v } : x
                              );
                              updateBullet(item.id, group.id, bullet.id, { ...bullet, subBullets: updatedSub });
                            }}
                            placeholder="รายละเอียดซ้อนย่อย..."
                            readOnly={readOnly}
                            className="flex-1 text-xs text-gray-600"
                          />

                          {!readOnly && (
                            <button
                              onClick={() => {
                                const updatedSub = bullet.subBullets.filter((x) => x.id !== sb.id);
                                updateBullet(item.id, group.id, bullet.id, { ...bullet, subBullets: updatedSub });
                              }}
                              className="opacity-0 group-hover/subbullet:opacity-100 text-gray-400 hover:text-red-500 p-0.5 transition-opacity"
                              title="ลบ"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>

            {/* Add Bullet Button inside Group */}
            {!readOnly && (
              <button
                onClick={() => addBullet(item.id, group.id)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 pt-1"
              >
                <Plus size={12} /> เพิ่ม bullet (•)
              </button>
            )}

          </div>
        ))}

        {/* Add Group Button inside Line Item */}
        {!readOnly && (
          <div className="pt-2">
            <button
              onClick={() => addGroup(item.id)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/80 px-2.5 py-1 rounded-md border border-emerald-200/80 transition-colors"
            >
              <FolderPlus size={13} /> เพิ่มหมวดหมู่ย่อยสำหรับรายการนี้
            </button>
          </div>
        )}

      </div>
    </div>
  );
}