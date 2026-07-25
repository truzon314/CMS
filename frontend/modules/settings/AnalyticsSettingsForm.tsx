"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/TextField";
import type { Settings, SettingsUpdatePayload } from "@/types/settings";

interface AnalyticsSettingsFormProps {
  settings: Settings;
  isSaving: boolean;
  onSave: (payload: SettingsUpdatePayload) => void;
}

export function AnalyticsSettingsForm({ settings, isSaving, onSave }: AnalyticsSettingsFormProps) {
  const [gaId, setGaId] = useState(settings.analytics_ga_measurement_id ?? "");

  return (
    <div className="flex flex-col gap-3 max-w-lg">
      <TextField
        id="analytics_ga_id"
        label="Google Analytics Measurement ID"
        placeholder="G-XXXXXXXXXX"
        value={gaId}
        onChange={(e) => setGaId(e.target.value)}
      />
      <Button
        className="self-start"
        disabled={isSaving}
        onClick={() => onSave({ analytics_ga_measurement_id: gaId || null })}
      >
        {isSaving ? "Saving…" : "Save Analytics Settings"}
      </Button>
    </div>
  );
}
