"use client";

import { useWidgets } from "@/hooks/useWidgets";
import { WIDGET_META, getWidgetMeta } from "@/widgets/widgets.config";
import { WIDGET_REGISTRY } from "@/widgets/registry";
import type { WidgetSlotId } from "@/types/Widgets/widgets";

/**
 * A fixed position on the site reserved for a widget. Renders the single
 * enabled widget assigned to this slot (one-active-per-slot), or nothing at all
 * when the slot is empty — so the space simply stays unused until a widget is
 * enabled for it in the admin.
 */
export default function WidgetSlot({
  id,
  className = "",
}: {
  id: WidgetSlotId;
  className?: string;
}) {
  const { data } = useWidgets();
  if (!data || data.length === 0) return null;

  const slotKeys = WIDGET_META.filter((m) => m.slot === id).map((m) => m.key);
  const state = data.find((s) => s.enabled && slotKeys.includes(s.key));
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
      <Component config={state.config} />
    </div>
  );
}
