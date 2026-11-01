import { type AvailabilityView } from "@/lib/availability/availability";

const TONE: Record<AvailabilityView["status"], string> = {
  AVAILABLE: "text-success",
  PRE_ORDER: "text-warning",
  ON_REQUEST: "text-muted",
  OUT_OF_STOCK: "text-danger",
  DISCONTINUED: "text-muted",
  HIDDEN: "text-muted",
};

/** Rótulo do Brain §12. A cor (ponto) é reforço visual; o texto sempre aparece. */
export function AvailabilityBadge({
  availability,
}: {
  availability: AvailabilityView | null;
}) {
  if (!availability) return null;
  return (
    <p
      className={`inline-flex items-center gap-2 text-caption font-medium ${TONE[availability.status]}`}
      data-status={availability.status}
    >
      <span aria-hidden="true" className="size-2 rounded-full bg-current" />
      {availability.label}
    </p>
  );
}
