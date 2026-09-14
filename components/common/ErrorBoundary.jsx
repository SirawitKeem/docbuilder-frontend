"use client";

import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("ErrorBoundary caught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-8 text-center bg-surface rounded-[12px] border border-border shadow-sm max-w-md mx-auto my-6 space-y-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle size={20} />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {this.props.title || "เกิดข้อผิดพลาดในการแสดงผล"}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {this.state.error?.message || "ไม่สามารถแสดงตัวอย่างเอกสารนี้ได้ชั่วคราว"}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer mx-auto"
          >
            <RotateCcw size={13} />
            <span>ลองใหม่อีกครั้ง</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
