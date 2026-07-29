"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * Isolates a single widget's render errors so a broken widget renders nothing
 * instead of crashing the whole page it sits on.
 */
export class WidgetErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Widget crashed and was isolated:", error);
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}
