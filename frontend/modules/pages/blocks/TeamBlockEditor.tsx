import { ImagePickerField } from "@/components/forms/ImagePickerField";
import { TextField } from "@/components/forms/TextField";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RepeatableItemList } from "@/modules/pages/blocks/RepeatableItemList";
import type { TeamConfig, TeamMember } from "@/types/blockConfigs";

interface Props {
  config: TeamConfig;
  onChange: (config: TeamConfig) => void;
}

export function TeamBlockEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        id="team_heading"
        label="Heading (optional)"
        value={config.heading}
        onChange={(e) => onChange({ ...config, heading: e.target.value })}
      />

      <RepeatableItemList<TeamMember>
        items={config.members}
        onChange={(members) => onChange({ ...config, members })}
        newItem={() => ({ name: "", role: "", photo_url: "", photo_media_id: null, bio: "" })}
        addLabel="Add team member"
        itemLabel={(i) => `Member ${i + 1}`}
        renderItem={(item, update, index) => (
          <>
            <TextField id={`team_name_${index}`} label="Name" value={item.name} onChange={(e) => update({ name: e.target.value })} />
            <TextField id={`team_role_${index}`} label="Role" value={item.role} onChange={(e) => update({ role: e.target.value })} />
            <ImagePickerField
              label="Photo"
              imageUrl={item.photo_url}
              onChange={({ url, mediaId }) => update({ photo_url: url, photo_media_id: mediaId })}
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`team_bio_${index}`}>Bio</Label>
              <Textarea id={`team_bio_${index}`} rows={2} value={item.bio} onChange={(e) => update({ bio: e.target.value })} />
            </div>
          </>
        )}
      />
    </div>
  );
}
