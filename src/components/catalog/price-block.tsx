import { type PriceView } from "@/lib/pricing/pricing";

/** Preço já calculado por `src/lib/pricing` (Brain §11): o componente só exibe. */
export function PriceBlock({ price }: { price: PriceView }) {
  if (price.kind === "on_request") {
    return <p className="text-body font-semibold">{price.label}</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {price.previous ? (
        <p className="text-caption text-muted">
          <span className="sr-only">Preço anterior: </span>
          de <s>{price.previous}</s>
        </p>
      ) : null}
      <p className="text-heading font-semibold">
        {price.prefix ? (
          <span className="mr-2 text-caption font-normal text-muted">
            {price.prefix}
          </span>
        ) : null}
        {price.amount}
      </p>
      {price.installment ? (
        <p className="text-caption text-muted">{price.installment}</p>
      ) : null}
    </div>
  );
}
