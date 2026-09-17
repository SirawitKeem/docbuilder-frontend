"use client";

import * as fabric from "fabric";
import { DocTable, CUSTOM_CANVAS_PROPS } from "../elements/DocTable";

export const CLIPBOARD_STORAGE_KEY = "docbuilder_canvas_clipboard";

/**
 * Deep clones a Fabric object or ActiveSelection in memory, preserving custom classes (DocTable)
 * and applying an optional positional offset (offsetX, offsetY).
 */
export async function cloneFabricObject(obj, offsetX = 20, offsetY = 20) {
  if (!obj) return null;

  // 1. DocTable custom class
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

  // 2. Multi-selection (ActiveSelection)
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

  // 3. Standard Fabric Objects
  const cloned = await obj.clone(CUSTOM_CANVAS_PROPS);
  cloned.set({
    left: (obj.left ?? 0) + offsetX,
    top: (obj.top ?? 0) + offsetY,
    evented: true,
  });
  cloned.setCoords();
  return cloned;
}

/**
 * 💾 Serializes and saves selected Fabric object or ActiveSelection to localStorage
 * in ABSOLUTE canvas coordinates so they can be restored seamlessly in ANY template.
 */
export async function saveToCrossTemplateStorage(obj) {
  if (!obj || typeof window === "undefined") return { success: false, count: 0 };
  try {
    const isSelection = obj.type?.toLowerCase() === "activeselection";
    const rawObjects = isSelection ? obj.getObjects() : [obj];
    if (!rawObjects || rawObjects.length === 0) return { success: false, count: 0 };

    const items = [];
    for (const raw of rawObjects) {
      if (!raw) continue;
      const isTable = Boolean(raw.isDocTable || raw.type === "DocTable" || raw.type === "docTable");

      // Calculate absolute transform matrix if child was inside an ActiveSelection
      let serializedData;
      if (isSelection) {
        const matrix = raw.calcTransformMatrix();
        const clone = await raw.clone(CUSTOM_CANVAS_PROPS);
        clone.group = undefined;
        fabric.util.applyTransformToObject(clone, matrix);
        serializedData = clone.toObject(CUSTOM_CANVAS_PROPS);
      } else {
        serializedData = raw.toObject(CUSTOM_CANVAS_PROPS);
      }

      items.push({
        isDocTable: isTable,
        type: raw.type,
        data: serializedData,
      });
    }

    const payload = {
      version: 2,
      timestamp: Date.now(),
      isSelection,
      count: items.length,
      items,
      // Backward compatibility fields
      data: items.length === 1 ? items[0].data : { type: "activeselection", objects: items.map((i) => i.data) },
    };

    localStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(payload));
    return { success: true, count: items.length };
  } catch (err) {
    console.warn("Failed to write cross-template clipboard to localStorage:", err);
    return { success: false, count: 0, error: err.message };
  }
}

/**
 * 📋 Retrieves and deserializes objects from cross-template localStorage clipboard
 * and adds them onto the target canvas with clean coordinates and active selection.
 */
export async function loadFromCrossTemplateStorage(canvas, offsetX = 20, offsetY = 20) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CLIPBOARD_STORAGE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    if (!payload) return null;

    // Normalise items from version 2 or version 1
    let itemsToRestore = [];
    if (Array.isArray(payload.items) && payload.items.length > 0) {
      itemsToRestore = payload.items;
    } else if (payload.data) {
      if (payload.isSelection && Array.isArray(payload.data.objects)) {
        itemsToRestore = payload.data.objects.map((o) => ({
          isDocTable: Boolean(o.isDocTable || o.type === "DocTable" || o.type === "docTable"),
          type: o.type,
          data: o,
        }));
      } else {
        itemsToRestore = [
          {
            isDocTable: Boolean(payload.isDocTable || payload.type === "DocTable"),
            type: payload.type,
            data: payload.data,
          },
        ];
      }
    }

    if (itemsToRestore.length === 0) return null;

    // Enliven all objects
    const restoredObjects = [];
    for (const item of itemsToRestore) {
      if (!item || !item.data) continue;

      if (item.isDocTable) {
        const table = await DocTable.fromObject({
          ...item.data,
          left: (item.data.left ?? 100) + offsetX,
          top: (item.data.top ?? 100) + offsetY,
        });
        table.setCoords();
        restoredObjects.push(table);
      } else {
        const [obj] = await fabric.util.enlivenObjects([item.data]);
        if (obj) {
          obj.set({
            left: (item.data.left ?? 100) + offsetX,
            top: (item.data.top ?? 100) + offsetY,
            evented: true,
          });
          obj.setCoords();
          restoredObjects.push(obj);
        }
      }
    }

    if (restoredObjects.length === 0) return null;

    // If canvas is provided, directly add and select on the canvas
    if (canvas) {
      // Check viewport bounds: if objects are completely outside canvas, clamp/shift them
      const canvasW = canvas.width || 1200;
      const canvasH = canvas.height || 1200;
      const minLeft = Math.min(...restoredObjects.map((o) => o.left ?? 0));
      const minTop = Math.min(...restoredObjects.map((o) => o.top ?? 0));

      if (minLeft > canvasW - 50 || minTop > canvasH - 50 || minLeft < -100 || minTop < -100) {
        const shiftX = (40 + offsetX) - minLeft;
        const shiftY = (40 + offsetY) - minTop;
        restoredObjects.forEach((o) => {
          o.set({
            left: (o.left ?? 0) + shiftX,
            top: (o.top ?? 0) + shiftY,
          });
          o.setCoords();
        });
      }

      canvas.discardActiveObject();
      restoredObjects.forEach((o) => {
        canvas.add(o);
      });

      if (restoredObjects.length === 1) {
        canvas.setActiveObject(restoredObjects[0]);
        canvas.requestRenderAll();
        return restoredObjects[0];
      } else {
        const sel = new fabric.ActiveSelection(restoredObjects, { canvas });
        canvas.setActiveObject(sel);
        canvas.requestRenderAll();
        return sel;
      }
    }

    // Fallback if canvas wasn't passed
    if (restoredObjects.length === 1) {
      return restoredObjects[0];
    } else {
      return new fabric.ActiveSelection(restoredObjects);
    }
  } catch (err) {
    console.warn("Failed to restore cross-template clipboard from localStorage:", err);
    return null;
  }
}
