"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/TextField";
import type { Settings, SettingsUpdatePayload } from "@/types/settings";

interface SocialLinksFormProps {
  settings: Settings;
  isSaving: boolean;
  onSave: (payload: SettingsUpdatePayload) => void;
}

export function SocialLinksForm({ settings, isSaving, onSave }: SocialLinksFormProps) {
  const [facebook, setFacebook] = useState(settings.social_facebook_url ?? "");
  const [instagram, setInstagram] = useState(settings.social_instagram_url ?? "");
  const [linkedin, setLinkedin] = useState(settings.social_linkedin_url ?? "");
  const [youtube, setYoutube] = useState(settings.social_youtube_url ?? "");

  return (
    <div className="flex flex-col gap-3 max-w-lg">
      <TextField id="social_facebook" label="Facebook URL" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
      <TextField id="social_instagram" label="Instagram URL" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
      <TextField id="social_linkedin" label="LinkedIn URL" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
      <TextField id="social_youtube" label="YouTube URL" value={youtube} onChange={(e) => setYoutube(e.target.value)} />
      <Button
        className="self-start"
        disabled={isSaving}
        onClick={() =>
          onSave({
            social_facebook_url: facebook,
            social_instagram_url: instagram,
            social_linkedin_url: linkedin,
            social_youtube_url: youtube,
          })
        }
      >
        {isSaving ? "Saving…" : "Save Social Links"}
      </Button>
    </div>
  );
}
