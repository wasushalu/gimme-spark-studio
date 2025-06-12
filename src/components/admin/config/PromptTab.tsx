
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PromptTabProps {
  config: any;
  setConfig: (config: any) => void;
}

export default function PromptTab({ config, setConfig }: PromptTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="system-prompt">System Prompt</Label>
        <Textarea
          id="system-prompt"
          placeholder="Enter the system prompt for this agent..."
          value={config.prompt}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            prompt: e.target.value
          }))}
          rows={10}
        />
      </div>
    </div>
  );
}
