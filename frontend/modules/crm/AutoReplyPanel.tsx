"use client";

import { useEffect, useState } from "react";
import { AppDrawer } from "@/components/ui/app-drawer";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAutoReplyConfig, useUpdateAutoReplyConfig } from "@/hooks/useCrm";

interface AutoReplyPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AutoReplyPanel({ open, onClose }: AutoReplyPanelProps) {
  const { data: config } = useAutoReplyConfig();
  const updateConfig = useUpdateAutoReplyConfig();

  const [enabled, setEnabled] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setMessage(config.message);
    }
  }, [config]);

  const handleSave = () => {
    const body = message.trim();
    if (!body) return;
    updateConfig.mutate({ enabled, message: body }, { onSuccess: onClose });
  };

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title="Auto-Reply Settings"
      description="Sent automatically as the first reply when a visitor starts a new chat."
      width="sm"
      footer={
        <Button onClick={handleSave} disabled={updateConfig.isPending || !message.trim()}>
          Save
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="auto_reply_enabled"
            checked={enabled}
            onCheckedChange={(checked) => setEnabled(checked === true)}
          />
          <Label htmlFor="auto_reply_enabled" className="font-normal">
            Enable auto-reply
          </Label>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auto_reply_message">Message</Label>
          <Textarea
            id="auto_reply_message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Hi there! How can we help with your property search today?"
          />
        </div>
      </div>
    </AppDrawer>
  );
}
