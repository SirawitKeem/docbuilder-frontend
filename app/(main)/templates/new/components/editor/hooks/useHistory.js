"use client";

import { useState, useRef, useCallback } from "react";
import { CUSTOM_CANVAS_PROPS } from "../elements/DocTable";

export function useHistory() {
  const [historyStack, setHistoryStack] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const historyStackRef = useRef([]);
  const currentIndexRef = useRef(-1);
  const isExecutingRef = useRef(false);

  // Initialize or Reset History with initial canvas state
  const initHistory = useCallback((canvas) => {
    if (!canvas) return;
    try {
      const json = canvas.toJSON(CUSTOM_CANVAS_PROPS);
      historyStackRef.current = [json];
      currentIndexRef.current = 0;
      setHistoryStack([json]);
      setCurrentIndex(0);
    } catch (err) {
      console.warn("initHistory error:", err);
    }
  }, []);

  // Push new state snapshot to stack
  const pushState = useCallback((canvas) => {
    if (!canvas || isExecutingRef.current) return;
    try {
      const json = canvas.toJSON(CUSTOM_CANVAS_PROPS);
      const jsonString = JSON.stringify(json);
      const lastState = historyStackRef.current[currentIndexRef.current];
      if (lastState && JSON.stringify(lastState) === jsonString) {
        return; // Ignore duplicate identical state
      }
      const nextIndex = currentIndexRef.current + 1;
      const nextStack = historyStackRef.current.slice(0, nextIndex);
      nextStack.push(json);
      historyStackRef.current = nextStack;
      currentIndexRef.current = nextIndex;
      setHistoryStack(nextStack);
      setCurrentIndex(nextIndex);
    } catch (err) {
      console.warn("pushState error:", err);
    }
  }, []);

  // Undo action
  const undo = useCallback((canvas) => {
    if (!canvas || currentIndexRef.current <= 0 || isExecutingRef.current) return;
    isExecutingRef.current = true;
    const targetIndex = currentIndexRef.current - 1;
    const targetState = historyStackRef.current[targetIndex];

    if (targetState) {
      canvas.loadFromJSON(targetState).then(() => {
        canvas.renderAll();
        currentIndexRef.current = targetIndex;
        setCurrentIndex(targetIndex);
        isExecutingRef.current = false;
      }).catch((err) => {
        console.error("Undo error:", err);
        isExecutingRef.current = false;
      });
    } else {
      isExecutingRef.current = false;
    }
  }, []);

  // Redo action
  const redo = useCallback((canvas) => {
    if (!canvas || currentIndexRef.current >= historyStackRef.current.length - 1 || isExecutingRef.current) return;
    isExecutingRef.current = true;
    const targetIndex = currentIndexRef.current + 1;
    const targetState = historyStackRef.current[targetIndex];

    if (targetState) {
      canvas.loadFromJSON(targetState).then(() => {
        canvas.renderAll();
        currentIndexRef.current = targetIndex;
        setCurrentIndex(targetIndex);
        isExecutingRef.current = false;
      }).catch((err) => {
        console.error("Redo error:", err);
        isExecutingRef.current = false;
      });
    } else {
      isExecutingRef.current = false;
    }
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < historyStack.length - 1;

  return {
    initHistory,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    currentIndex,
    totalStates: historyStack.length,
  };
}