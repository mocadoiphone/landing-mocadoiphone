import {
  MediaSettingsForm,
  WhatsappSettingsForm,
} from "@/components/admin/settings/settings-forms";
import { Forbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/ui/feedback";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminSettings } from "@/services/admin/queries";
import { requireAdminPage } from "@/services/auth/page-guard";

export const instant = false;

// Configurações (Brain §13, §20). Loja e footer entram na Etapa 05.
export default async function SettingsPage() {
  const access = await requireAdminPage("settings");
  if (!access.ok) return <Forbidden />;

  const client = await createSupabaseServerClient();
  const settings = await getAdminSettings(client);

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Loja física e rodapé entram na Etapa 05, com as páginas que os exibem."
      />
      <section
        aria-labelledby="config-whatsapp"
        className="flex max-w-narrow flex-col gap-3 rounded-card border border-border p-4"
      >
        <h2 id="config-whatsapp" className="text-body font-semibold">
          WhatsApp
        </h2>
        <WhatsappSettingsForm
          template={settings.whatsapp.messageTemplate}
          leadOrigin={settings.whatsapp.leadOrigin}
        />
      </section>
      <section
        aria-labelledby="config-midia"
        className="flex max-w-narrow flex-col gap-3 rounded-card border border-border p-4"
      >
        <h2 id="config-midia" className="text-body font-semibold">
          Mídia
        </h2>
        <MediaSettingsForm
          videoUploadEnabled={settings.media.videoUploadEnabled}
        />
      </section>
    </>
  );
}
