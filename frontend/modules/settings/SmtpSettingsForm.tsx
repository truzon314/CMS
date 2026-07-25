"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TextField } from "@/components/forms/TextField";
import type { Settings, SettingsUpdatePayload } from "@/types/settings";

interface SmtpSettingsFormProps {
  settings: Settings;
  isSaving: boolean;
  onSave: (payload: SettingsUpdatePayload) => void;
}

export function SmtpSettingsForm({ settings, isSaving, onSave }: SmtpSettingsFormProps) {
  const [host, setHost] = useState(settings.smtp_host ?? "");
  const [port, setPort] = useState(settings.smtp_port ?? 587);
  const [username, setUsername] = useState(settings.smtp_username ?? "");
  const [password, setPassword] = useState(settings.smtp_password ?? "");
  const [fromEmail, setFromEmail] = useState(settings.smtp_from_email ?? "");
  const [useTls, setUseTls] = useState(settings.smtp_use_tls);

  return (
    <div className="flex flex-col gap-3 max-w-lg">
      <p className="text-sm text-neutral-500">
        Once a host is set, password-reset and other system emails send for real instead of just
        logging to the server console.
      </p>
      <TextField id="smtp_host" label="SMTP host" value={host} onChange={(e) => setHost(e.target.value)} />
      <TextField
        id="smtp_port"
        label="Port"
        type="number"
        value={port}
        onChange={(e) => setPort(Number(e.target.value))}
      />
      <TextField id="smtp_username" label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <TextField
        id="smtp_password"
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <TextField
        id="smtp_from_email"
        label="From email"
        value={fromEmail}
        onChange={(e) => setFromEmail(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <Checkbox id="smtp_use_tls" checked={useTls} onCheckedChange={(checked) => setUseTls(checked === true)} />
        <Label htmlFor="smtp_use_tls" className="font-normal">
          Use STARTTLS
        </Label>
      </div>
      <Button
        className="self-start"
        disabled={isSaving}
        onClick={() =>
          onSave({
            smtp_host: host || null,
            smtp_port: port,
            smtp_username: username || null,
            smtp_password: password || null,
            smtp_from_email: fromEmail || null,
            smtp_use_tls: useTls,
          })
        }
      >
        {isSaving ? "Saving…" : "Save SMTP Settings"}
      </Button>
    </div>
  );
}
