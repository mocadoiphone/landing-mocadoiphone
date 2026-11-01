/**
 * Telefones de contato (Brain §14; MDI-D012). Gravados só com dígitos e DDI
 * (mesma CHECK de `contacts.phone/whatsapp`); exibidos formatados no painel.
 */
const STORED_PATTERN = /^[1-9][0-9]{9,14}$/;

/**
 * "(11) 99999-9999" → "5511999999999". Com "+" ou "00" no início, o DDI já foi
 * informado; sem eles, número de 10 ou 11 dígitos é brasileiro e recebe 55.
 * Retorna `null` se não der um número válido.
 */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  const hasCountryCode = trimmed.startsWith("+") || trimmed.startsWith("00");
  const digits = trimmed.replace(/\D/g, "").replace(/^00/, "");
  const withCountry =
    !hasCountryCode && (digits.length === 10 || digits.length === 11)
      ? `55${digits}`
      : digits;
  return STORED_PATTERN.test(withCountry) ? withCountry : null;
}

/** "5511999999999" → "+55 (11) 99999-9999"; outros países: "+<dígitos>". */
export function formatPhone(digits: string): string {
  const match = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(digits);
  return match ? `+55 (${match[1]}) ${match[2]}-${match[3]}` : `+${digits}`;
}
