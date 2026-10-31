import { type SpecGroup } from "@/lib/catalog/types";

export function SpecList({ groups }: { groups: SpecGroup[] }) {
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.name ?? "geral"} className="flex flex-col gap-2">
          {group.name ? (
            <h3 className="text-body font-semibold">{group.name}</h3>
          ) : null}
          <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-4 gap-y-2 text-caption">
            {group.items.map((item) => (
              <div key={`${item.label}-${item.value}`} className="contents">
                <dt className="text-muted">{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
