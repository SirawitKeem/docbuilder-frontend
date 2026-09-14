"use client";

import * as fabric from "fabric";
import { DocTable, CUSTOM_CANVAS_PROPS } from "../elements/DocTable";

/**
 * Deep clones a Fabric object or ActiveSelection, preserving custom classes (DocTable)
 * and applying an optional positional offset (offsetX, offsetY).
 *
 * @param {fabric.Object} obj - The object or ActiveSelection to clone
 * @param {number} offsetX - Horizontal offset to apply (default 20)
 * @param {number} offsetY - Vertical offset to apply (default 20)
 * @returns {Promise<fabric.Object>} Cloned Fabric object or ActiveSelection
 */
export async function cloneFabricObject(obj, offsetX = 20, offsetY = 20) {
  if (!obj) return null;

  // 1. DocTable custom class: re-instantiate using DocTable.fromObject so that all custom methods
  // (addRow, removeRow, updateTableData, setThemeColor, etc.) and prototypes are 100% preserved.
  if (obj.isDocTable || obj.type === "DocTable" || obj.type === "docTable") {
    const json = obj.toObject(CUSTOM_CANVAS_PROPS);
    const newDocTable = await DocTable.fromObject({
      ...json,
      left: (obj.left ?? 0) + offsetX,
      top: (obj.top ?? 0) + offsetY,
    });
    newDocTable.setCoords();
    return newDocTable;
  }

  // 2. Multi-selection (ActiveSelection):
  // Clone the selection group, offset coordinates, and mark children as evented
  if (obj.type?.toLowerCase() === "activeselection") {
    const clonedSelection = await obj.clone(CUSTOM_CANVAS_PROPS);
    clonedSelection.set({
      left: (obj.left ?? 0) + offsetX,
      top: (obj.top ?? 0) + offsetY,
      evented: true,
    });
    clonedSelection.setCoords();
    return clonedSelection;
  }

  // 3. Standard Fabric Objects (Rect, Textbox, IText, Image, Group, Line, etc.)
  const cloned = await obj.clone(CUSTOM_CANVAS_PROPS);
  cloned.set({
    left: (obj.left ?? 0) + offsetX,
    top: (obj.top ?? 0) + offsetY,
    evented: true,
  });
  cloned.setCoords();
  return cloned;
}
