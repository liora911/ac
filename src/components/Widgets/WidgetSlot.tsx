"use client";

import { useEnabledWidgets } from "./WidgetsProvider";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";
import { WIDGET_META, getWidgetMeta } from "@/widgets/widgets.config";
import { WIDGET_REGISTRY } from "@/widgets/registry";
import type { WidgetSlotId } from "@/types/Widgets/widgets";

/**
 * A fixed position on the site reserved for a widget. Reads the server-seeded
 * enabled-widget snapshot (so it renders in the initial HTML with no flash) and
 * shows the single enabled widget assigned to this slot, wrapped in an error
 * boundary. Empty ⇒ renders nothing; the space simply stays unused.
 */
export default function WidgetSlot({
  id,
  className = "",
}: {
  id: WidgetSlotId;
  className?: string;
}) {
  const widgets = useEnabledWidgets();

  const slotKeys = WIDGET_META.filter((m) => m.slot === id).map((m) => m.key);
  const state = widgets.find((s) => s.enabled && slotKeys.includes(s.key));
  if (!state) return null;

  const entry = WIDGET_REGISTRY[state.key];
  const meta = getWidgetMeta(state.key);
  if (!entry || !meta) return null;

  const variantKey =
    state.variant && entry.variants[state.variant]
      ? state.variant
      : meta.defaultVariant;
  const Component = entry.variants[variantKey];
  if (!Component) return null;

  return (
    <div className={`w-full ${className}`}>
      <WidgetErrorBoundary>
        <Component config={state.config} />
      </WidgetErrorBoundary>
    </div>
  );
}
