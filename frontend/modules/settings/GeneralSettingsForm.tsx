"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/TextField";
import { ImagePickerField } from "@/components/forms/ImagePickerField";
import { useMediaItem } from "@/hooks/useMedia";
import type { Settings, SettingsUpdatePayload } from "@/types/settings";

interface GeneralSettingsFormProps {
  settings: Settings;
  isSaving: boolean;
  onSave: (payload: SettingsUpdatePayload) => void;
}

export function GeneralSettingsForm({ settings, isSaving, onSave }: GeneralSettingsFormProps) {
  const [siteName, setSiteName] = useState(settings.site_name ?? "");
  const [contactEmail, setContactEmail] = useState(settings.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(settings.contact_phone ?? "");
  const [callbackPhone, setCallbackPhone] = useState(settings.callback_phone ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsapp_number ?? "");
  const [contactAddress, setContactAddress] = useState(settings.contact_address ?? "");
  const [logoMediaId, setLogoMediaId] = useState(settings.logo_media_id);
  const [logoUrlOverride, setLogoUrlOverride] = useState<string | null>(null);
  const [faviconMediaId, setFaviconMediaId] = useState(settings.favicon_media_id);
  const [faviconUrlOverride, setFaviconUrlOverride] = useState<string | null>(null);

  const { data: currentLogo } = useMediaItem(logoUrlOverride === null ? settings.logo_media_id : null);
  const { data: currentFavicon } = useMediaItem(faviconUrlOverride === null ? settings.favicon_media_id : null);

  return (
    <div className="flex flex-col gap-3 max-w-lg">
      <TextField id="site_name" label="Site name" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
      <ImagePickerField
        label="Logo"
        imageUrl={logoUrlOverride ?? currentLogo?.url ?? ""}
        onChange={({ url, mediaId }) => {
          setLogoUrlOverride(url);
          setLogoMediaId(mediaId);
        }}
      />
      <ImagePickerField
        label="Favicon"
        imageUrl={faviconUrlOverride ?? currentFavicon?.url ?? ""}
        onChange={({ url, mediaId }) => {
          setFaviconUrlOverride(url);
          setFaviconMediaId(mediaId);
        }}
      />
      <TextField
        id="contact_email"
        label="Contact email"
        value={contactEmail}
        onChange={(e) => setContactEmail(e.target.value)}
      />
      <TextField
        id="contact_phone"
        label="Contact phone"
        value={contactPhone}
        onChange={(e) => setContactPhone(e.target.value)}
      />
      <TextField
        id="callback_phone"
        label="Callback phone (shown on every “request a callback” section)"
        value={callbackPhone}
        onChange={(e) => setCallbackPhone(e.target.value)}
      />
      <TextField
        id="whatsapp_number"
        label="WhatsApp number (digits with country code, e.g. 919000012345)"
        value={whatsappNumber}
        onChange={(e) => setWhatsappNumber(e.target.value)}
      />
      <TextField
        id="contact_address"
        label="Contact address"
        value={contactAddress}
        onChange={(e) => setContactAddress(e.target.value)}
      />
      <Button
        className="self-start"
        disabled={isSaving}
        onClick={() =>
          onSave({
            site_name: siteName,
            contact_email: contactEmail,
            contact_phone: contactPhone,
            callback_phone: callbackPhone,
            whatsapp_number: whatsappNumber,
            contact_address: contactAddress,
            logo_media_id: logoMediaId,
            favicon_media_id: faviconMediaId,
          })
        }
      >
        {isSaving ? "Saving…" : "Save General Settings"}
      </Button>
    </div>
  );
}
