/** Link para o WhatsApp do contato padrão, com a mensagem já montada (Brain §13). */
export function WhatsAppLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-fit items-center rounded-control bg-accent px-4 py-2 text-caption font-semibold text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {label}
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}
