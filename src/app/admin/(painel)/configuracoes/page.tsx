import {
  MediaSettingsForm,
  WhatsappSettingsForm,
} from "@/components/admin/settings/settings-forms";
import { type PanelMedia } from "@/components/admin/media/media-helpers";
import {
  FooterSettingsForm,
  StoreSettingsForm,
} from "@/components/admin/settings/institutional-forms";
import { Forbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/ui/feedback";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminSettings, listMediaLibrary } from "@/services/admin/queries";
import { requireAdminPage } from "@/services/auth/page-guard";

export const instant = false;

// Configurações (Brain §7.7, §7.8, §13, §20): WhatsApp, loja física, rodapé e mídia.
export default async function SettingsPage() {
  const access = await requireAdminPage("settings");
  if (!access.ok) return <Forbidden />;

  const client = await createSupabaseServerClient();
  const [settings, library] = await Promise.all([
    getAdminSettings(client),
    listMediaLibrary(client),
  ]);
  const images: PanelMedia[] = library
    .filter((item) => !item.isDeleted && item.kind === "IMAGE")
    .map(({ id, storagePath, altText, kind, width, height }) => ({
      id,
      storagePath,
      altText,
      kind,
      width,
      height,
    }));

  return (
    <>
      <PageHeader
        title="Configurações"
        description="O que aparece no site sem mudar código: atendimento, loja física e rodapé."
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
          generalMessage={settings.whatsapp.generalMessage}
        />
      </section>
      <section
        aria-labelledby="config-loja"
        className="flex max-w-narrow flex-col gap-3 rounded-card border border-border p-4"
      >
        <h2 id="config-loja" className="text-body font-semibold">
          Loja física
        </h2>
        <StoreSettingsForm store={settings.store} library={images} />
      </section>
      <section
        aria-labelledby="config-rodape"
        className="flex max-w-narrow flex-col gap-3 rounded-card border border-border p-4"
      >
        <h2 id="config-rodape" className="text-body font-semibold">
          Rodapé
        </h2>
        <FooterSettingsForm footer={settings.footer} />
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
