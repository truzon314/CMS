"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { AnalyticsSettingsForm } from "@/modules/settings/AnalyticsSettingsForm";
import { GeneralSettingsForm } from "@/modules/settings/GeneralSettingsForm";
import { SmtpSettingsForm } from "@/modules/settings/SmtpSettingsForm";
import { SocialLinksForm } from "@/modules/settings/SocialLinksForm";

export function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  if (isLoading || !settings) {
    return <div className="h-40 animate-pulse rounded-lg border bg-neutral-100" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Settings</h1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="social">Social Links</TabsTrigger>
          <TabsTrigger value="smtp">SMTP</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettingsForm
            settings={settings}
            isSaving={updateSettings.isPending}
            onSave={(payload) => updateSettings.mutate(payload)}
          />
        </TabsContent>
        <TabsContent value="social">
          <SocialLinksForm
            settings={settings}
            isSaving={updateSettings.isPending}
            onSave={(payload) => updateSettings.mutate(payload)}
          />
        </TabsContent>
        <TabsContent value="smtp">
          <SmtpSettingsForm
            settings={settings}
            isSaving={updateSettings.isPending}
            onSave={(payload) => updateSettings.mutate(payload)}
          />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsSettingsForm
            settings={settings}
            isSaving={updateSettings.isPending}
            onSave={(payload) => updateSettings.mutate(payload)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
