import { type JsonLdValue, serializeJsonLd } from "@/lib/seo/structured-data";

/** JSON-LD nativo, escapando `<` para impedir fechamento injetado do script. */
export function JsonLd({ value }: { value: JsonLdValue }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(value) }}
    />
  );
}
